const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Task = require("./models/Task");
const Role = require("./models/Role");
const Notification = require("./models/Notification");
const Audit = require("./models/Audit");
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

dotenv.config();

// =====================================
// Redis Client & Caching Setup
// =====================================
const redis = require("redis");
let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
redisClient = redis.createClient({ url: redisUrl });

const isRedisReady = () => Boolean(redisClient && isRedisConnected && redisClient.isOpen);

redisClient.on("error", (err) => {
  console.warn("⚠️ Redis Client Error:", err?.message || err);
  isRedisConnected = false;
});

redisClient.on("connect", () => {
  console.log("✅ Redis Client Connected");
});

redisClient.on("ready", () => {
  console.log("✅ Redis Client Ready");
  isRedisConnected = true;
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis Client disconnected");
  isRedisConnected = false;
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

redisClient.connect().catch((err) => {
  console.warn("⚠️ Redis connection failed. Caching & Rate Limiting will fallback to in-memory store.", err?.message || err);
  isRedisConnected = false;
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
app.use(cors());
const frontendPath = path.resolve(__dirname, 'frontend');
console.log('🔧 Frontend path resolved to:', frontendPath);
app.use(express.json());
app.use(logMiddleware);
app.use("/api", rateLimitMiddleware);
// MongoDB connection will be initialized after seedRoles() is defined.
// Serve static employee-facing frontend files
app.use(express.static(frontendPath));
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

// connectWithRetry(); // Disabled for MongoDB mode

process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed (SIGINT)');
  } catch (err) {
    console.warn('Error closing MongoDB connection:', err?.message || err);
  }
  process.exit(0);
});
process.on('SIGTERM', async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed (SIGTERM)');
  } catch (err) {
    console.warn('Error closing MongoDB connection:', err?.message || err);
  }
  process.exit(0);
});

// MongoDB models are used instead of PostgreSQL query helpers

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

connectDB()
  .then(() => seedRoles())
  .catch((err) => {
    console.error('MongoDB initialization failed:', err?.message || err);
    process.exit(1);
  });

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
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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
    const { name, email, password, role } = req.body;

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

    // Allow the first admin to log in if no approved admin exists yet.
    const approvedAdminExists = await User.exists({ role: "admin", approved: true });
    if (!user.approved && !(user.role === "admin" && !approvedAdminExists)) {
      return res.status(403).json({ message: "Account pending admin approval" });
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

        await transporter.sendMail({
          from: process.env.FROM_ADDRESS,
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

        return res.json({
          requiresMFA: true,
          mfaMethod: "email",
          email: user.email,
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
      if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;

      await user.save();
      res.json({
        message: "Profile updated successfully", user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation,
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
      if (!isValid) {
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

      await transporter.sendMail({
        from: process.env.FROM_ADDRESS,
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

      res.json({ message: "Verification code sent to your email" });
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

      if (!isValid) {
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
    user.mfaMethod = "none";
    user.mfaSecret = "";
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

    await transporter.sendMail({
      from: process.env.FROM_ADDRESS,

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

    res.json({
      message:
        "OTP sent successfully. OTP valid for 15 minutes.",
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

    // CHECK OTP

    if (user.otp !== otp) {
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
        "name email role designation canUpdateTasks canDeleteTasks canUpdateUsers canDeleteUsers approved managerId ctoId profilePicture"
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
      const { name, email, password, role, designation } = req.body;

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
  startLogArchiver();
});