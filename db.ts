import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cohort.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'trainer',
    theme TEXT DEFAULT 'light',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    startDate TEXT NOT NULL,
    studentCount INTEGER DEFAULT 0,
    averageAttendance REAL DEFAULT 0,
    archived INTEGER DEFAULT 0,
    assignedTrainerId INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (assignedTrainerId) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    batchId INTEGER NOT NULL,
    attendancePercentage REAL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batchId INTEGER NOT NULL,
    sessionNumber INTEGER NOT NULL,
    date TEXT NOT NULL,
    title TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    attendanceCount INTEGER DEFAULT 0,
    FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batchId INTEGER NOT NULL,
    sessionId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
    markedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(sessionId, studentId)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entityId INTEGER,
    details TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
  );
`);

export default db;
