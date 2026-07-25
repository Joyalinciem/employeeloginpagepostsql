const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const { Pool } = require("pg");
const connectDB = require("./config/db");
const MongoUser = require("./models/User");
const MongoTask = require("./models/Task");
const MongoRole = require("./models/Role");
const MongoNotification = require("./models/Notification");
const MongoAudit = require("./models/Audit");
const MongoGroup = require("./models/Group");
const MongoChatMessage = require("./models/ChatMessage");
let User, Task, Role, Notification, Audit, Group, ChatMessage;
const DB_MODE = (process.env.DB_MODE || "mongodb").toLowerCase();
const PORT = process.env.PORT || 3000;
const chatConfig = {
  usersCanChatWithManagers: false,
  usersCanChatWithCtos: false,
  usersCanChatWithCfos: false,
  managersCanChatWithCtos: true,
  departmentChatEnabled: true,
};
const activeSockets = new Map();
const chatGroups = new Map();
const privateChatHistory = new Map();
const groupChatHistory = new Map();
const departmentChatHistory = new Map();

const getPrivateConversationKey = (userA, userB) => {
  const ids = [userA.toString(), userB.toString()].sort();
  return ids.join(":");
};

const savePrivateMessage = (payload) => {
  const key = getPrivateConversationKey(payload.from.id, payload.to);
  const history = privateChatHistory.get(key) || [];
  history.push(payload);
  privateChatHistory.set(key, history.slice(-200));
};

const saveGroupMessage = (groupId, payload) => {
  const history = groupChatHistory.get(groupId) || [];
  history.push(payload);
  groupChatHistory.set(groupId, history.slice(-200));
};

const saveDepartmentMessage = (department, payload) => {
  const history = departmentChatHistory.get(department) || [];
  history.push(payload);
  departmentChatHistory.set(department, history.slice(-200));
};

const sendMessageToUser = (userId, payload) => {
  const connection = activeSockets.get(userId);
  if (connection) {
    sendWsMessage(connection.socket, payload);
  }
};

const broadcastGroup = async (groupId, payload) => {
  // Try to find in database first
  let group = await Group.findById(groupId);
  if (!group) {
    // Fall back to in-memory groups
    group = chatGroups.get(groupId);
  }
  
  if (!group) return;
  
  const memberIds = group.members?.map(m => m.toString ? m.toString() : m) || [];
  for (const memberId of memberIds) {
    sendMessageToUser(memberId, payload);
  }
};

const http = require("http");
const url = require("url");
const WebSocket = require("ws");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { generateSecret, verify } = require('otplib');
const { generateTOTP } = require('@otplib/uri');
const { crypto } = require('@otplib/plugin-crypto-noble');
const { base32 } = require('@otplib/plugin-base32-scure');
const QRCode = require("qrcode");
const { logMiddleware, startLogArchiver } = require('./utils/logger');

// dotenv.config(); // already configured above

// =====================================
// Redis Client & Caching Setup
// =====================================
const redis = require("redis");
let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
redisClient = redis.createClient({ url: redisUrl });

// Optional connection: try to connect, but continue with in‑memory cache on failure
(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis Client Connected");
    isRedisConnected = true;
  } catch (err) {
    console.warn("⚠️ Redis connection failed – falling back to in‑memory cache:", err?.message || err);
    isRedisConnected = false;
  }
})();

// Event listeners remain for when connection succeeds later
redisClient.on("error", (err) => {
  console.warn("⚠️ Redis Client Error:", err?.message || err);
  isRedisConnected = false;
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis Client disconnected");
  isRedisConnected = false;
});

function isRedisReady() {
  // Returns true if Redis client is connected and ready for commands
  return isRedisConnected && redisClient && typeof redisClient.isOpen !== 'undefined' ? redisClient.isOpen : false;
}

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

// Memory fallback stores
const memoryCache = new Map();
const memoryRateLimit = new Map();

async function getCache(key) {
  if (isRedisReady()) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn("Redis GET error:", err);
    }
  }
  const memData = memoryCache.get(key);
  if (memData && memData.expiry > Date.now()) {
    return memData.value;
  }
  return null;
}

async function setCache(key, value, ttlSeconds = 600) {
  if (isRedisReady()) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch (err) {
      console.warn("Redis SET error:", err);
    }
  }
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
}

async function clearCachePattern(pattern) {
  if (isRedisReady()) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return;
    } catch (err) {
      console.warn("Redis DEL pattern error:", err);
    }
  }
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*"));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

// =====================================
// API Rate Limiting Middleware
// =====================================
const rateLimitMiddleware = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const key = `ratelimit:${ip}`;
  const limit = 100; // max 100 requests
  const windowSeconds = 60; // per 60 seconds

  if (isRedisReady()) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count));
      if (count > limit) {
        return res.status(429).json({ message: "Too many requests. Please try again in a minute." });
      }
      return next();
    } catch (err) {
      console.warn("Redis Rate Limiter error, falling back to memory:", err);
    }
  }

  // Memory fallback rate limiter
  const now = Date.now();
  let record = memoryRateLimit.get(key);
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + (windowSeconds * 1000)
    };
    memoryRateLimit.set(key, record);
  } else {
    record.count += 1;
  }

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - record.count));
  if (record.count > limit) {
    return res.status(429).json({ message: "Too many requests. Please try again in a minute." });
  }
  next();
};

const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/chat' });
wss.activeSockets = activeSockets;
wss.chatGroups = chatGroups;
wss.privateChatHistory = privateChatHistory;
wss.groupChatHistory = groupChatHistory;
wss.departmentChatHistory = departmentChatHistory;
wss.sendMessageToUser = sendMessageToUser;
wss.broadcastGroup = broadcastGroup;
const initChatSocket = require('./sockets/chatSocket');
initChatSocket(wss);
app.use(cors());
const frontendPath = path.resolve(__dirname, 'frontend');
console.log('🔧 Frontend path resolved to:', frontendPath);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(logMiddleware);
app.use("/api", rateLimitMiddleware);
app.use('/api/chat', require('./routes/chatRoutes'));
// MongoDB connection will be initialized after seedRoles() is defined.
// Serve static employee-facing frontend files
app.use(express.static(frontendPath));
app.use('/api/auth', require('./routes/authRoutes'));
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});
app.get('/mfa_demo.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'mfa_demo.html'));
});
// =====================================
// PostgreSQL Connection & Data Helpers
// =====================================

const MAX_RETRIES = 5;
let retryCount = 0;
const postgresUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/taskmanager';
const pool = new Pool({ connectionString: postgresUrl });

const camelCase = (str) => str.replace(/_([a-z])/g, (_, chr) => chr.toUpperCase());
const snakeCase = (str) => {
  const normalized = str === '_id' ? 'id' : str.replace(/([A-Z])/g, '_$1').toLowerCase();
  return normalized;
};

const normalizeRow = (row) => {
  if (!row) return null;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === '__v' || key.startsWith('__')) {
      continue;
    }
    const camelKey = camelCase(key);
    normalized[camelKey] = value;
    if (key === 'id') {
      normalized['_id'] = value;
    }
  }
  return normalized;
};

const normalizeInput = (data) => {
  const result = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined) continue;
    const dbKey = snakeCase(key === '_id' ? 'id' : key);
    result[dbKey] = value;
  }
  return result;
};

const buildWhereClause = (filter = {}, startIndex = 1) => {
  const clauses = [];
  const values = [];

  for (const [rawKey, rawValue] of Object.entries(filter)) {
    const key = snakeCase(rawKey === '_id' ? 'id' : rawKey);
    const value = rawValue;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, opValue] of Object.entries(value)) {
        if (op === '$ne') {
          if (opValue === null) {
            clauses.push(`${key} IS NOT NULL`);
          } else {
            clauses.push(`${key} != $${values.length + startIndex}`);
            values.push(opValue);
          }
        } else if (op === '$in') {
          clauses.push(`${key} = ANY($${values.length + startIndex})`);
          values.push(opValue);
        } else if (op === '$nin') {
          clauses.push(`NOT (${key} = ANY($${values.length + startIndex}))`);
          values.push(opValue);
        } else if (op === '$gt' || op === '$gte' || op === '$lt' || op === '$lte') {
          const operator = op.replace('$', '');
          clauses.push(`${key} ${operator} $${values.length + startIndex}`);
          values.push(opValue);
        }
      }
    } else if (Array.isArray(value)) {
      clauses.push(`${key} = ANY($${values.length + startIndex})`);
      values.push(value);
    } else if (value === null) {
      clauses.push(`${key} IS NULL`);
    } else {
      clauses.push(`${key} = $${values.length + startIndex}`);
      values.push(value);
    }
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
};

const buildOrderBy = (sort) => {
  const clauses = [];
  const normalizedSort = sort || {};
  for (const [field, direction] of Object.entries(normalizedSort)) {
    const dbField = snakeCase(field);
    const dir = direction === -1 || direction === 'desc' ? 'DESC' : 'ASC';
    clauses.push(`${dbField} ${dir}`);
  }
  return clauses.length ? `ORDER BY ${clauses.join(', ')}` : '';
};

const buildSelect = (select) => {
  if (!select) {
    return '*';
  }
  const fields = typeof select === 'string' ? select.split(/\s+/).filter(Boolean) : select;
  return fields.map((field) => snakeCase(field === '_id' ? 'id' : field)).join(', ');
};

const runQuery = async (text, values = []) => {
  const response = await pool.query(text, values);
  return response;
};

const queryRows = async (table, filter = {}, options = {}) => {
  const where = buildWhereClause(filter);
  const select = buildSelect(options.select);
  const order = buildOrderBy(options.sort);
  const limit = options.limit ? `LIMIT ${parseInt(options.limit, 10)}` : '';
  const offset = options.skip ? `OFFSET ${parseInt(options.skip, 10)}` : '';

  const text = `SELECT ${select} FROM ${table} ${where.clause} ${order} ${limit} ${offset}`.trim();
  const result = await runQuery(text, where.values);
  return result.rows.map(normalizeRow);
};

const queryCount = async (table, filter = {}) => {
  const where = buildWhereClause(filter);
  const text = `SELECT COUNT(*) AS count FROM ${table} ${where.clause}`.trim();
  const result = await runQuery(text, where.values);
  return parseInt(result.rows[0]?.count || 0, 10);
};

const insertRow = async (table, data = {}) => {
  const insertData = normalizeInput(data);
  if (!insertData.id) {
    insertData.id = randomUUID();
  }
  if (!insertData.created_at) {
    insertData.created_at = new Date().toISOString();
  }
  insertData.updated_at = new Date().toISOString();

  const keys = Object.keys(insertData);
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
  const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const result = await runQuery(text, Object.values(insertData));
  return normalizeRow(result.rows[0]);
};

const updateRows = async (table, filter = {}, update = {}, returning = false) => {
  const updateData = normalizeInput(update);
  if (Object.keys(updateData).length === 0) {
    return returning ? [] : 0;
  }
  updateData.updated_at = new Date().toISOString();

  const keys = Object.keys(updateData);
  const setClauses = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
  const values = Object.values(updateData);
  const where = buildWhereClause(filter, keys.length + 1);
  const text = `UPDATE ${table} SET ${setClauses} ${where.clause} ${returning ? 'RETURNING *' : ''}`.trim();
  const result = await runQuery(text, [...values, ...where.values]);
  return returning ? result.rows.map(normalizeRow) : result.rowCount;
};

const deleteRows = async (table, filter = {}) => {
  const where = buildWhereClause(filter);
  const text = `DELETE FROM ${table} ${where.clause} RETURNING *`.trim();
  const result = await runQuery(text, where.values);
  return result.rows.map(normalizeRow);
};

const createQuery = (table, filter = {}) => {
  const state = {
    filter,
    select: null,
    sort: null,
    limit: null,
    skip: null,
    populate: [],
    single: false,
  };

  const exec = async () => {
    const rows = await queryRows(table, state.filter, {
      select: state.select,
      sort: state.sort,
      limit: state.limit,
      skip: state.skip,
    });

    let result = rows;
    for (const pop of state.populate) {
      result = await populateResults(result, pop.field, pop.select);
    }

    return state.single ? result[0] || null : result;
  };

  const query = {
    select(selectArg) {
      state.select = selectArg;
      return query;
    },
    sort(sortArg) {
      state.sort = sortArg;
      return query;
    },
    limit(limitArg) {
      state.limit = limitArg;
      return query;
    },
    skip(skipArg) {
      state.skip = skipArg;
      return query;
    },
    populate(field, selectArg) {
      state.populate.push({ field, select: selectArg });
      return query;
    },
    one() {
      state.single = true;
      return query;
    },
    then(resolve, reject) {
      return exec().then(resolve, reject);
    },
    catch(reject) {
      return exec().catch(reject);
    },
    exec,
  };

  return query;
};

const populateResults = async (items, field, select) => {
  if (!items) return items;

  const records = Array.isArray(items) ? items : [items];
  const ids = [...new Set(records.map((item) => item?.[field]).filter(Boolean))];
  if (ids.length === 0) return items;

  const selectColumns = select ? buildSelect(select) : 'id, name, email, role, designation, profile_picture, created_at, updated_at';
  const text = `SELECT ${selectColumns} FROM users WHERE id = ANY($1)`;
  const result = await runQuery(text, [ids]);
  const usersById = result.rows.reduce((acc, row) => {
    const normalized = normalizeRow(row);
    acc[normalized.id] = normalized;
    return acc;
  }, {});

  for (const record of records) {
    if (record && record[field]) {
      record[field] = usersById[record[field]] || null;
    }
  }

  return Array.isArray(items) ? records : records[0];
};

const attachInstanceHelpers = (table, row) => {
  if (!row) return null;

  Object.defineProperty(row, '_table', { value: table, enumerable: false, writable: false });

  row.save = async function () {
    const payload = { ...this };
    delete payload.save;
    delete payload.deleteOne;
    delete payload._table;
    delete payload.then;
    delete payload.catch;
    delete payload.populate;

    if (!payload.id && payload._id) {
      payload.id = payload._id;
    }

    const id = payload.id || payload._id;
    if (!id) {
      const inserted = await insertRow(table, payload);
      Object.assign(this, inserted);
      return this;
    }

    const payloadToUpdate = { ...payload };
    delete payloadToUpdate.id;
    delete payloadToUpdate._id;

    const updated = await updateRows(table, { id }, payloadToUpdate, true);
    if (updated && updated[0]) {
      Object.assign(this, updated[0]);
    }
    return this;
  };

  row.deleteOne = async function () {
    await deleteRows(table, { id: this.id || this._id });
    return;
  };

  row.populate = async function (field, selectArg) {
    const populated = await populateResults(this, field, selectArg);
    Object.assign(this, populated);
    return this;
  };

  return row;
};

const createModel = (table) => {
  const Model = function (data = {}) {
    const instance = Object.assign({}, normalizeRow(normalizeInput(data)));
    if (!instance.id && data._id) {
      instance.id = data._id;
    }
    attachInstanceHelpers(table, instance);
    return instance;
  };

  Model.find = (filter = {}) => createQuery(table, filter);
  Model.findById = (id) => createQuery(table, { id }).one();
  Model.findOne = (filter = {}) => createQuery(table, filter).limit(1).one();
  Model.create = async (data = {}) => {
    const row = await insertRow(table, data);
    return attachInstanceHelpers(table, row);
  };
  Model.updateOne = async (filter, update, options = {}) => {
    if (update && update.$set) {
      update = update.$set;
    }
    if (options.upsert) {
      const existing = await Model.findOne(filter);
      if (existing) {
        await updateRows(table, filter, update);
        return existing;
      }
      return Model.create({ ...filter, ...update });
    }

    const updated = await updateRows(table, filter, update, options.new || false);
    return options.new ? updated[0] || null : updated;
  };
  Model.updateMany = async (filter, update) => {
    if (update && update.$set) {
      update = update.$set;
    }
    return updateRows(table, filter, update, false);
  };
  Model.findOneAndUpdate = async (filter, update, options = {}) => {
    if (update && update.$set) {
      update = update.$set;
    }
    const updated = await updateRows(table, filter, update, true);
    return updated[0] || null;
  };
  Model.findByIdAndDelete = async (id) => {
    const deleted = await deleteRows(table, { id });
    return deleted[0] || null;
  };
  Model.exists = async (filter) => {
    const count = await queryCount(table, filter);
    return count > 0;
  };
  Model.countDocuments = async (filter = {}) => queryCount(table, filter);
  Model.deleteMany = async (filter = {}) => {
    const deleted = await deleteRows(table, filter);
    return deleted.length;
  };

  return Model;
};

const ensureTables = async () => {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      can_update_tasks BOOLEAN DEFAULT true,
      can_delete_tasks BOOLEAN DEFAULT false,
      can_update_users BOOLEAN DEFAULT false,
      can_delete_users BOOLEAN DEFAULT false,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      designation TEXT DEFAULT '',
      department TEXT DEFAULT '',
      approved BOOLEAN DEFAULT false,
      otp TEXT,
      otp_expiry BIGINT,
      mfa_enabled BOOLEAN DEFAULT false,
      mfa_method TEXT DEFAULT 'none',
      mfa_secret TEXT DEFAULT '',
      old_password TEXT DEFAULT '',
      profile_picture TEXT DEFAULT '',
      can_update_tasks BOOLEAN DEFAULT true,
      can_delete_tasks BOOLEAN DEFAULT false,
      can_update_users BOOLEAN DEFAULT false,
      can_delete_users BOOLEAN DEFAULT false,
      manager_id TEXT REFERENCES users(id),
      cto_id TEXT REFERENCES users(id),
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `);

  const userMigrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry BIGINT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method TEXT DEFAULT 'none'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS old_password TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_update_tasks BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_delete_tasks BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_update_users BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_delete_users BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS cto_id TEXT"
  ];
  for (const migration of userMigrations) {
    try { await runQuery(migration); } catch (err) {}
  }

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      manager_id TEXT REFERENCES users(id),
      cto_id TEXT REFERENCES users(id),
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      due_date timestamptz,
      priority TEXT DEFAULT 'low',
      status TEXT DEFAULT 'open',
      thumbnail TEXT DEFAULT '',
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      type TEXT DEFAULT 'default',
      read BOOLEAN DEFAULT false,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id),
      target_id TEXT REFERENCES users(id),
      action TEXT,
      details JSONB DEFAULT '{}',
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW()
    )
  `);

  await runQuery(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_audits_actor_id ON audits(actor_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_audits_target_id ON audits(target_id)`);
};

const connectWithRetry = async () => {
  try {
    console.log('Attempting PostgreSQL connection...');
    await runQuery('SELECT 1');
    console.log('✅ PostgreSQL connected');
    await ensureTables();
    await seedRoles();
    console.log('Default roles initialized');
  } catch (err) {
    console.error(`PostgreSQL connection error (retry ${retryCount + 1}):`, err?.message || err);
    console.error(err?.stack || err);
    retryCount += 1;
    if (retryCount < MAX_RETRIES) {
      setTimeout(connectWithRetry, 3000);
    } else {
      console.error('❌ Max retries reached – exiting process');
      process.exit(1);
    }
  }
};

const initDatabase = async () => {
  if (DB_MODE === 'postgres') {
    try {
      console.log('Attempting PostgreSQL connection...');
      await runQuery('SELECT 1');
      console.log('✅ PostgreSQL connected');
      await ensureTables();
      console.log('✅ PostgreSQL tables ensured');
      User = createModel('users');
      Task = createModel('tasks');
      Role = createModel('roles');
      Notification = createModel('notifications');
      Audit = createModel('audits');
      await seedRoles();
      console.log('Default roles initialized in PostgreSQL');
    } catch (err) {
      console.error('PostgreSQL initialization error:', err?.message || err);
      console.error(err?.stack || err);
      process.exit(1);
    }
  } else {
    await connectDB();
    User = MongoUser;
    Task = MongoTask;
    Role = MongoRole;
    Notification = MongoNotification;
    Audit = MongoAudit;
    Group = MongoGroup;
    ChatMessage = MongoChatMessage;
    await seedRoles();
    console.log('Default roles initialized in MongoDB');
  }
};

process.on('SIGINT', async () => {
  try {
    if (DB_MODE === 'postgres') {
      await pool.end();
      console.log('PostgreSQL connection closed (SIGINT)');
    } else {
      await mongoose.disconnect();
      console.log('MongoDB connection closed (SIGINT)');
    }
  } catch (err) {
    console.warn('Error closing database connection:', err?.message || err);
  }
  process.exit(0);
});
process.on('SIGTERM', async () => {
  try {
    if (DB_MODE === 'postgres') {
      await pool.end();
      console.log('PostgreSQL connection closed (SIGTERM)');
    } else {
      await mongoose.disconnect();
      console.log('MongoDB connection closed (SIGTERM)');
    }
  } catch (err) {
    console.warn('Error closing database connection:', err?.message || err);
  }
  process.exit(0);
});

const seedRoles = async () => {
  const defaultRoles = [
    { name: 'admin', displayName: 'Admin', canUpdateTasks: true, canDeleteTasks: true, canUpdateUsers: true, canDeleteUsers: true },
    { name: 'cto', displayName: 'CTO', canUpdateTasks: true, canDeleteTasks: false, canUpdateUsers: false, canDeleteUsers: false },
    { name: 'manager', displayName: 'Manager', canUpdateTasks: true, canDeleteTasks: false, canUpdateUsers: false, canDeleteUsers: false },
    { name: 'user', displayName: 'User', canUpdateTasks: true, canDeleteTasks: false, canUpdateUsers: false, canDeleteUsers: false },
  ];

  for (const roleData of defaultRoles) {
    await Role.updateOne({ name: roleData.name }, { $set: {
      ...roleData,
      name: roleData.name,
    } }, { upsert: true });
  }
};

// =====================================
// Helper: create an in-app notification
const createNotification = async (userId, message, type = 'default') => {
  try {
    await Notification.create({ userId, message, type });
  } catch (e) {
    console.error('Failed to create notification:', e.message);
  }
};

// =====================================
// Mail Transporter
// =====================================

let transporter;
if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('example')) {
  // Development fallback: log emails to console
  transporter = {
    sendMail: async (options) => {
      console.log('✉️  Mock email sent:', options);
      return Promise.resolve();
    },
  };
} else {
  const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}
const sendDecisionEmail = async (user, accepted) => {
  const subject = accepted
    ? "Your account has been approved"
    : "Your account request has been rejected";

  const text = accepted
    ? `Hello ${user.name},\n\nYour registration request has been approved by the admin. You can now log in with your credentials. Thank you!`
    : `Hello ${user.name},\n\nYour registration request has been rejected by the admin. Sorry for the inconvenience.`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com',
      to: user.email,
      subject,
      text,
    });
  } catch (mailError) {
    console.error('Failed to send decision email:', mailError);
  }
};
const sendAssignmentNotificationEmail = async (recipient, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com',
      to: recipient.email,
      subject,
      text,
    });
  } catch (mailError) {
    console.error('Failed to send assignment notification email:', mailError);
  }
};

// =====================================
// JWT Middleware

const authMiddleware = async (req, res, next) => {
  // Extract token from Authorization header (Bearer <token>) or query string.
  const token =
    req.headers.authorization?.split(' ')[1] ||
    req.headers.authorization ||
    req.query.token;

  console.log('AUTH MIDDLEWARE TOKEN:', token);

  if (!token) {
    return res.status(401).json({
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log('AUTH DECODED:', decoded);

    const user = await User.findById(decoded.id)
      .populate('managerId', 'name email')
      .populate('ctoId', 'name email');

    console.log('AUTH USER FOUND:', !!user, user?._id?.toString());

    if (!user) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      designation: user.designation || "",
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      profilePicture: user.profilePicture || "",
      canUpdateTasks: user.canUpdateTasks,
      canDeleteTasks: user.canDeleteTasks,
      canUpdateUsers: user.canUpdateUsers,
      canDeleteUsers: user.canDeleteUsers,
      manager: user.managerId ? { id: user.managerId._id, name: user.managerId.name, email: user.managerId.email } : null,
      cto: user.ctoId ? { id: user.ctoId._id, name: user.ctoId.name, email: user.ctoId.email } : null,
    };

    next();
  } catch (error) {
    console.log('AUTH ERROR', error.message);
    return res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

// =====================================
// Home Route
// =====================================

app.get("/api/public/roles", async (req, res) => {
  try {
    const roles = await Role.find({
      name: { $ne: "admin" }
    }).sort({ name: 1 });

    res.json(roles);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch roles"
    });
  }
});

// Admin: Create a new role
app.post("/api/admin/roles", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, displayName, canUpdateTasks, canDeleteTasks, canUpdateUsers, canDeleteUsers } = req.body;
    if (!name) return res.status(400).json({ message: "Role name is required" });

    const existing = await Role.findOne({ name: name.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Role already exists" });

    const role = await Role.create({
      name: name.toLowerCase(),
      displayName: displayName || name,
      canUpdateTasks: canUpdateTasks ?? true,
      canDeleteTasks: canDeleteTasks ?? false,
      canUpdateUsers: canUpdateUsers ?? false,
      canDeleteUsers: canDeleteUsers ?? false,
    });
    res.status(201).json(role);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create role" });
  }
});

// Admin: Delete a role (prevent deleting built-in roles)
app.delete("/api/admin/roles/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const builtIn = ['admin', 'user', 'manager', 'cto'];
    if (builtIn.includes(role.name)) {
      return res.status(403).json({ message: "Cannot delete built-in role" });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: "Role deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete role" });
  }
});

// =====================================
// Register
// =====================================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role, profilePicture } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.json({
        message: "User already exists",
      });
    }

    // Get all roles except admin
    const availableRoles = await Role.find({
      name: { $ne: "admin" }
    }).select("name");

    const allowedRoles = availableRoles.map(r => r.name);

    const requestedRole = allowedRoles.includes(role)
      ? role
      : "user";

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const approvedAdminExists = await User.exists({ role: "admin", approved: true });
    const isFirstAdmin = !approvedAdminExists;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: isFirstAdmin ? "admin" : requestedRole,
      approved: isFirstAdmin,
      profilePicture: profilePicture || "",
    });

    await user.save();

    res.json({
      message: isFirstAdmin
        ? "Registration successful. Admin account created and ready to log in."
        : "Registration successful. Pending admin approval. You will receive an email once approved.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// =====================================
// Login
// =====================================
// This endpoint authenticates user credentials.
// If MFA is enabled for the user, it responds with { requiresMFA: true, mfaMethod: "email" | "totp" }.
// The client must then call /api/verify-mfa with the received OTP (email) or TOTP code (Google Authenticator).
// Upon successful verification, a JWT token is returned.

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials, login with correct email / password",
      });
    }

    // Auto-approve admin users on login. Non-admin users require approval.
    if (user.role === "admin" && !user.approved) {
      user.approved = true;
      await user.save();
    } else if (!user.approved) {
      console.log(`Login attempt for unapproved user: ${email}, role: ${user.role}`);
      return res.status(403).json({ message: "Account pending admin approval. Please wait for admin to review your request." });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      // Check if they entered their old password
      if (user.oldPassword) {
        const isOldMatch = await bcrypt.compare(password, user.oldPassword);
        if (isOldMatch) {
          return res.status(401).json({
            message: "Login unsuccessful. Password has been changed, login with new password",
          });
        }
      }
      return res.status(401).json({
        message: "Invalid credentials, login with correct email / password",
      });
    }

    if (user.mfaEnabled) {
      if (user.mfaMethod === "email") {
        const otp = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

        user.otp = otp;
        user.otpExpiry = expiryTime;
        await user.save();

        console.log('📧 MFA login OTP generated', { email, otp, expiryTime });

        let emailSent = false;
        try {
          await transporter.sendMail({
            from: process.env.FROM_ADDRESS || process.env.EMAIL_USER,
            to: email,
            subject: "MFA Verification Code",
            html: `
              <div style="
                font-family:Arial;
                padding:25px;
                background:#f5f5f5;
              ">
                <div style="
                  background:white;
                  padding:30px;
                  border-radius:10px;
                ">
                  <h2 style="color:#0072ff;">
                    MFA Verification Code
                  </h2>

                  <p>
                    Use the following verification code to complete your login:
                  </p>

                  <h1 style="
                    color:#ff512f;
                    letter-spacing:6px;
                    text-align:center;
                  ">
                    ${otp}
                  </h1>

                  <p style="
                    color:red;
                    font-weight:bold;
                  ">
                    This verification code is valid only for 5 minutes.
                  </p>
                </div> 
              </div>
            `,
          });
          emailSent = true;
        } catch (mailErr) {
          console.error("⚠️ Login MFA email delivery failed, using fallback:", mailErr?.message || mailErr);
        }

        return res.json({
          requiresMFA: true,
          mfaMethod: "email",
          email: user.email,
          mockOtp: otp
        });
      } else if (user.mfaMethod === "totp") {
        return res.json({
          requiresMFA: true,
          mfaMethod: "totp",
          email: user.email,
        });
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// =====================================
// Profile
// =====================================

app.get(
  "/api/profile",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("PROFILE REQ USER", req.user);
      res.json(req.user);
    } catch (error) {
      console.log("PROFILE ERROR", error);
      res.status(500).json({
        message: "Failed to get profile",
        error: error.message,
      });
    }
  }
);

app.put(
  "/api/profile",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.email !== undefined) user.email = req.body.email;
      if (req.body.designation !== undefined) user.designation = req.body.designation;
          if (req.body.department !== undefined) user.department = req.body.department;
      if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;

      await user.save();
      res.json({
        message: "Profile updated successfully", user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation,
          department: user.department,
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

app.get(
  "/api/dashboard-stats",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const filter = req.user.role === "admin" ? {} : { userId };
      const totalTasks = await Task.countDocuments(filter);
      const pendingTasks = await Task.countDocuments({ ...filter, status: { $ne: "completed" } });
      const completedTasks = await Task.countDocuments({ ...filter, status: "completed" });

      const approvedRequests = await User.countDocuments({ approved: true });
      const nonApprovedRequests = await User.countDocuments({ approved: false });

      res.json({
        totalTasks,
        pendingTasks,
        completedTasks,
        approvedRequests,
        nonApprovedRequests
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  }
);

// =====================================
// Notifications API
// =====================================

app.get(
  "/api/notifications",
  authMiddleware,
  async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }
);

app.put(
  "/api/notifications/:id/read",
  authMiddleware,
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { read: true },
        { new: true }
      );
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }
);

app.put(
  "/api/notifications/read-all",
  authMiddleware,
  async (req, res) => {
    try {
      await Notification.updateMany(
        { userId: req.user.id, read: false },
        { read: true }
      );
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  }
);

// Admin: fetch recent assignment audit logs
app.get('/api/admin/assignment-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const skip = (page - 1) * limit;
    const total = await Audit.countDocuments();
    const logs = await Audit.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email role')
      .populate('targetId', 'name email role');

    res.json({ logs, page, limit, total });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to fetch assignment logs' });
  }
});

// Export assignment logs as CSV (admin only)
app.get('/api/admin/assignment-logs/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await Audit.find().sort({ createdAt: -1 }).populate('actorId', 'name email role').populate('targetId', 'name email role');
    // Build CSV
    const header = ['timestamp', 'action', 'actor_email', 'actor_name', 'target_email', 'target_name', 'details'];
    const rows = logs.map(l => [
      l.createdAt.toISOString(),
      l.action,
      l.actorId?.email || '',
      l.actorId?.name || '',
      l.targetId?.email || '',
      l.targetId?.name || '',
      JSON.stringify(l.details || {})
    ]);

    const csv = [header.join(','), ...rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assignment-logs.csv"');
    res.send(csv);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to export assignment logs' });
  }
});

// =====================================
// MFA Routes
// =====================================
// Email MFA: Generates a 6‑digit OTP, stores it on the user record, and sends it via email.
// TOTP (Google Authenticator): Uses otplib's TOTP implementation. The secret is generated during setup and stored on the user.
// Verify MFA (both methods) is handled by /api/verify-mfa.
// The endpoint validates the provided code and returns a JWT on success.

app.post("/api/verify-mfa", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    console.log('🔍 verify-mfa request', { email, code, userId: user ? user._id : null });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.mfaEnabled) {
      return res.status(400).json({ message: "MFA is not enabled for this user" });
    }

    if (user.mfaMethod === "email") {
      console.log('📧 Email MFA check', { storedOtp: user.otp, receivedCode: code, expiry: user.otpExpiry });
      if (user.otp !== code) {
        return res.json({ message: "Invalid verification code" });
      }
      if (Date.now() > user.otpExpiry) {
        return res.json({ message: "Verification code expired. Please log in again." });
      }
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else if (user.mfaMethod === "totp") {
      console.log('🔐 TOTP verification', { secret: user.mfaSecret, token: code });
      const isValid = await verify({ token: code, secret: user.mfaSecret, crypto, base32 });
      if (!isValid.valid) {
        return res.json({ message: "Invalid Authenticator App code" });
      }
    } else {
      return res.status(400).json({ message: "Invalid MFA method" });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA verification failed" });
  }
});

app.post("/api/mfa/setup", authMiddleware, async (req, res) => {
  try {
    const { method } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === "email") {
      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

      user.otp = otp;
      user.otpExpiry = expiryTime;
      await user.save();

      console.log('📧 MFA setup OTP (email) generated', { email: user.email, otp, expiryTime });

      let emailSent = false;
      try {
        await transporter.sendMail({
          from: process.env.FROM_ADDRESS || process.env.EMAIL_USER,
          to: user.email,
          subject: "MFA Setup Verification Code",
          html: `
            <div style="
              font-family:Arial;
              padding:25px;
              background:#f5f5f5;
            ">
              <div style="
                background:white;
                padding:30px;
                border-radius:10px;
              ">
                <h2 style="color:#0072ff;">
                  MFA Setup
                </h2>
                <p>
                  Use the following verification code to enable Email MFA:
                </p>
                <h1 style="
                  color:#ff512f;
                  letter-spacing:6px;
                  text-align:center;
                ">
                  ${otp}
                </h1>
                <p style="
                  color:red;
                  font-weight:bold;
                ">
                  This verification code is valid only for 5 minutes.
                </p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("⚠️ MFA setup email delivery failed, using fallback:", mailErr?.message || mailErr);
      }

      res.json({ 
        message: emailSent ? "Verification code sent to your email" : "Verification code generated (Email delivery failed or in dev mode — check code below)",
        mockOtp: otp
      });
    } else if (method === "totp") {
      const secret = generateSecret({ crypto, base32 });
      console.log('🔐 Generated TOTP secret for setup', { email: user.email, secret });
      user.mfaSecret = secret;
      await user.save();

      const otpauth = generateTOTP({ issuer: "TaskManager", label: user.email, secret });
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      res.json({ secret, qrCodeUrl });
    } else {
      res.status(400).json({ message: "Invalid setup method" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA setup failed" });
  }
});

app.post("/api/mfa/verify-setup", authMiddleware, async (req, res) => {
  try {
    const { method, code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (method === "email") {
      if (user.otp !== code) {
        return res.json({ message: "Invalid verification code" });
      }
      if (Date.now() > user.otpExpiry) {
        return res.json({ message: "Verification code expired. Please try setup again." });
      }

      user.mfaEnabled = true;
      user.mfaMethod = "email";
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      res.json({ message: "Email MFA enabled successfully" });
    } else if (method === "totp") {
      const isValid = await verify({ token: code, secret: user.mfaSecret, crypto, base32 });

      if (!isValid.valid) {
        return res.json({ message: "Invalid Authenticator App code" });
      }

      user.mfaEnabled = true;
      user.mfaMethod = "totp";
      await user.save();

      res.json({ message: "Authenticator App MFA enabled successfully" });
    } else {
      res.status(400).json({ message: "Invalid verification method" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MFA verification failed" });
  }
});

app.get("/api/mfa/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch MFA status" });
  }
});

app.post("/api/mfa/disable", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.mfaEnabled = false;
    user.mfaMethod = null;
    user.mfaSecret = null;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "MFA disabled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to disable MFA" });
  }
});


// =====================================
// =====================================
// Forgot Password - 15 Minute OTP
// =====================================

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    // GENERATE 6 DIGIT OTP

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP VALID FOR 15 MINUTES

    const expiryTime =
      Date.now() + 15 * 60 * 1000;

    user.otp = otp;

    user.otpExpiry = expiryTime;

    await user.save();

    console.log("Generated OTP:", otp);

    // SEND EMAIL
    let emailSent = false;
    let previewUrl = null;
    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_ADDRESS || process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `
          <div style="
            font-family:Arial;
            padding:25px;
            background:#f5f5f5;
          ">
            <div style="
              background:white;
              padding:30px;
              border-radius:10px;
            ">
              <h2 style="color:#0072ff;">
                Password Reset OTP
              </h2>

              <p>
                Use the following OTP to reset your password:
              </p>

              <h1 style="
                color:#ff512f;
                letter-spacing:6px;
                text-align:center;
              ">
                ${otp}
              </h1>

              <p style="
                color:red;
                font-weight:bold;
              ">
                This OTP is valid only for 15 minutes.
              </p>

              <p>
                After 15 minutes the OTP expires automatically.
              </p>

              <p>
                If OTP expires, you must click
                <b>Send OTP</b> again.
              </p>
            </div>
          </div>
        `,
      });
      emailSent = true;
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("📧 Ethereal Email Preview URL:", previewUrl);
      }
    } catch (mailErr) {
      console.error("⚠️ Email delivery failed, providing OTP fallback:", mailErr?.message || mailErr);
    }

    res.json({
      message: emailSent
        ? "OTP sent successfully. OTP valid for 15 minutes."
        : "OTP generated. (Check OTP below or configure Gmail App Password for direct inbox delivery)",
      mockOtp: otp,
      previewUrl: previewUrl || undefined
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});


// =====================================
// =====================================
// Verify OTP
// =====================================

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    // CHECK OTP - Compare as strings
    const otpStr = String(otp).trim();
    const userOtpStr = String(user.otp).trim();
    
    console.log('OTP Verification:', { provided: otpStr, stored: userOtpStr, match: otpStr === userOtpStr });

    if (userOtpStr !== otpStr) {
      return res.json({
        message: "Invalid OTP",
      });
    }

    // CHECK EXPIRY

    if (Date.now() > user.otpExpiry) {
      return res.json({
        message:
          "OTP expired. Please click Send OTP again.",
      });
    }

    res.json({
      message:
        "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "OTP verification failed",
    });
  }
});

// =====================================
// Reset Password
// =====================================

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, newPassword } =
      req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.oldPassword = user.password;
    user.password = hashedPassword;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Password reset failed",
    });
  }
});

// =====================================
// Add Task
// =====================================

app.post(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {
    try {
      const { title, description, dueDate, priority } = req.body;
      if (!title || !description || !dueDate || !priority) {
        return res.status(400).json({ message: "All fields (Title, Description, Due Date, Priority) are compulsory." });
      }

      const task = new Task({
        userId: req.user.id,
        title: title || "",
        description: description || "",
        priority: priority || "low",
        dueDate: dueDate,
        status: (req.body.status === "Pending" || req.body.status === "pending") ? "open" : (req.body.status || "open"),
        thumbnail: req.body.thumbnail || "",
        managerId: req.body.managerId || null,
        ctoId: req.body.ctoId || null,
      });

      await task.save();
      await clearCachePattern("tasks:*");
      res.json(task);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to add task" });
    }
  }
);

app.put(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      // Allow owner or admin to edit
      if (req.user.role !== "admin" && (!task.userId || task.userId.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to edit this task" });
      }

      const oldManagerId = task.managerId ? task.managerId.toString() : null;

      // Update fields if provided
      const updatable = ["title", "description", "priority", "dueDate", "status", "thumbnail", "managerId", "ctoId"];
      updatable.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === "status" && (req.body[field] === "Pending" || req.body[field] === "pending")) {
            task[field] = "open";
          } else {
            task[field] = req.body[field];
          }
        }
      });

      await task.save();
      await clearCachePattern("tasks:*");

      // If manager assignment changed, send notification emails
      if (req.body.managerId && req.body.managerId !== oldManagerId) {
        const assignee = await User.findById(task.userId);
        const manager = await User.findById(req.body.managerId);
        if (assignee && manager) {
          await sendDecisionEmail(assignee, true);
          await sendAssignmentNotificationEmail(manager, "Task Assigned", `You have been assigned as manager for task: ${task.title}`);
        }
      }

      res.json(task);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update task" });
    }
  }
);

// Delete task (DELETE)
app.delete(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      if (req.user.role !== "admin" && (!task.userId || task.userId.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to delete this task" });
      }

      await task.deleteOne();
      await clearCachePattern("tasks:*");
      res.json({ message: "Task deleted" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  }
);

// =====================================
// Get Tasks
// =====================================

app.get(
  "/api/tasks",
  authMiddleware,
  async (req, res) => {
    try {
      const cacheKey = req.user.role === "admin" ? "tasks:admin" : `tasks:user:${req.user.id}`;
      const cachedTasks = await getCache(cacheKey);
      if (cachedTasks) {
        console.log(`🎯 Cache hit for key: ${cacheKey}`);
        return res.json(cachedTasks);
      }

      let tasks;

      if (req.user.role === "admin") {
        tasks = await Task.find().populate(
          "userId",
          "name email"
        );
      } else {
        tasks = await Task.find({
          userId: req.user.id,
        }).populate("userId", "name email");
      }

      await setCache(cacheKey, tasks, 600);
      res.json(tasks);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch tasks",
      });
    }
  }
);

app.get(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().select(
        "name email role designation department canUpdateTasks canDeleteTasks canUpdateUsers canDeleteUsers approved managerId ctoId profilePicture"
      );

      res.json(users);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Failed to fetch users",
      });
    }
  }
);

app.post(
  "/api/admin/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, email, password, role, designation, department, profilePicture } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newRole = role || "user";
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: newRole,
        designation: designation || "",
        department: department || "",
        profilePicture: profilePicture || "",
        approved: true,
      });

      const roleDefaults = await Role.findOne({ name: newRole });
      if (roleDefaults) {
        user.canUpdateTasks = roleDefaults.canUpdateTasks;
        user.canDeleteTasks = roleDefaults.canDeleteTasks;
        user.canUpdateUsers = roleDefaults.canUpdateUsers;
        user.canDeleteUsers = roleDefaults.canDeleteUsers;
      }

      await user.save();
      await sendAssignmentNotificationEmail(
        user,
        "Your account has been created",
        `Hello ${user.name},\n\nAn administrator has created an account for you with role ${user.role}. You can now log in with your credentials.\n\nBest regards,\nTeam`
      );

      res.json({ message: "User created successfully", user: { _id: user._id, name: user.name, email: user.email, role: user.role, approved: user.approved } });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

app.get(
  "/api/admin/roles",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const roles = await Role.find().sort({ name: 1 });
      res.json(roles);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  }
);

app.post(
  "/api/admin/roles",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, canUpdateTasks, canDeleteTasks, canUpdateUsers, canDeleteUsers } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }
      const normalizedRole = name.trim();
      const existingRole = await Role.findOne({ name: normalizedRole });
      if (existingRole) {
        return res.status(400).json({ message: "Role already exists" });
      }
      const role = await Role.create({
        name: normalizedRole,
        canUpdateTasks: canUpdateTasks !== undefined ? canUpdateTasks : true,
        canDeleteTasks: canDeleteTasks !== undefined ? canDeleteTasks : false,
        canUpdateUsers: canUpdateUsers !== undefined ? canUpdateUsers : false,
        canDeleteUsers: canDeleteUsers !== undefined ? canDeleteUsers : false,
      });
      res.status(201).json({ message: "Role created successfully", role });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to create role" });
    }
  }
);

app.put(
  "/api/admin/roles/:roleName/permissions",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const roleName = req.params.roleName;
      const { canUpdateTasks, canDeleteTasks, canUpdateUsers, canDeleteUsers } = req.body;
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (canUpdateTasks !== undefined) role.canUpdateTasks = canUpdateTasks;
      if (canDeleteTasks !== undefined) role.canDeleteTasks = canDeleteTasks;
      if (canUpdateUsers !== undefined) role.canUpdateUsers = canUpdateUsers;
      if (canDeleteUsers !== undefined) role.canDeleteUsers = canDeleteUsers;

      await role.save();
      await User.updateMany(
        { role: roleName },
        {
          canUpdateTasks: role.canUpdateTasks,
          canDeleteTasks: role.canDeleteTasks,
          canUpdateUsers: role.canUpdateUsers,
          canDeleteUsers: role.canDeleteUsers,
        }
      );

      res.json({ message: "Role permissions updated", role });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  }
);

app.get(
  "/api/admin/pending-requests",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Admin-only pending requests (exclude admin role creations)
      const pending = await User.find({ approved: false, role: { $ne: "admin" } }).select("name email role managerId ctoId createdAt");
      res.json(pending);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  }
);

app.post(
  "/api/admin/pending-requests/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const pendingUser = await User.findById(req.params.id);
      if (!pendingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (pendingUser.approved) {
        return res.status(400).json({ message: "User is already approved" });
      }

      pendingUser.approved = true;
      await pendingUser.save();

      await sendDecisionEmail(pendingUser, true);

      res.json({ message: "User approved" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  }
);

app.post(
  "/api/admin/pending-requests/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const pendingUser = await User.findById(req.params.id);
      if (!pendingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (pendingUser.approved) {
        return res.status(400).json({ message: "Approved users cannot be rejected" });
      }

      await sendDecisionEmail(pendingUser, false);
      await pendingUser.deleteOne();

      res.json({ message: "User rejected and notification sent" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  }
);

// List users based on requester role: manager -> users only, cto -> users and managers, admin -> users
app.get(
  "/api/users",
  authMiddleware,
  async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === "manager") {
        filter = { role: "user" };
      } else if (req.user.role === "cto") {
        filter = { role: { $in: ["user", "manager"] } };
      } else if (req.user.role === "admin") {
        filter = {}; // admin sees all users
      }

      const users = await User.find(filter).select(
        "name email role managerId ctoId canUpdateTasks canDeleteTasks approved profilePicture"
      );

      res.json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);



app.get(
  "/api/admin/tasks",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const cacheKey = "tasks:admin_all";
      const cachedTasks = await getCache(cacheKey);
      if (cachedTasks) {
        console.log(`🎯 Cache hit for key: ${cacheKey}`);
        return res.json(cachedTasks);
      }

      const tasks = await Task.find()
        .populate("userId", "name email role")
        .sort({ createdAt: -1 });

      await setCache(cacheKey, tasks, 600);
      res.json(tasks);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to fetch tasks",
      });
    }
  }
);

// =====================================
// Update User Permissions (Admin Only)
// =====================================

app.put(
  "/api/admin/users/:id/permissions",
  authMiddleware,
  async (req, res) => {
    try {
      const { canUpdateTasks, canDeleteTasks, canUpdateUsers, canDeleteUsers } = req.body;
      const target = await User.findById(req.params.id);
      if (!target) return res.status(404).json({ message: "User not found" });

      const requesterRole = req.user.role;

      // Admin can change any permission
      if (requesterRole === "admin") {
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
        if (canUpdateUsers !== undefined) target.canUpdateUsers = canUpdateUsers;
        if (canDeleteUsers !== undefined) target.canDeleteUsers = canDeleteUsers;
      } else if (requesterRole === "cto") {
        // CTO can modify task permissions for users and managers
        if (!["user", "manager"].includes(target.role)) {
          return res.status(403).json({ message: "CTO can only modify users and managers" });
        }
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
      } else if (requesterRole === "manager") {
        // Manager can modify task permissions for users only
        if (target.role !== "user") {
          return res.status(403).json({ message: "Manager can only modify users" });
        }
        if (canUpdateTasks !== undefined) target.canUpdateTasks = canUpdateTasks;
        if (canDeleteTasks !== undefined) target.canDeleteTasks = canDeleteTasks;
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }

      await target.save();

      res.json({ message: "Permissions updated successfully", user: target });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  }
);

// Admin: assign a manager to a user
app.put(
  "/api/admin/users/:id/assign-manager",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { managerId } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Unassign manager when managerId is null or empty
      if (!managerId) {
        const prevManagerId = user.managerId;
        user.managerId = null;
        await user.save();
        await Audit.create({ actorId: req.user.id, action: 'unassign-manager', targetId: user._id, details: { previousManager: prevManagerId } });
        if (prevManagerId) {
          await createNotification(user._id, "You have been unassigned from your manager.", "manager-unassigned");
          await createNotification(prevManagerId, `Employee ${user.name} has been unassigned from you.`, "user-unassigned-from-you");
        }
        return res.json({ message: "Manager unassigned", user });
      }

      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") return res.status(400).json({ message: "Manager not found" });

      const prev = user.managerId;
      user.managerId = manager._id;
      await user.save();
      await Audit.create({ actorId: req.user.id, action: 'assign-manager', targetId: user._id, details: { managerId: manager._id, previousManager: prev } });

      await sendAssignmentNotificationEmail(user, "Manager assigned", `Hello ${user.name},\n\nYou have been assigned to manager ${manager.name}.\n\nBest regards,\nTeam`);
      await sendAssignmentNotificationEmail(manager, "New user assigned", `Hello ${manager.name},\n\n${user.name} has been assigned to you as a direct user.\n\nBest regards,\nTeam`);

      await createNotification(user._id, `You have been assigned to manager ${manager.name}.`, 'manager-assigned');
      await createNotification(manager._id, `Employee ${user.name} has been assigned to you.`, 'user-assigned-to-you');

      res.json({ message: "Manager assigned", user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to assign manager" });
    }
  }
);

// Admin: assign a CTO to a manager
app.put(
  "/api/admin/users/:id/assign-cto",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { ctoId } = req.body;
      const manager = await User.findById(req.params.id);
      if (!manager) return res.status(404).json({ message: "User not found" });
      if (manager.role !== "manager") return res.status(400).json({ message: "Target is not a manager" });

      // Unassign CTO when ctoId is null or empty
      if (!ctoId) {
        const prev = manager.ctoId;
        manager.ctoId = null;
        await manager.save();
        await Audit.create({ actorId: req.user.id, action: 'unassign-cto', targetId: manager._id, details: { previousCto: prev } });
        if (prev) {
          await createNotification(manager._id, "You have been unassigned from your CTO.", "cto-unassigned");
          await createNotification(prev, `Manager ${manager.name} has been unassigned from you.`, "manager-unassigned-from-you");
        }
        return res.json({ message: "CTO unassigned from manager", manager });
      }

      const cto = await User.findById(ctoId);
      if (!cto || cto.role !== "cto") return res.status(400).json({ message: "CTO not found" });

      const prevcto = manager.ctoId;
      manager.ctoId = cto._id;
      await manager.save();
      await Audit.create({ actorId: req.user.id, action: 'assign-cto', targetId: manager._id, details: { ctoId: cto._id, previousCto: prevcto } });

      await sendAssignmentNotificationEmail(manager, "CTO assigned", `Hello ${manager.name},\n\nYou have been assigned to CTO ${cto.name}.\n\nBest regards,\nTeam`);
      await sendAssignmentNotificationEmail(cto, "New manager assignment", `Hello ${cto.name},\n\n${manager.name} has been assigned to you as a manager.\n\nBest regards,\nTeam`);

      await createNotification(manager._id, `You have been assigned to CTO ${cto.name}.`, 'cto-assigned');
      await createNotification(cto._id, `Manager ${manager.name} has been assigned to you.`, 'manager-assigned-to-you');

      res.json({ message: "CTO assigned to manager", manager });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to assign CTO" });
    }
  }
);

// =====================================
// Assign Task to User with Notification
// =====================================
app.put("/api/tasks/:id/assign", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    // Ensure current user has permission to assign
    if (req.user.role !== "admin" && !req.user.canUpdateTasks) {
      return res.status(403).json({ message: "You do not have permission to assign tasks" });
    }
    const assignee = await User.findById(userId);
    if (!assignee) return res.status(404).json({ message: "User not found" });
    task.userId = assignee._id;
    await task.save();
    await clearCachePattern("tasks:*");
    // Audit log
    await Audit.create({ actorId: req.user.id, action: "assign-task", targetId: task._id, details: { assigneeId: assignee._id } });
    // Notification emails
    await sendAssignmentNotificationEmail(assignee, "Task Assigned", `Hello ${assignee.name},\n\nYou have been assigned a new task (ID: ${task._id}).\n\nBest regards,\nTeam`);
    await createNotification(assignee._id, `You have been assigned a new task: "${task.title}".`, 'task-assigned');
    // Notify manager if exists
    if (assignee.managerId) {
      const manager = await User.findById(assignee.managerId);
      if (manager) {
        await sendAssignmentNotificationEmail(manager, "User Assigned a Task", `Hello ${manager.name},\n\nUser ${assignee.name} has been assigned a new task (ID: ${task._id}).\n\nBest regards,\nTeam`);
        await createNotification(manager._id, `Employee ${assignee.name} has been assigned task "${task.title}".`, 'task-assigned');
      }
    }
    res.json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to assign task" });
  }
});
// =====================================
// Update Task
// =====================================

app.put(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && !req.user.canUpdateTasks) {
        return res.status(403).json({
          message: "You do not have permission to update tasks. Contact your administrator.",
        });
      }

      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        (!task.userId || task.userId.toString() !== req.user.id.toString())
      ) {
        return res.status(403).json({
          message: "Not authorized to update this task",
        });
      }

      if (req.body.title !== undefined) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.priority !== undefined) task.priority = req.body.priority;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
      if (req.body.status !== undefined) {
        task.status = (req.body.status === "Pending" || req.body.status === "pending") ? "open" : req.body.status;
      }
      if (req.body.thumbnail !== undefined) task.thumbnail = req.body.thumbnail;

      await task.save();

      res.json(task);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to update task",
      });
    }
  }
);

// =====================================
// Update User (Admin or delegated user update access)
// =====================================

app.put(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      // Role-based restrictions
      if (req.user.role === "manager") {
        if (targetUser.role !== "user") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (req.body.role && req.body.role !== "user") {
          return res.status(403).json({ message: "Managers cannot assign elevated roles" });
        }
      }

      if (req.user.role === "cto") {
        if (targetUser.role === "cto") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (req.body.role && req.body.role === "cto") {
          return res.status(403).json({ message: "Cannot assign CTO role" });
        }
      }

      if (req.user.role === "admin") {
        // Admin can update any role and assign any role.
      }

      if (req.body.name !== undefined) targetUser.name = req.body.name;
      if (req.body.email !== undefined) targetUser.email = req.body.email;
      if (req.body.designation !== undefined) targetUser.designation = req.body.designation;
      if (req.body.department !== undefined) targetUser.department = req.body.department;
      if (req.body.profilePicture !== undefined) targetUser.profilePicture = req.body.profilePicture;
      if (req.body.password !== undefined && req.body.password !== "") {
        targetUser.password = await bcrypt.hash(req.body.password, 10);
      }
      if (req.body.role !== undefined) targetUser.role = req.body.role;

      if (req.body.role !== undefined) {
        const roleDefaults = await Role.findOne({ name: req.body.role });
        if (roleDefaults) {
          targetUser.canUpdateTasks = roleDefaults.canUpdateTasks;
          targetUser.canDeleteTasks = roleDefaults.canDeleteTasks;
          targetUser.canUpdateUsers = roleDefaults.canUpdateUsers;
          targetUser.canDeleteUsers = roleDefaults.canDeleteUsers;
        }
      }

      await targetUser.save();

      res.json({
        message: "User updated successfully",
        user: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          canUpdateTasks: targetUser.canUpdateTasks,
          canDeleteTasks: targetUser.canDeleteTasks,
          canUpdateUsers: targetUser.canUpdateUsers,
          canDeleteUsers: targetUser.canDeleteUsers,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to update user",
      });
    }
  }
);

// =====================================
// Delete User (Admin or delegated user delete access)
// =====================================

app.delete(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (targetUser.role === "admin" && req.user.role !== "admin") {
        return res.status(403).json({
          message: "Only admins can delete admin accounts.",
        });
      }

      // Role-based restrictions for deletion
      if (req.user.role === "manager") {
        if (targetUser.role !== "user") return res.status(403).json({ message: "Forbidden" });
      }

      if (req.user.role === "cto") {
        if (targetUser.role === "cto") return res.status(403).json({ message: "Forbidden" });
      }

      if (
        req.user.role !== "admin" &&
        !req.user.canDeleteUsers &&
        req.user.id.toString() !== targetUser._id.toString()
      ) {
        return res.status(403).json({
          message: "You do not have permission to delete users. Contact your administrator.",
        });
      }

      await Task.updateMany({ userId: targetUser._id }, { userId: null });
      await User.findByIdAndDelete(req.params.id);

      res.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Failed to delete user",
      });
    }
  }
);

// =====================================
// Delete Task
// =====================================

app.delete(
  "/api/tasks/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && !req.user.canDeleteTasks) {
        return res.status(403).json({
          message: "You do not have permission to delete tasks. Contact your administrator.",
        });
      }

      const task = await Task.findById(
        req.params.id
      );

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        (!task.userId || task.userId.toString() !== req.user.id.toString())
      ) {
        return res.status(403).json({
          message: "Not authorized to delete this task",
        });
      }

      await Task.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Task deleted",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Delete failed",
      });
    }
  }
);

// Admin: Delete any task
app.delete('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task deleted by admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Admin delete task failed' });
  }
});

// Admin: Update any task
app.put('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Update basic fields (userId handled separately below)
    const updatable = ['title', 'description', 'priority', 'dueDate', 'status', 'thumbnail'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'status' && (req.body[field] === 'Pending' || req.body[field] === 'pending')) {
          task[field] = 'open';
        } else {
          task[field] = req.body[field];
        }
      }
    });

    // Handle userId assignment separately to avoid Mongoose CastError on empty string
    if (req.body.userId !== undefined) {
      const rawUserId = req.body.userId;
      if (rawUserId && String(rawUserId).trim() !== '') {
        try {
          const assignee = await User.findById(rawUserId);
          if (assignee) {
            task.userId = assignee._id;
            task.managerId = assignee.managerId || null;
            task.ctoId = assignee.ctoId || null;
          } else {
            // userId provided but user not found – keep existing userId, clear hierarchy
            task.managerId = null;
            task.ctoId = null;
          }
        } catch (castErr) {
          // Invalid ObjectId format – ignore and keep existing values
        }
      } else {
        // Empty string means "assign to no one" / keep as admin's own task
        task.userId = req.user.id;
        task.managerId = null;
        task.ctoId = null;
      }
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Admin update task failed' });
  }
});

// Admin: Add new task
app.post('/api/admin/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, title, description, priority, dueDate, status, thumbnail } = req.body;
    if (!title || !description || !dueDate || !priority) {
      return res.status(400).json({ message: "All fields (Title, Description, Due Date, Priority) are compulsory." });
    }

    const task = new Task({
      userId: userId || req.user.id,
      title: title || "",
      description: description || "",
      priority: priority || "low",
      dueDate,
      status: (status === "Pending" || status === "pending") ? "open" : (status || "open"),
      thumbnail: thumbnail || "",
    });

    if (userId) {
      const assignee = await User.findById(userId);
      if (assignee) {
        task.managerId = assignee.managerId || null;
        task.ctoId = assignee.ctoId || null;
      }
    }

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('Admin add task error:', err);
    res.status(500).json({ message: 'Admin add task failed', error: err.message });
  }
});

// =====================================
// Start Server
// =====================================

app.get("/test-mail", async (req, res) => {
  console.log("TEST MAIL ROUTE HIT");

  try {
    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,

      to: "majortest007@gmail.com",

      subject: "Test Mail",

      html: "<h1>SMTP Working</h1>",
    });

    res.send("Mail Sent Successfully");
  } catch (error) {
    console.log(error);

    res.send("Mail Failed");
  }
});

// PORT defined earlier

const sendWsMessage = (ws, payload) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastToDepartment = async (department, payload) => {
  if (!department) return;
  for (const [userId, connection] of activeSockets.entries()) {
    if (connection.user && connection.user.department === department) {
      sendWsMessage(connection.socket, payload);
    }
  }
};

const canSendPrivateMessage = (fromUser, toUser) => {
  if (!fromUser || !toUser) return false;
  
  const roleA = fromUser.role;
  const roleB = toUser.role;
  
  // Admin to all users (including managers, cto, cfo, etc.)
  if (roleA === 'admin' || roleB === 'admin') return true;
  
  // Users to users
  if (roleA === 'user' && roleB === 'user') return true;
  
  // Managers to users (symmetric)
  if ((roleA === 'manager' && roleB === 'user') || (roleA === 'user' && roleB === 'manager')) return true;
  
  // CTO to managers and users (symmetric)
  if ((roleA === 'cto' && (roleB === 'manager' || roleB === 'user')) || ((roleA === 'manager' || roleA === 'user') && roleB === 'cto')) return true;
  
  return false;
};

const getUserForConnection = async (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return null;
    return await User.findById(decoded.id);
  } catch (error) {
    return null;
  }
};

wss.on('connection', async (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query?.token;
  const user = await getUserForConnection(token);
  if (!user) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  const userId = user._id.toString();
  activeSockets.set(userId, { socket: ws, user });
  sendWsMessage(ws, { type: 'system', message: `Connected as ${user.name}`, timestamp: new Date().toISOString() });

  ws.on('message', async (rawMessage) => {
    let data;
    try {
      data = JSON.parse(rawMessage.toString());
    } catch (error) {
      return sendWsMessage(ws, { type: 'error', message: 'Invalid message format' });
    }

    if (data.type === 'private') {
      if (!data.to || !data.message) {
        return sendWsMessage(ws, { type: 'error', message: 'Private messages require a recipient and message' });
      }
      const recipient = await User.findById(data.to);
      if (!recipient) {
        return sendWsMessage(ws, { type: 'error', message: 'Recipient not found' });
      }
      if (!canSendPrivateMessage(user, recipient)) {
        return sendWsMessage(ws, { type: 'error', message: 'Not authorized to message this user' });
      }
      
      // Save to database
      const chatMsg = new ChatMessage({
        sender: user._id,
        senderName: user.name,
        senderRole: user.role,
        messageType: 'private',
        recipient: recipient._id,
        message: data.message,
      });
      await chatMsg.save();
      
      const payload = {
        type: 'private',
        _id: chatMsg._id.toString(),
        from: { id: userId, name: user.name, role: user.role },
        to: recipient._id.toString(),
        message: data.message,
        timestamp: chatMsg.createdAt.toISOString(),
      };
      savePrivateMessage(payload);
      const recipientConnection = activeSockets.get(recipient._id.toString());
      if (recipientConnection) sendWsMessage(recipientConnection.socket, payload);
      sendWsMessage(ws, { ...payload, self: true });
      return;
    }

    if (data.type === 'group') {
      if (!data.groupId || !data.message) {
        return sendWsMessage(ws, { type: 'error', message: 'Group messages require a group and message' });
      }
      
      // Check if group exists in MongoDB
      let chatGroup = await Group.findById(data.groupId);
      if (!chatGroup) {
        // Fallback to in-memory groups
        chatGroup = chatGroups.get(data.groupId);
        if (!chatGroup) {
          return sendWsMessage(ws, { type: 'error', message: 'Group not found' });
        }
      }
      
      // Check if user is a member
      const memberIds = chatGroup.members?.map(m => m.toString()) || chatGroup.members || [];
      if (!memberIds.includes(userId)) {
        return sendWsMessage(ws, { type: 'error', message: 'You are not a member of this group' });
      }
      
      // Save message to database
      const chatMsg = new ChatMessage({
        sender: user._id,
        senderName: user.name,
        senderRole: user.role,
        messageType: 'group',
        group: data.groupId,
        message: data.message,
      });
      await chatMsg.save();
      
      const payload = {
        type: 'group',
        _id: chatMsg._id.toString(),
        groupId: data.groupId,
        groupName: chatGroup.name,
        from: { id: userId, name: user.name, role: user.role },
        message: data.message,
        timestamp: chatMsg.createdAt.toISOString(),
      };
      
      saveGroupMessage(data.groupId, payload);
      await broadcastGroup(data.groupId, payload);
      
      // Update group last message and activity
      if (chatGroup._id) {
        await Group.findByIdAndUpdate(data.groupId, {
          lastMessage: data.message,
          lastActivity: new Date(),
        });
      }
      return;
    }

    if (data.type === 'department') {
      if (!chatConfig.departmentChatEnabled) {
        return sendWsMessage(ws, { type: 'error', message: 'Department chat is disabled by admin' });
      }
      if (!user.department) {
        return sendWsMessage(ws, { type: 'error', message: 'You need a department to join department chat' });
      }
      
      // Save to database
      const chatMsg = new ChatMessage({
        sender: user._id,
        senderName: user.name,
        senderRole: user.role,
        messageType: 'department',
        department: user.department,
        message: data.message,
      });
      await chatMsg.save();
      
      const payload = {
        type: 'department',
        _id: chatMsg._id.toString(),
        department: user.department,
        from: { id: userId, name: user.name, role: user.role },
        message: data.message,
        timestamp: chatMsg.createdAt.toISOString(),
      };
      saveDepartmentMessage(user.department, payload);
      await broadcastToDepartment(user.department, payload);
      return;
    }

    if (data.type === 'bot') {
      if (!chatConfig.departmentChatEnabled) {
        return sendWsMessage(ws, { type: 'error', message: 'Department bot chat is disabled by admin' });
      }
      const department = user.department || 'General';
      const botResponse = `Hello ${user.name}, the ${department} bot heard you: "${data.message || '...'}". I can help with workflow updates, department status, and role routing.`;
      const payload = {
        type: 'bot',
        department,
        from: { id: 'bot', name: `${department} Bot`, role: 'bot' },
        message: botResponse,
        timestamp: new Date().toISOString(),
      };
      saveDepartmentMessage(department, payload);
      await broadcastToDepartment(department, payload);
      return;
    }

    if (data.type === 'ping') {
      return sendWsMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
    }

    return sendWsMessage(ws, { type: 'error', message: 'Unknown chat message type' });
  });

  ws.on('close', () => {
    activeSockets.delete(userId);
  });
});

app.get('/api/chat/targets', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ approved: true }).select('name email role designation department managerId ctoId profilePicture');
    const allowed = users
      .filter((user) => user._id.toString() !== req.user.id)
      .filter((user) => canSendPrivateMessage(req.user, user));
    res.json({ targets: allowed, chatConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch chat targets' });
  }
});

app.get('/api/chat/departments', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ approved: true }).select('department');
    const departments = [...new Set(users.map((user) => (user.department || 'General')).filter(Boolean))];
    res.json({ departments, chatConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

app.get('/api/chat/groups', authMiddleware, async (req, res) => {
  try {
    // Fetch from MongoDB
    let groups = await Group.find({
      $or: [
        { members: req.user.id },
        { createdBy: req.user.id },
      ],
      isArchived: false,
    }).populate('members', 'name role department email').populate('createdBy', 'name');
    
    // Fallback to in-memory if MongoDB returns nothing
    if (groups.length === 0) {
      groups = Array.from(chatGroups.values()).filter((group) => {
        return req.user.role === 'admin' || group.members.includes(req.user.id);
      });
    } else {
      // Transform MongoDB documents to match expected format
      groups = groups.map(group => ({
        _id: group._id.toString(),
        id: group._id.toString(),
        name: group.name,
        description: group.description,
        members: group.members.map(m => ({
          id: m._id.toString(),
          name: m.name,
          role: m.role,
          department: m.department,
          email: m.email,
        })),
        createdBy: group.createdBy._id.toString(),
        createdAt: group.createdAt.toISOString(),
        lastMessage: group.lastMessage,
        lastActivity: group.lastActivity.toISOString(),
      }));
    }
    
    res.json({ groups, chatConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch chat groups' });
  }
});

app.post('/api/chat/groups', authMiddleware, async (req, res) => {
  try {
    const { name, memberIds, description, isDepartmentGroup, department } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    let finalMembers = Array.from(new Set([req.user.id, ...((memberIds && Array.isArray(memberIds)) ? memberIds : [])]));
    
    // If department group, add all users from that department (excluding those without department)
    if (isDepartmentGroup && department) {
      const deptUsers = await User.find({ 
        department: department,
        approved: true,
        _id: { $ne: req.user.id }
      }).select('_id');
      const deptUserIds = deptUsers.map(u => u._id.toString());
      finalMembers = Array.from(new Set([...finalMembers, ...deptUserIds]));
    }
    
    if (finalMembers.length < 2) {
      return res.status(400).json({ message: 'Group must have at least 2 members' });
    }
    
    const members = await User.find({ _id: { $in: finalMembers }, approved: true }).select('name role department');
    if (members.length !== finalMembers.length) {
      return res.status(400).json({ message: 'One or more group members are invalid or not approved' });
    }
    
    // Check if creator can add all members (based on role restrictions)
    const invalid = members.some((member) => {
      if (member._id.toString() === req.user.id) return false;
      // If it is a department group, bypass checking members in that department
      if (isDepartmentGroup && department && member.department === department) return false;
      return !canSendPrivateMessage(req.user, member);
    });
    
    if (invalid) {
      return res.status(403).json({ message: 'You cannot create a group with one or more selected members due to role restrictions' });
    }
    
    // Create group in MongoDB
    const group = new Group({
      name,
      description: description || (isDepartmentGroup ? `Department: ${department}` : ''),
      members: finalMembers,
      createdBy: req.user.id,
      isDepartmentGroup: isDepartmentGroup || false,
      department: department || null,
    });
    
    await group.save();
    
    // Also save to in-memory for quick lookup
    chatGroups.set(group._id.toString(), {
      id: group._id.toString(),
      name: group.name,
      members: finalMembers,
      createdBy: req.user.id,
      isDepartmentGroup: isDepartmentGroup || false,
      department: department || null,
      createdAt: group.createdAt.toISOString(),
      lastMessage: null,
      lastActivity: new Date().toISOString(),
    });
    
    res.json({ 
      message: 'Group created successfully', 
      group: {
        _id: group._id.toString(),
        name: group.name,
        description: group.description,
        members: finalMembers,
        isDepartmentGroup: isDepartmentGroup || false,
        department: department || null,
        createdBy: req.user.id,
        createdAt: group.createdAt.toISOString(),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create chat group' });
  }
});

app.delete('/api/chat/groups/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete chat groups' });
    }
    
    const groupId = req.params.id;
    
    if (Group) {
      const group = await Group.findByIdAndDelete(groupId);
      if (!group && !chatGroups.has(groupId)) {
        return res.status(404).json({ message: 'Group not found' });
      }
    }
    
    chatGroups.delete(groupId);
    
    if (ChatMessage) {
      await ChatMessage.deleteMany({ group: groupId });
    }
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

app.get('/api/chat/history', authMiddleware, async (req, res) => {
  try {
    const { type, withId, groupId, department, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * pageLimit;
    
    if (type === 'private') {
      if (!withId) return res.status(400).json({ message: 'Missing private chat target' });
      const target = await User.findById(withId);
      if (!target) return res.status(404).json({ message: 'Target user not found' });
      if (req.user.role !== 'admin' && !canSendPrivateMessage(req.user, target) && !canSendPrivateMessage(target, req.user)) {
        return res.status(403).json({ message: 'Not authorized to view this chat history' });
      }
      
      // Fetch from MongoDB
      const messages = await ChatMessage.find({
        messageType: 'private',
        $or: [
          { sender: req.user.id, recipient: withId },
          { sender: withId, recipient: req.user.id },
        ],
        isDeleted: false,
      }).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).populate('sender', 'name role');
      
      const total = await ChatMessage.countDocuments({
        messageType: 'private',
        $or: [
          { sender: req.user.id, recipient: withId },
          { sender: withId, recipient: req.user.id },
        ],
        isDeleted: false,
      });
      
      const history = messages.map(msg => ({
        type: 'private',
        _id: msg._id.toString(),
        from: { id: msg.sender._id.toString(), name: msg.sender.name, role: msg.sender.role },
        to: withId,
        message: msg.message,
        timestamp: msg.createdAt.toISOString(),
      }));
      
      return res.json({ history: history.reverse(), total, page: pageNum, limit: pageLimit });
    }
    
    if (type === 'group') {
      if (!groupId) return res.status(400).json({ message: 'Missing group id' });
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (req.user.role !== 'admin' && !group.members.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
      
      const messages = await ChatMessage.find({
        messageType: 'group',
        group: groupId,
        isDeleted: false,
      }).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).populate('sender', 'name role department');
      
      const total = await ChatMessage.countDocuments({
        messageType: 'group',
        group: groupId,
        isDeleted: false,
      });
      
      const history = messages.map(msg => ({
        type: 'group',
        _id: msg._id.toString(),
        groupId: groupId,
        groupName: group.name,
        from: { id: msg.sender._id.toString(), name: msg.sender.name, role: msg.sender.role },
        message: msg.message,
        timestamp: msg.createdAt.toISOString(),
      }));
      
      return res.json({ history: history.reverse(), total, page: pageNum, limit: pageLimit });
    }
    
    if (type === 'department') {
      const dept = department?.toString();
      if (!dept) return res.status(400).json({ message: 'Missing department' });
      if (req.user.role !== 'admin' && req.user.department !== dept) {
        return res.status(403).json({ message: 'Not authorized to view this department history' });
      }
      
      const messages = await ChatMessage.find({
        messageType: 'department',
        department: dept,
        isDeleted: false,
      }).sort({ createdAt: -1 }).skip(skip).limit(pageLimit).populate('sender', 'name role');
      
      const total = await ChatMessage.countDocuments({
        messageType: 'department',
        department: dept,
        isDeleted: false,
      });
      
      const history = messages.map(msg => ({
        type: 'department',
        _id: msg._id.toString(),
        department: dept,
        from: { id: msg.sender._id.toString(), name: msg.sender.name, role: msg.sender.role },
        message: msg.message,
        timestamp: msg.createdAt.toISOString(),
      }));
      
      return res.json({ history: history.reverse(), total, page: pageNum, limit: pageLimit });
    }
    
    return res.status(400).json({ message: 'Unsupported history type' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load chat history' });
  }
});

app.get('/api/admin/chat-config', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ chatConfig });
});

app.put('/api/admin/chat-config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = req.body || {};
    Object.assign(chatConfig, {
      usersCanChatWithManagers: updates.usersCanChatWithManagers ?? chatConfig.usersCanChatWithManagers,
      usersCanChatWithCtos: updates.usersCanChatWithCtos ?? chatConfig.usersCanChatWithCtos,
      usersCanChatWithCfos: updates.usersCanChatWithCfos ?? chatConfig.usersCanChatWithCfos,
      managersCanChatWithCtos: updates.managersCanChatWithCtos ?? chatConfig.managersCanChatWithCtos,
      departmentChatEnabled: updates.departmentChatEnabled ?? chatConfig.departmentChatEnabled,
    });
    res.json({ message: 'Chat configuration updated', chatConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update chat configuration' });
  }
});

// Get all active chats for user (groups + private conversations)
app.get('/api/chat/conversations', authMiddleware, async (req, res) => {
  try {
    // Get user's groups
    const groups = await Group.find({
      members: req.user.id,
      isArchived: false,
    }).sort({ lastActivity: -1 }).populate('members', 'name role department email').select('name description members lastMessage lastActivity createdAt');
    
    // Get recent private conversations
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const recentConversations = await ChatMessage.aggregate([
      {
        $match: {
          messageType: 'private',
          isDeleted: false,
          $or: [
            { sender: userId },
            { recipient: userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $first: '$message' },
          lastTimestamp: { $first: '$createdAt' },
          senderName: { $first: '$senderName' },
        },
      },
      {
        $sort: { lastTimestamp: -1 },
      },
      {
        $limit: 100,
      },
    ]);
    
    // Fetch details for private chat users
    const userIds = recentConversations.map(c => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name role department email profilePicture');
    const usersById = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});
    
    const privateChats = recentConversations.map(conv => ({
      type: 'private',
      conversationId: conv._id.toString(),
      userId: conv._id.toString(),
      name: usersById[conv._id.toString()]?.name || 'Unknown',
      role: usersById[conv._id.toString()]?.role || 'user',
      department: usersById[conv._id.toString()]?.department || '',
      lastMessage: conv.lastMessage,
      lastTimestamp: conv.lastTimestamp,
      profilePicture: usersById[conv._id.toString()]?.profilePicture || '',
    }));
    
    const groupChats = groups.map(g => ({
      type: 'group',
      conversationId: g._id.toString(),
      groupId: g._id.toString(),
      name: g.name,
      description: g.description,
      memberCount: g.members.length,
      members: g.members.map(m => ({
        id: m._id.toString(),
        name: m.name,
        role: m.role,
        department: m.department,
      })),
      lastMessage: g.lastMessage,
      lastTimestamp: g.lastActivity,
    }));
    
    // Combine and sort by last activity
    const allChats = [...groupChats, ...privateChats].sort((a, b) => {
      const timeA = new Date(a.lastTimestamp || 0).getTime();
      const timeB = new Date(b.lastTimestamp || 0).getTime();
      return timeB - timeA;
    });
    
    res.json({ conversations: allChats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get or create private chat conversation
app.get('/api/chat/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const otherUser = await User.findById(userId).select('name role department email profilePicture');
    
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.user.role !== 'admin' && !canSendPrivateMessage(req.user, otherUser)) {
      return res.status(403).json({ message: 'You cannot chat with this user' });
    }
    
    res.json({
      type: 'private',
      conversationId: userId,
      userId: userId,
      name: otherUser.name,
      role: otherUser.role,
      department: otherUser.department,
      profilePicture: otherUser.profilePicture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
});

const startServer = async () => {
  console.log(`Starting server in ${DB_MODE.toUpperCase()} mode`);
  await initDatabase();
  let port = PORT;
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        // Listen on the chosen port
        server.listen(port, () => {
          console.log(`Server running on port ${port}`);
          resolve();
        });
        // Catch errors such as EADDRINUSE
        server.once('error', (err) => {
          reject(err);
        });
      });
      break; // success, exit loop
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${port} already in use, trying next port`);
        port++;
        // Remove the error listener before next attempt
        server.removeAllListeners('error');
        continue;
      }
      console.error('Server start error:', err);
      process.exit(1);
    }
  }
  startLogArchiver();
};

startServer();