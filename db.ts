import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'batchmaster.db');
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

// ── Seed ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  if (userCount > 0) return;

  // Default users
  db.prepare(`INSERT INTO users (username, password, email, fullName, role) VALUES (?, ?, ?, ?, ?)`)
    .run('admin', 'admin', 'admin@cohort.com', 'Admin User', 'admin');
  db.prepare(`INSERT INTO users (username, password, email, fullName, role) VALUES (?, ?, ?, ?, ?)`)
    .run('trainer', 'trainer', 'trainer@cohort.com', 'John Trainer', 'trainer');

  const batchNames = ['Web Design Basics', 'Advanced React', 'Node.js Mastery', 'UI/UX Principles', 'Data Visualization'];
  const studentNames = [
    'Emma Watson', 'James Bond', 'Sara Connor', 'John Wick', 'Luke Skywalker',
    'Leia Organa', 'Tony Stark', 'Bruce Wayne', 'Peter Parker', 'Diana Prince',
    'Clark Kent', 'Barry Allen', 'Arthur Curry', 'Victor Stone', 'Natasha Romanoff'
  ];
  const sessionNotes = [
    'Covered fundamentals and project setup',
    'Deep dive into components and props',
    'State management patterns discussed',
    'Hands-on workshop with live coding',
    'Guest lecture on industry best practices',
    'Mid-term review and Q&A session',
    'Advanced topics and optimization',
    'Team project kickoff',
    'Code review and feedback session',
    'Performance tuning workshop',
    'Final project presentations prep',
    'Course wrap-up and certificates'
  ];

  const insertBatch = db.prepare(`INSERT INTO batches (name, description, startDate, studentCount, averageAttendance, assignedTrainerId) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertSession = db.prepare(`INSERT INTO sessions (batchId, sessionNumber, date, title, notes, attendanceCount) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertStudent = db.prepare(`INSERT INTO students (name, email, batchId, attendancePercentage) VALUES (?, ?, ?, ?)`);
  const insertAttendance = db.prepare(`INSERT INTO attendance (batchId, sessionId, studentId, status) VALUES (?, ?, ?, ?)`);

  const seedAll = db.transaction(() => {
    for (let bIdx = 0; bIdx < batchNames.length; bIdx++) {
      const bName = batchNames[bIdx];
      const avgAttendance = Math.floor(Math.random() * 20) + 80;
      const batchResult = insertBatch.run(bName, `Comprehensive course on ${bName}.`, new Date().toISOString().split('T')[0], 15, avgAttendance, bIdx < 3 ? 1 : 2);
      const batchId = batchResult.lastInsertRowid as number;

      const sessionIds: number[] = [];
      for (let i = 0; i < 12; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - ((12 - i) * 7));
        const sResult = insertSession.run(batchId, i + 1, sessionDate.toISOString(), `Session ${i + 1}`, sessionNotes[i], Math.floor(Math.random() * 5) + 10);
        sessionIds.push(sResult.lastInsertRowid as number);
      }

      for (const sName of studentNames) {
        const studentAttendance = Math.floor(Math.random() * 30) + 70;
        const stResult = insertStudent.run(sName, `${sName.toLowerCase().replace(' ', '.')}@example.com`, batchId, studentAttendance);
        const studentId = stResult.lastInsertRowid as number;

        for (const sId of sessionIds) {
          insertAttendance.run(batchId, sId, studentId, Math.random() > 0.15 ? 'present' : 'absent');
        }
      }
    }
  });

  seedAll();
  console.log('✅ Database seeded with default data.');
}

seedIfEmpty();

export default db;
