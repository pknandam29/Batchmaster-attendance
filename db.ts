import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'batchmaster.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
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
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    startDate TEXT NOT NULL,
    studentCount INTEGER DEFAULT 0,
    averageAttendance REAL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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
`);

// ── Seed ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  if (userCount > 0) return; // Already seeded

  // Default admin user
  db.prepare(`INSERT INTO users (username, password, email, fullName, role) VALUES (?, ?, ?, ?, ?)`)
    .run('admin', 'admin', 'admin@batchmaster.com', 'Admin Trainer', 'admin');

  // Seed batches
  const batchNames = ['Web Design Basics', 'Advanced React', 'Node.js Mastery', 'UI/UX Principles', 'Data Visualization'];
  const studentNames = [
    'Emma Watson', 'James Bond', 'Sara Connor', 'John Wick', 'Luke Skywalker',
    'Leia Organa', 'Tony Stark', 'Bruce Wayne', 'Peter Parker', 'Diana Prince',
    'Clark Kent', 'Barry Allen', 'Arthur Curry', 'Victor Stone', 'Natasha Romanoff'
  ];

  const insertBatch = db.prepare(`INSERT INTO batches (name, description, startDate, studentCount, averageAttendance, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`);
  const insertSession = db.prepare(`INSERT INTO sessions (batchId, sessionNumber, date, title, attendanceCount) VALUES (?, ?, ?, ?, ?)`);
  const insertStudent = db.prepare(`INSERT INTO students (name, email, batchId, attendancePercentage, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`);
  const insertAttendance = db.prepare(`INSERT INTO attendance (batchId, sessionId, studentId, status, markedAt) VALUES (?, ?, ?, ?, datetime('now'))`);

  const seedAll = db.transaction(() => {
    for (const bName of batchNames) {
      const avgAttendance = Math.floor(Math.random() * 20) + 80;
      const batchResult = insertBatch.run(bName, `Comprehensive course on ${bName}.`, new Date().toISOString().split('T')[0], 15, avgAttendance);
      const batchId = batchResult.lastInsertRowid as number;

      // Create 12 sessions
      const sessionIds: number[] = [];
      for (let i = 0; i < 12; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - ((12 - i) * 7));
        const sResult = insertSession.run(batchId, i + 1, sessionDate.toISOString(), `Session ${i + 1}`, Math.floor(Math.random() * 5) + 10);
        sessionIds.push(sResult.lastInsertRowid as number);
      }

      // Create 15 students
      for (const sName of studentNames) {
        const studentAttendance = Math.floor(Math.random() * 30) + 70;
        const stResult = insertStudent.run(sName, `${sName.toLowerCase().replace(' ', '.')}@example.com`, batchId, studentAttendance);
        const studentId = stResult.lastInsertRowid as number;

        // Attendance records
        for (const sId of sessionIds) {
          const status = Math.random() > 0.15 ? 'present' : 'absent';
          insertAttendance.run(batchId, sId, studentId, status);
        }
      }
    }
  });

  seedAll();
  console.log('✅ Database seeded with default data.');
}

seedIfEmpty();

export default db;
