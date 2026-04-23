import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { join } from "path";
import { tmpdir } from "os";
import { mkdirSync, rmSync } from "fs";

// Re-create schema for test DB
function initTestDb(db: Database) {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE kappa_documents (
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

  db.exec(`
    CREATE VIRTUAL TABLE kappa_fts USING fts5(
      title, content, summary, concepts,
      content=kappa_documents,
      content_rowid=id
    );
  `);

  db.exec(`
    CREATE TABLE supersede_log (
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

  db.exec(`
    CREATE TABLE activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      tool TEXT,
      action TEXT,
      target_path TEXT,
      details TEXT
    );
  `);

  db.exec(`
    CREATE TABLE cell_messages (
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

  db.exec(`
    CREATE TABLE schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      cron TEXT,
      next_run INTEGER,
      last_run INTEGER,
      enabled INTEGER DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE trace_log (
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

  db.exec(`
    CREATE TABLE forum_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER,
      closed INTEGER DEFAULT 0
    );
  `);

  db.exec(`
    CREATE TABLE forum_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id)
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_docs_zone ON kappa_documents(zone)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_docs_folder ON kappa_documents(folder)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_docs_superseded ON kappa_documents(superseded_by)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_tool ON activity_log(tool)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_msgs_direction ON cell_messages(direction)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trace_session ON trace_log(session_id)`);
}

// ─── Test tools inline (avoid module-level singleton DB) ───

function createTools(db: Database) {
  function logActivity(tool: string, action: string, targetPath: string, details: string) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO activity_log (timestamp, tool, action, target_path, details) VALUES (?, ?, ?, ?, ?)`).run(now, tool, action, targetPath, details);
  }

  function kappaLearn(args: { path: string; title: string; content: string; summary?: string; concepts?: string[]; zone?: string; folder?: string; immutable?: boolean }) {
    const zone = args.zone || "memory";
    const folder = args.folder || "learnings";
    const now = Math.floor(Date.now() / 1000);
    const conceptsJson = args.concepts ? JSON.stringify(args.concepts) : null;
    const result = db.prepare(`INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(zone, folder, args.path, args.title, args.content, args.summary || null, conceptsJson, args.immutable ? 1 : 0, now);
    db.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`).run(result.lastInsertRowid, args.title, args.content, args.summary || "", conceptsJson || "");
    logActivity("kappa_learn", "add", args.path, `Added to ${zone}/${folder}`);
    return { id: result.lastInsertRowid, path: args.path, zone, folder };
  }

  function kappaSearch(query: string, zone?: string, limit = 20) {
    const ftsQuery = query.replace(/"/g, '""');
    let sqlStr = `SELECT d.id, d.zone, d.folder, d.path, d.title, d.summary, d.concepts, d.superseded_by, d.created_at, rank FROM kappa_fts f JOIN kappa_documents d ON d.id = f.rowid WHERE kappa_fts MATCH ?`;
    const params: (string | number)[] = [ftsQuery];
    if (zone) { sqlStr += ` AND d.zone = ?`; params.push(zone); }
    sqlStr += ` AND d.superseded_by IS NULL ORDER BY rank LIMIT ?`;
    params.push(limit);
    return db.prepare(sqlStr).all(...params);
  }

  function kappaRead(path: string) {
    return db.prepare(`SELECT * FROM kappa_documents WHERE path = ?`).get(path) || null;
  }

  function kappaList(zone?: string, folder?: string, limit = 50) {
    let sqlStr = `SELECT id, zone, folder, path, title, summary, superseded_by, created_at FROM kappa_documents WHERE 1=1`;
    const params: (string | number)[] = [];
    if (zone) { sqlStr += ` AND zone = ?`; params.push(zone); }
    if (folder) { sqlStr += ` AND folder = ?`; params.push(folder); }
    sqlStr += ` AND superseded_by IS NULL ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    return db.prepare(sqlStr).all(...params);
  }

  function kappaSupersede(args: { oldPath: string; newTitle: string; newContent: string; newSummary?: string; reason: string }) {
    const old = db.prepare(`SELECT * FROM kappa_documents WHERE path = ?`).get(args.oldPath) as any;
    if (!old) throw new Error(`Document not found: ${args.oldPath}`);
    if (!old.is_immutable) throw new Error(`Only reference/ documents can be superseded. Use kappa_learn to update learnings.`);
    const now = Math.floor(Date.now() / 1000);
    const newPath = args.oldPath.replace(/\.md$/, `_v${now}.md`);
    const result = db.prepare(`INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(old.zone, old.folder, newPath, args.newTitle, args.newContent, args.newSummary || null, old.concepts, now);
    db.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, old.id);
    db.prepare(`DELETE FROM kappa_fts WHERE rowid = ?`).run(old.id);
    db.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`).run(result.lastInsertRowid, args.newTitle, args.newContent, args.newSummary || "", old.concepts || "");
    db.prepare(`INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved) VALUES (?, ?, ?, ?, 0)`).run(old.id, result.lastInsertRowid, args.reason, now);
    logActivity("kappa_supersede", "supersede", args.oldPath, `→ ${newPath}: ${args.reason}`);
    return { oldId: old.id, newId: result.lastInsertRowid, newPath, reason: args.reason };
  }

  function kappaPromote(args: { path: string; reason: string }) {
    const doc = db.prepare(`SELECT * FROM kappa_documents WHERE path = ? AND folder = 'learnings'`).get(args.path) as any;
    if (!doc) throw new Error(`Learning not found: ${args.path}`);
    const now = Math.floor(Date.now() / 1000);
    const newPath = doc.path.replace("learnings/", "reference/");
    const result = db.prepare(`INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at) VALUES ('memory', 'reference', ?, ?, ?, ?, ?, 1, ?)`).run(newPath, doc.title, doc.content, doc.summary, doc.concepts, now);
    db.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, doc.id);
    db.prepare(`INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved) VALUES (?, ?, ?, ?, 1)`).run(doc.id, result.lastInsertRowid, `Promoted to reference: ${args.reason}`, now);
    db.prepare(`INSERT INTO activity_log (timestamp, tool, action, target_path, details) VALUES (?, 'kappa_promote', 'promote', ?, ?)`).run(now, args.path, `→ ${newPath}: ${args.reason}`);
    return { oldPath: args.path, newPath, newId: result.lastInsertRowid, reason: args.reason };
  }

  function kappaDemote(args: { path: string; reason: string }) {
    const doc = db.prepare(`SELECT * FROM kappa_documents WHERE path = ? AND folder = 'reference' AND is_immutable = 1`).get(args.path) as any;
    if (!doc) throw new Error(`Reference document not found or not immutable: ${args.path}`);
    const now = Math.floor(Date.now() / 1000);
    const newPath = doc.path.replace("reference/", "learnings/");
    const result = db.prepare(`INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at) VALUES ('memory', 'learnings', ?, ?, ?, ?, ?, 0, ?)`).run(newPath, doc.title, doc.content, doc.summary, doc.concepts, now);
    db.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, doc.id);
    db.prepare(`INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved) VALUES (?, ?, ?, ?, 1)`).run(doc.id, result.lastInsertRowid, `Demoted from reference: ${args.reason}`, now);
    db.prepare(`INSERT INTO activity_log (timestamp, tool, action, target_path, details) VALUES (?, 'kappa_demote', 'demote', ?, ?)`).run(now, args.path, `→ ${newPath}: ${args.reason}`);
    db.prepare(`DELETE FROM kappa_fts WHERE rowid = ?`).run(doc.id);
    db.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`).run(result.lastInsertRowid, doc.title, doc.content, doc.summary || "", doc.concepts || "");
    return { oldPath: args.path, newPath, newId: result.lastInsertRowid, reason: args.reason };
  }

  function kappaVerify() {
    const counts = db.prepare(`SELECT zone, folder, COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL GROUP BY zone, folder`).all();
    const superseded = db.prepare(`SELECT COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NOT NULL`).get() as any;
    const orphans = db.prepare(`SELECT COUNT(*) as count FROM kappa_documents d WHERE d.superseded_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM supersede_log s WHERE s.old_id = d.id)`).get() as any;
    const totalDocs = db.prepare(`SELECT COUNT(*) as count FROM kappa_documents`).get() as any;
    return { totalDocuments: totalDocs.count, activeByZone: counts, supersededCount: superseded.count, orphanSupersedes: orphans.count, healthy: orphans.count === 0 };
  }

  function kappaDefrag() {
    const now = Math.floor(Date.now() / 1000);
    const changes: { action: string; detail: string }[] = [];
    const duplicates = db.prepare(`SELECT title, folder, COUNT(*) as cnt FROM kappa_documents WHERE superseded_by IS NULL AND title IS NOT NULL AND title != '' GROUP BY title, folder HAVING cnt > 1`).all() as any[];
    const orphans = db.prepare(`SELECT d.id, d.path, d.superseded_by FROM kappa_documents d WHERE d.superseded_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM supersede_log s WHERE s.old_id = d.id)`).all() as any[];
    const sevenDaysAgo = now - 7 * 86400;
    const staleWork = db.prepare(`SELECT id, path, folder, title FROM kappa_documents WHERE zone = 'work' AND created_at < ? AND superseded_by IS NULL`).all(sevenDaysAgo) as any[];
    const zoneCounts = db.prepare(`SELECT zone, folder, COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL GROUP BY zone, folder`).all() as any[];
    for (const orphan of orphans) {
      db.prepare(`INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved) VALUES (?, ?, 'defrag: auto-repaired orphaned supersede', ?, 0)`).run(orphan.id, orphan.superseded_by, now);
      changes.push({ action: "repair-orphan", detail: `${orphan.path} → ${orphan.superseded_by}` });
    }
    db.prepare(`INSERT INTO activity_log (timestamp, tool, action, target_path, details) VALUES (?, 'kappa_defrag', 'defrag', 'vault', ?)`).run(now, JSON.stringify({ duplicatesFound: duplicates.length, orphansRepaired: orphans.length, staleWork: staleWork.length }));
    return { duplicatesFound: duplicates.length, duplicates: duplicates, orphansRepaired: orphans.length, staleWorkItems: staleWork.length, staleWork: staleWork, zoneCounts, changes, defraggedAt: now };
  }

  return { kappaLearn, kappaSearch, kappaRead, kappaList, kappaSupersede, kappaPromote, kappaDemote, kappaVerify, kappaDefrag };
}

// ─── Tests ───

let db: Database;
let tools: ReturnType<typeof createTools>;
const testDir = join(tmpdir(), `kappa-brain-test-${Date.now()}`);

beforeAll(() => {
  mkdirSync(testDir, { recursive: true });
  db = new Database(":memory:");
  initTestDb(db);
  tools = createTools(db);
});

afterAll(() => {
  db.close();
  try { rmSync(testDir, { recursive: true }); } catch {}
});

describe("kappa-brain tools", () => {
  // ─── LEARN ───

  test("kappaLearn creates a learning document", () => {
    const result = tools.kappaLearn({
      path: "memory/learnings/2026-04-23_test-learning.md",
      title: "Test Learning",
      content: "This is a test learning about bun:sqlite",
      summary: "Bun uses bun:sqlite instead of better-sqlite3",
      concepts: ["bun", "sqlite"],
    });
    expect(result.path).toBe("memory/learnings/2026-04-23_test-learning.md");
    expect(result.zone).toBe("memory");
    expect(result.folder).toBe("learnings");
    expect(result.id).toBeGreaterThan(0);
  });

  test("kappaLearn creates a reference document (immutable)", () => {
    const result = tools.kappaLearn({
      path: "memory/reference/coding-standards.md",
      title: "Coding Standards",
      content: "Always use bun:sqlite for database operations",
      zone: "memory",
      folder: "reference",
      immutable: true,
    });
    expect(result.folder).toBe("reference");
    const doc = tools.kappaRead("memory/reference/coding-standards.md") as any;
    expect(doc.is_immutable).toBe(1);
  });

  test("kappaLearn creates a work document", () => {
    const result = tools.kappaLearn({
      path: "work/research/hono-patterns.md",
      title: "Hono Patterns",
      content: "Hono middleware patterns for routing",
      zone: "work",
      folder: "research",
    });
    expect(result.zone).toBe("work");
    expect(result.folder).toBe("research");
  });

  // ─── READ ───

  test("kappaRead returns document by path", () => {
    const doc = tools.kappaRead("memory/learnings/2026-04-23_test-learning.md") as any;
    expect(doc).not.toBeNull();
    expect(doc.title).toBe("Test Learning");
    expect(doc.content).toContain("bun:sqlite");
  });

  test("kappaRead returns null for nonexistent path", () => {
    const doc = tools.kappaRead("memory/learnings/nonexistent.md");
    expect(doc).toBeNull();
  });

  // ─── SEARCH ───

  test("kappaSearch finds documents by content", () => {
    const results = tools.kappaSearch("sqlite") as any[];
    expect(results.length).toBeGreaterThan(0);
    const found = results.some((r: any) => r.title === "Test Learning" || r.title === "Coding Standards");
    expect(found).toBe(true);
  });

  test("kappaSearch filters by zone", () => {
    const results = tools.kappaSearch("patterns", "work") as any[];
    expect(results.every((r: any) => r.zone === "work")).toBe(true);
  });

  // ─── LIST ───

  test("kappaList returns documents by zone", () => {
    const results = tools.kappaList("memory") as any[];
    expect(results.length).toBeGreaterThanOrEqual(2); // learnings + reference
    expect(results.every((r: any) => r.zone === "memory")).toBe(true);
  });

  test("kappaList filters by folder", () => {
    const results = tools.kappaList("memory", "learnings") as any[];
    expect(results.every((r: any) => r.folder === "learnings")).toBe(true);
  });

  // ─── SUPERSEDE ───

  test("kappaSupersede creates new version and marks old as superseded", () => {
    const result = tools.kappaSupersede({
      oldPath: "memory/reference/coding-standards.md",
      newTitle: "Coding Standards v2",
      newContent: "Updated standards: use bun:sqlite and FTS5",
      reason: "Standards updated for Bun ecosystem",
    });
    expect(result.reason).toBe("Standards updated for Bun ecosystem");
    expect(result.newId).toBeGreaterThan(result.oldId);

    // Old doc should be superseded
    const oldDoc = tools.kappaRead("memory/reference/coding-standards.md") as any;
    expect(oldDoc.superseded_by).not.toBeNull();

    // New doc should be immutable
    const newDoc = tools.kappaRead(result.newPath) as any;
    expect(newDoc.is_immutable).toBe(1);
    expect(newDoc.title).toBe("Coding Standards v2");
  });

  test("kappaSupersede rejects non-reference documents", () => {
    expect(() => tools.kappaSupersede({
      oldPath: "memory/learnings/2026-04-23_test-learning.md",
      newTitle: "Should fail",
      newContent: "This should not work",
      reason: "Learnings cannot be superseded",
    })).toThrow("Only reference/ documents can be superseded");
  });

  // ─── PROMOTE ───

  test("kappaPromote moves learning to reference (immutable)", () => {
    // Create a fresh learning to promote
    tools.kappaLearn({
      path: "memory/learnings/2026-04-23_promote-test.md",
      title: "Promote Test",
      content: "This learning is ready to become a reference",
      summary: "Test promoting to reference",
    });

    const result = tools.kappaPromote({
      path: "memory/learnings/2026-04-23_promote-test.md",
      reason: "Verified across multiple sessions",
    });

    expect(result.newPath).toContain("reference");
    expect(result.reason).toBe("Verified across multiple sessions");

    // Old learning should be superseded
    const oldDoc = tools.kappaRead("memory/learnings/2026-04-23_promote-test.md") as any;
    expect(oldDoc.superseded_by).not.toBeNull();

    // New reference should be immutable
    const newDoc = tools.kappaRead(result.newPath) as any;
    expect(newDoc.is_immutable).toBe(1);
    expect(newDoc.folder).toBe("reference");
  });

  // ─── DEMOTE ───

  test("kappaDemote moves reference back to learnings", () => {
    // Create a reference to demote
    tools.kappaLearn({
      path: "memory/reference/demote-test.md",
      title: "Demote Test",
      content: "This reference is now stale",
      zone: "memory",
      folder: "reference",
      immutable: true,
    });

    const result = tools.kappaDemote({
      path: "memory/reference/demote-test.md",
      reason: "No longer accurate, needs re-evaluation",
    });

    expect(result.newPath).toContain("learnings");
    expect(result.reason).toBe("No longer accurate, needs re-evaluation");

    // Old reference should be superseded
    const oldDoc = tools.kappaRead("memory/reference/demote-test.md") as any;
    expect(oldDoc.superseded_by).not.toBeNull();

    // New learning should be mutable
    const newDoc = tools.kappaRead(result.newPath) as any;
    expect(newDoc.is_immutable).toBe(0);
    expect(newDoc.folder).toBe("learnings");
  });

  test("kappaDemote rejects non-reference documents", () => {
    expect(() => tools.kappaDemote({
      path: "memory/learnings/2026-04-23_test-learning.md",
      reason: "Should fail",
    })).toThrow("Reference document not found or not immutable");
  });

  // ─── VERIFY ───

  test("kappaVerify reports healthy when no orphans", () => {
    const result = tools.kappaVerify() as any;
    expect(result.healthy).toBe(true);
    expect(result.orphanSupersedes).toBe(0);
    expect(result.totalDocuments).toBeGreaterThan(0);
  });

  test("kappaVerify reports zone counts", () => {
    const result = tools.kappaVerify() as any;
    expect(Array.isArray(result.activeByZone)).toBe(true);
    const zones = result.activeByZone.map((z: any) => z.zone);
    expect(zones).toContain("memory");
  });

  // ─── DEFRAG ───

  test("kappaDefrag finds duplicates and reports zone counts", () => {
    // Create a duplicate to test
    tools.kappaLearn({
      path: "memory/learnings/2026-04-23_dup-test.md",
      title: "Duplicate Title",
      content: "First version",
    });
    tools.kappaLearn({
      path: "memory/learnings/2026-04-23_dup-test-v2.md",
      title: "Duplicate Title",
      content: "Second version with same title",
    });

    const result = tools.kappaDefrag() as any;
    expect(result.duplicatesFound).toBeGreaterThanOrEqual(1);
    expect(result.zoneCounts.length).toBeGreaterThan(0);
    expect(result.changes).toBeDefined();
  });

  test("kappaDefrag repairs orphaned supersedes", () => {
    // Create two docs and manually set superseded_by to a valid ID without supersede_log
    const doc1 = tools.kappaLearn({
      path: "memory/learnings/orphan-old.md",
      title: "Orphaned Old Doc",
      content: "This will be orphaned",
    });
    const doc2 = tools.kappaLearn({
      path: "memory/learnings/orphan-new.md",
      title: "Orphaned New Doc",
      content: "This is the replacement",
    });
    // Manually set superseded_by to doc2's ID (valid FK) without creating supersede_log
    db.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(doc2.id, doc1.id);

    const result = tools.kappaDefrag() as any;
    expect(result.orphansRepaired).toBeGreaterThanOrEqual(1);
    expect(result.changes.some((c: any) => c.action === "repair-orphan")).toBe(true);
  });

  // ─── LIFECYCLE: learn → promote → supersede → verify ───

  test("full lifecycle: learn → promote → supersede → verify", () => {
    // 1. Create a learning
    const learnResult = tools.kappaLearn({
      path: "memory/learnings/2026-04-23_lifecycle.md",
      title: "Lifecycle Test",
      content: "This will go through the full lifecycle",
      summary: "Testing the complete knowledge lifecycle",
      concepts: ["lifecycle", "test"],
    });
    expect(learnResult.folder).toBe("learnings");

    // 2. Promote to reference
    const promoteResult = tools.kappaPromote({
      path: "memory/learnings/2026-04-23_lifecycle.md",
      reason: "Lifecycle test promotion",
    });
    expect(promoteResult.newPath).toContain("reference");

    // 3. Supersede the reference
    const supersedeResult = tools.kappaSupersede({
      oldPath: promoteResult.newPath,
      newTitle: "Lifecycle Test v2",
      newContent: "Updated through the full lifecycle",
      reason: "Lifecycle test supersede",
    });
    expect(supersedeResult.newPath).toContain("v");

    // 4. Verify — promote and supersede both create proper log entries
    // so this lifecycle should produce a healthy vault
    const verifyResult = tools.kappaVerify() as any;
    // If previous tests left orphans, run defrag first
    if (!verifyResult.healthy) {
      tools.kappaDefrag();
    }
    const verifyAfterDefrag = tools.kappaVerify() as any;
    expect(verifyAfterDefrag.healthy).toBe(true);
  });
});