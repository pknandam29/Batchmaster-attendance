import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ── Auth ───────────────────────────────────────────────────────────────

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role });
  });

  // ── Batches ────────────────────────────────────────────────────────────

  app.get("/api/batches", (req, res) => {
    const batches = db.prepare("SELECT * FROM batches ORDER BY createdAt DESC").all();
    res.json(batches);
  });

  app.post("/api/batches", (req, res) => {
    const { name, description, startDate } = req.body;
    if (!name || !startDate) return res.status(400).json({ error: "Name and startDate are required" });

    const result = db.prepare("INSERT INTO batches (name, description, startDate, studentCount, averageAttendance) VALUES (?, ?, ?, 0, 0)").run(name, description || '', startDate);
    const batchId = result.lastInsertRowid;

    // Auto-create 12 weekly sessions
    const insertSession = db.prepare("INSERT INTO sessions (batchId, sessionNumber, date, title, attendanceCount) VALUES (?, ?, ?, ?, 0)");
    const createSessions = db.transaction(() => {
      for (let i = 0; i < 12; i++) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + i * 7);
        insertSession.run(batchId, i + 1, sessionDate.toISOString(), `Session ${i + 1}`);
      }
    });
    createSessions();

    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batchId);
    res.json(batch);
  });

  app.delete("/api/batches/:id", (req, res) => {
    db.prepare("DELETE FROM batches WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // ── Students ───────────────────────────────────────────────────────────

  app.get("/api/batches/:id/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students WHERE batchId = ?").all(req.params.id);
    res.json(students);
  });

  app.post("/api/batches/:id/students", (req, res) => {
    const { name, email } = req.body;
    const batchId = req.params.id;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const result = db.prepare("INSERT INTO students (name, email, batchId, attendancePercentage) VALUES (?, ?, ?, 0)").run(name, email || '', batchId);
    db.prepare("UPDATE batches SET studentCount = studentCount + 1 WHERE id = ?").run(batchId);

    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid);
    res.json(student);
  });

  // ── Sessions ───────────────────────────────────────────────────────────

  app.get("/api/batches/:id/sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions WHERE batchId = ? ORDER BY sessionNumber ASC").all(req.params.id);
    res.json(sessions);
  });

  app.get("/api/sessions/upcoming", (req, res) => {
    const now = new Date().toISOString();
    const sessions = db.prepare("SELECT * FROM sessions WHERE date >= ? ORDER BY date ASC LIMIT 5").all(now);
    res.json(sessions);
  });

  // ── Attendance ─────────────────────────────────────────────────────────

  app.get("/api/attendance/:sessionId", (req, res) => {
    const records = db.prepare("SELECT * FROM attendance WHERE sessionId = ?").all(req.params.sessionId);
    const map: Record<string, string> = {};
    (records as any[]).forEach(r => { map[r.studentId] = r.status; });
    res.json(map);
  });

  app.post("/api/attendance", (req, res) => {
    const { batchId, sessionId, studentId, status } = req.body;
    if (!batchId || !sessionId || !studentId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = db.prepare("SELECT * FROM attendance WHERE sessionId = ? AND studentId = ?").get(sessionId, studentId) as any;

    const markAttendance = db.transaction(() => {
      if (!existing) {
        db.prepare("INSERT INTO attendance (batchId, sessionId, studentId, status) VALUES (?, ?, ?, ?)").run(batchId, sessionId, studentId, status);
        if (status === 'present') {
          db.prepare("UPDATE sessions SET attendanceCount = attendanceCount + 1 WHERE id = ?").run(sessionId);
        }
      } else {
        if (existing.status === status) return;
        db.prepare("UPDATE attendance SET status = ?, markedAt = datetime('now') WHERE id = ?").run(status, existing.id);
        if (status === 'present') {
          db.prepare("UPDATE sessions SET attendanceCount = attendanceCount + 1 WHERE id = ?").run(sessionId);
        } else {
          db.prepare("UPDATE sessions SET attendanceCount = MAX(0, attendanceCount - 1) WHERE id = ?").run(sessionId);
        }
      }

      // Update student attendance percentage
      const totalSessions = (db.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE batchId = ?").get(batchId) as any).cnt || 12;
      const presentCount = (db.prepare("SELECT COUNT(*) as cnt FROM attendance WHERE studentId = ? AND batchId = ? AND status = 'present'").get(studentId, batchId) as any).cnt;
      const percentage = (presentCount / totalSessions) * 100;
      db.prepare("UPDATE students SET attendancePercentage = ? WHERE id = ?").run(percentage, studentId);

      // Update batch average attendance
      const avgResult = db.prepare("SELECT AVG(attendancePercentage) as avg FROM students WHERE batchId = ?").get(batchId) as any;
      db.prepare("UPDATE batches SET averageAttendance = ? WHERE id = ?").run(avgResult.avg || 0, batchId);
    });

    markAttendance();
    res.json({ success: true });
  });

  // ── Seed ───────────────────────────────────────────────────────────────

  app.post("/api/seed", (req, res) => {
    const batchNames = ['Web Design Basics', 'Advanced React', 'Node.js Mastery', 'UI/UX Principles', 'Data Visualization'];
    const studentNames = [
      'Emma Watson', 'James Bond', 'Sara Connor', 'John Wick', 'Luke Skywalker',
      'Leia Organa', 'Tony Stark', 'Bruce Wayne', 'Peter Parker', 'Diana Prince',
      'Clark Kent', 'Barry Allen', 'Arthur Curry', 'Victor Stone', 'Natasha Romanoff'
    ];

    const insertBatch = db.prepare("INSERT INTO batches (name, description, startDate, studentCount, averageAttendance) VALUES (?, ?, ?, 15, ?)");
    const insertSession = db.prepare("INSERT INTO sessions (batchId, sessionNumber, date, title, attendanceCount) VALUES (?, ?, ?, ?, ?)");
    const insertStudent = db.prepare("INSERT INTO students (name, email, batchId, attendancePercentage) VALUES (?, ?, ?, ?)");
    const insertAttendance = db.prepare("INSERT INTO attendance (batchId, sessionId, studentId, status) VALUES (?, ?, ?, ?)");

    const seedAll = db.transaction(() => {
      for (const bName of batchNames) {
        const avgAttendance = Math.floor(Math.random() * 20) + 80;
        const batchResult = insertBatch.run(bName, `Comprehensive course on ${bName}.`, new Date().toISOString().split('T')[0], avgAttendance);
        const batchId = batchResult.lastInsertRowid as number;

        const sessionIds: number[] = [];
        for (let i = 0; i < 12; i++) {
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() - ((12 - i) * 7));
          const sResult = insertSession.run(batchId, i + 1, sessionDate.toISOString(), `Session ${i + 1}`, Math.floor(Math.random() * 5) + 10);
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
    res.json({ success: true, message: 'Dummy data seeded successfully!' });
  });

  // ── Health ─────────────────────────────────────────────────────────────

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ── Vite / Static ─────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
