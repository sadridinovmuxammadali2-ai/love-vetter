// Backend for "For Xusniya": stores the letter, her photo and her answers.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = Number(process.env.API_PORT) || 3001;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DEFAULT_LETTER = {
  recipient: 'Xusniya',
  sender: 'Yours, forever',
  caption: 'You are my everything',
  since: '',
  message: `Ever since you walked into my life, my whole world has been painted in brighter colors.

Every gentle smile of yours fills my heart with a joy and calm that never runs out. When I look into your eyes, it feels like I'm seeing the purest beauty the universe has to offer.

I love you not only in the happy moments, but in every second, with every breath — exactly as you are. You are my most beautiful dream and my most precious happiness.

Keep smiling, always. Because when you smile, the whole world becomes a little more beautiful.`,
};

// ---------- tiny JSON "database" ----------
function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { letter: { ...DEFAULT_LETTER }, photo: null, events: [] };
  }
}
let db = readDb();
function saveDb() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function addEvent(type, extra = {}) {
  db.events.push({ type, at: new Date().toISOString(), ...extra });
  db.events = db.events.slice(-500);
  saveDb();
}

// ---------- helpers ----------
const publicLetter = () => ({
  since: '',
  ...db.letter,
  photo: db.photo ? `/uploads/${db.photo}` : null,
  music: db.music ? `/uploads/${db.music}` : null,
});

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Public: what she sees
app.get('/api/letter', (_req, res) => {
  res.json(publicLetter());
});

// Public: she opened the envelope / tapped yes / tried to press no
app.post('/api/events', (req, res) => {
  const type = req.body?.type;
  if (!['opened', 'yes', 'no_attempt'].includes(type)) return res.status(400).json({ error: 'Unknown event' });
  addEvent(type);
  res.json({ ok: true });
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: false }));

// Serve the built React app in production
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
