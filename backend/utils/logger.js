const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const AdmZip = require('adm-zip');

const logStorage = new AsyncLocalStorage();
const logsDir = path.resolve(__dirname, '..', 'logs');

// Ensure base logs directories exist
fs.mkdirSync(path.join(logsDir, 'api_log'), { recursive: true });
fs.mkdirSync(path.join(logsDir, 'error_log'), { recursive: true });

// Helper to sanitize request body and redact sensitive fields
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'oldPassword', 'secret', 'otp', 'code', 'token', 'mfaSecret'];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

// Write a log entry to a file asynchronously
function writeLog(type, userDirName, message) {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const targetDir = path.join(logsDir, type, userDirName, currentMonth);
  const fileName = type === 'api_log' ? 'api.log' : 'error.log';
  const filePath = path.join(targetDir, fileName);

  fs.mkdir(targetDir, { recursive: true }, (err) => {
    if (err) {
      originalConsoleError(`[Logger] Failed to create dir: ${targetDir}`, err);
      return;
    }
    const logLine = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFile(filePath, logLine, 'utf8', (writeErr) => {
      if (writeErr) {
        originalConsoleError(`[Logger] Failed to append to log file: ${filePath}`, writeErr);
      }
    });
  });
}

// Log Middleware for API request capturing
function logMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Run within AsyncLocalStorage context
  logStorage.run({ req }, () => {
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userEmail = req.user?.email || 'anonymous';
      
      const logData = {
        ip: req.ip || req.connection?.remoteAddress,
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        } : null,
        body: sanitizeBody(req.body),
        userAgent: req.headers['user-agent']
      };

      writeLog('api_log', userEmail, JSON.stringify(logData));
    });

    next();
  });
}

// Capture and format arguments for error logging
function formatArgs(args) {
  return args.map(arg => {
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

// Monkeypatching console to capture errors to error_log automatically
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

console.error = (...args) => {
  // Always call original console.error so it shows in terminal
  originalConsoleError(...args);

  const store = logStorage.getStore();
  const userEmail = store?.req?.user?.email || 'anonymous';
  const targetContext = store?.req ? userEmail : 'system';
  
  const formattedMessage = formatArgs(args);
  writeLog('error_log', targetContext, formattedMessage);
};

console.log = (...args) => {
  // Always call original console.log so it shows in terminal
  originalConsoleLog(...args);

  // If console.log is used with an Error object, intercept and record to error_log
  const containsError = args.some(arg => 
    arg instanceof Error || 
    (arg && typeof arg === 'object' && 'message' in arg && 'stack' in arg)
  );

  if (containsError) {
    const store = logStorage.getStore();
    const userEmail = store?.req?.user?.email || 'anonymous';
    const targetContext = store?.req ? userEmail : 'system';
    
    const formattedMessage = formatArgs(args);
    writeLog('error_log', targetContext, `[Logged-as-Error] ${formattedMessage}`);
  }
};

// Archive old logs (monthly zip task)
function archiveOldLogs() {
  originalConsoleLog('[LogArchiver] Checking for old logs to archive...');
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const logTypes = ['api_log', 'error_log'];

  for (const logType of logTypes) {
    const typeDir = path.join(logsDir, logType);
    if (!fs.existsSync(typeDir)) continue;

    try {
      const users = fs.readdirSync(typeDir);
      for (const user of users) {
        const userDir = path.join(typeDir, user);
        if (!fs.statSync(userDir).isDirectory()) continue;

        const months = fs.readdirSync(userDir);
        for (const month of months) {
          const monthDir = path.join(userDir, month);
          if (!fs.statSync(monthDir).isDirectory()) continue;

          // Check if folder name is in YYYY-MM format and is older than the current month
          const isMonthFormat = /^\d{4}-\d{2}$/.test(month);
          if (isMonthFormat && month < currentMonth) {
            const zipPath = path.join(userDir, `${month}.zip`);
            originalConsoleLog(`[LogArchiver] Archiving ${monthDir} to ${zipPath}...`);
            try {
              const zip = new AdmZip();
              zip.addLocalFolder(monthDir);
              zip.writeZip(zipPath);

              // Delete the original folder
              fs.rmSync(monthDir, { recursive: true, force: true });
              originalConsoleLog(`[LogArchiver] Successfully archived and removed raw folder: ${monthDir}`);
            } catch (archiveErr) {
              originalConsoleError(`[LogArchiver] Error archiving folder ${monthDir}:`, archiveErr);
            }
          }
        }
      }
    } catch (err) {
      originalConsoleError(`[LogArchiver] Error scanning directory ${typeDir}:`, err);
    }
  }
}

// Start Log Archiver runner (immediate run, then every 24 hours)
function startLogArchiver() {
  archiveOldLogs();
  setInterval(archiveOldLogs, 24 * 60 * 60 * 1000);
}

module.exports = {
  logMiddleware,
  startLogArchiver,
  archiveOldLogs
};
