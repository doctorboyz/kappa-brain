import { Database } from "bun:sqlite";
import { join } from "path";

const VAULT_ROOT = process.env.KAPPA_VAULT || process.cwd();
const DB_PATH = process.env.KAPPA_DB || join(VAULT_ROOT, "kappa-brain.db");

const sqlite = new Database(DB_PATH);
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

// ─── Schema ───

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS kappa_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone TEXT NOT NULL,
    folder TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    summary TEXT,
    concepts TEXT,
    is_immutable INTEGER DEFAULT 0,
    superseded_by INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER
  );
`);

sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS kappa_fts USING fts5(
    title, content, summary, concepts,
    content=kappa_documents,
    content_rowid=id
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS supersede_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    old_id INTEGER NOT NULL,
    new_id INTEGER NOT NULL,
    reason TEXT,
    superseded_at INTEGER NOT NULL DEFAULT (unixepoch()),
    human_approved INTEGER DEFAULT 0,
    FOREIGN KEY (old_id) REFERENCES kappa_documents(id),
    FOREIGN KEY (new_id) REFERENCES kappa_documents(id)
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    tool TEXT,
    action TEXT,
    target_path TEXT,
    details TEXT
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS cell_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL,
    from_cell TEXT,
    to_cell TEXT,
    content TEXT,
    sent_at INTEGER,
    delivered_at INTEGER,
    archived INTEGER DEFAULT 0
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    cron TEXT,
    next_run INTEGER,
    last_run INTEGER,
    enabled INTEGER DEFAULT 1
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS trace_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    parent_trace_id INTEGER,
    tool TEXT NOT NULL,
    action TEXT,
    input TEXT,
    output TEXT,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    duration_ms INTEGER
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    topic TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER,
    closed INTEGER DEFAULT 0
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS forum_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (thread_id) REFERENCES forum_threads(id)
  );
`);

// Indexes
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_docs_zone ON kappa_documents(zone)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_docs_folder ON kappa_documents(folder)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_docs_superseded ON kappa_documents(superseded_by)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_tool ON activity_log(tool)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(timestamp)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_msgs_direction ON cell_messages(direction)`);
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_trace_session ON trace_log(session_id)`);

export { sqlite };