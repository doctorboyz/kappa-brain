import { sqlite } from "../db/index.js";
import { eq, and, like, desc, asc, sql, isNull } from "drizzle-orm";
import { kappaDocuments, supersedeLog, activityLog, cellMessages, schedule, traceLog, forumThreads, forumMessages } from "../db/schema.js";

// ─── CRITICAL TOOLS (8) ───

export function kappaSearch(query: string, zone?: string, limit = 20) {
  const ftsQuery = query.replace(/"/g, '""');
  let sqlStr = `
    SELECT d.id, d.zone, d.folder, d.path, d.title, d.summary, d.concepts, d.superseded_by, d.created_at,
           rank
    FROM kappa_fts f
    JOIN kappa_documents d ON d.id = f.rowid
    WHERE kappa_fts MATCH ?
  `;
  const params: (string | number)[] = [ftsQuery];

  if (zone) {
    sqlStr += ` AND d.zone = ?`;
    params.push(zone);
  }

  sqlStr += ` AND d.superseded_by IS NULL ORDER BY rank LIMIT ?`;
  params.push(limit);

  return sqlite.prepare(sqlStr).all(...params);
}

export function kappaRead(path: string) {
  const doc = sqlite.prepare(`SELECT * FROM kappa_documents WHERE path = ?`).get(path);
  return doc || null;
}

export function kappaList(zone?: string, folder?: string, limit = 50) {
  let sqlStr = `SELECT id, zone, folder, path, title, summary, superseded_by, created_at FROM kappa_documents WHERE 1=1`;
  const params: (string | number)[] = [];

  if (zone) {
    sqlStr += ` AND zone = ?`;
    params.push(zone);
  }
  if (folder) {
    sqlStr += ` AND folder = ?`;
    params.push(folder);
  }

  sqlStr += ` AND superseded_by IS NULL ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return sqlite.prepare(sqlStr).all(...params);
}

export function kappaLearn(args: {
  path: string;
  title: string;
  content: string;
  summary?: string;
  concepts?: string[];
  zone?: string;
  folder?: string;
  immutable?: boolean;
}) {
  const zone = args.zone || "memory";
  const folder = args.folder || "learnings";
  const now = Math.floor(Date.now() / 1000);
  const conceptsJson = args.concepts ? JSON.stringify(args.concepts) : null;

  const result = sqlite.prepare(`
    INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(zone, folder, args.path, args.title, args.content, args.summary || null, conceptsJson, args.immutable ? 1 : 0, now);

  // Update FTS
  sqlite.prepare(`
    INSERT INTO kappa_fts (rowid, title, content, summary, concepts)
    VALUES (?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, args.title, args.content, args.summary || "", conceptsJson || "");

  // Log activity
  logActivity("kappa_learn", "add", args.path, `Added to ${zone}/${folder}`);

  return { id: result.lastInsertRowid, path: args.path, zone, folder };
}

export function kappaSupersede(args: {
  oldPath: string;
  newTitle: string;
  newContent: string;
  newSummary?: string;
  reason: string;
}) {
  const old = sqlite.prepare(`SELECT * FROM kappa_documents WHERE path = ?`).get(args.oldPath) as any;
  if (!old) throw new Error(`Document not found: ${args.oldPath}`);
  if (!old.is_immutable) throw new Error(`Only reference/ documents can be superseded. Use kappa_learn to update learnings.`);

  const now = Math.floor(Date.now() / 1000);
  const newPath = args.oldPath.replace(/\.md$/, `_v${now}.md`);

  // Create new document
  const result = sqlite.prepare(`
    INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(old.zone, old.folder, newPath, args.newTitle, args.newContent, args.newSummary || null, old.concepts, now);

  // Mark old as superseded
  sqlite.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, old.id);

  // Update FTS for old doc
  sqlite.prepare(`DELETE FROM kappa_fts WHERE rowid = ?`).run(old.id);
  sqlite.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`)
    .run(result.lastInsertRowid, args.newTitle, args.newContent, args.newSummary || "", old.concepts || "");

  // Log supersede
  sqlite.prepare(`
    INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved)
    VALUES (?, ?, ?, ?, 0)
  `).run(old.id, result.lastInsertRowid, args.reason, now);

  logActivity("kappa_supersede", "supersede", args.oldPath, `→ ${newPath}: ${args.reason}`);

  return { oldId: old.id, newId: result.lastInsertRowid, newPath, reason: args.reason };
}

export function kappaReflect(zone?: string) {
  // Pick a random document from resonance/ and learnings/
  const targetZone = zone || "memory";
  const row = sqlite.prepare(`
    SELECT d.id, d.path, d.title, d.content, d.folder
    FROM kappa_documents d
    WHERE d.zone = ? AND d.superseded_by IS NULL
    ORDER BY RANDOM() LIMIT 1
  `).get(targetZone) as any;

  if (!row) return { wisdom: "No knowledge found in the vault yet. Use /born to begin.", source: null };

  logActivity("kappa_reflect", "reflect", row.path, `Random wisdom from ${row.folder}`);
  return { wisdom: row.content, title: row.title, source: row.path, folder: row.folder };
}

export function kappaHandoff() {
  // Get latest retrospective + recent learnings + active schedule
  const retro = sqlite.prepare(`
    SELECT path, title, content FROM kappa_documents
    WHERE folder = 'retrospectives' AND superseded_by IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).get() as any;

  const learnings = sqlite.prepare(`
    SELECT path, title, summary FROM kappa_documents
    WHERE folder = 'learnings' AND superseded_by IS NULL
    ORDER BY created_at DESC LIMIT 5
  `).all();

  const tasks = sqlite.prepare(`
    SELECT task, cron, next_run, enabled FROM schedule WHERE enabled = 1
  `).all();

  return { retrospective: retro, recentLearnings: learnings, scheduledTasks: tasks };
}

export function kappaInbox(args: { action: "receive" | "send" | "list"; fromCell?: string; toCell?: string; content?: string }) {
  if (args.action === "list") {
    return sqlite.prepare(`SELECT * FROM cell_messages WHERE archived = 0 ORDER BY sent_at DESC LIMIT 20`).all();
  }

  if (args.action === "receive") {
    const now = Math.floor(Date.now() / 1000);
    const result = sqlite.prepare(`
      INSERT INTO cell_messages (direction, from_cell, content, sent_at)
      VALUES ('in', ?, ?, ?)
    `).run(args.fromCell || "unknown", args.content || "", now);
    logActivity("kappa_inbox", "receive", args.fromCell || "unknown", (args.content || "").substring(0, 80));
    return { id: result.lastInsertRowid, direction: "in", from: args.fromCell };
  }

  if (args.action === "send") {
    const now = Math.floor(Date.now() / 1000);
    const result = sqlite.prepare(`
      INSERT INTO cell_messages (direction, to_cell, content, sent_at)
      VALUES ('out', ?, ?, ?)
    `).run(args.toCell || "unknown", args.content || "", now);
    logActivity("kappa_inbox", "send", args.toCell || "unknown", (args.content || "").substring(0, 80));
    return { id: result.lastInsertRowid, direction: "out", to: args.toCell };
  }

  throw new Error(`Unknown action: ${args.action}`);
}

export function kappaVerify() {
  const counts = sqlite.prepare(`
    SELECT zone, folder, COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL GROUP BY zone, folder
  `).all();

  const superseded = sqlite.prepare(`SELECT COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NOT NULL`).get() as any;
  const orphans = sqlite.prepare(`
    SELECT COUNT(*) as count FROM kappa_documents d
    WHERE d.superseded_by IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM supersede_log s WHERE s.old_id = d.id
    )
  `).get() as any;

  const totalDocs = sqlite.prepare(`SELECT COUNT(*) as count FROM kappa_documents`).get() as any;

  return {
    totalDocuments: totalDocs.count,
    activeByZone: counts,
    supersededCount: superseded.count,
    orphanSupersedes: orphans.count,
    healthy: orphans.count === 0,
  };
}

// ─── Helper ───

function logActivity(tool: string, action: string, targetPath: string, details: string) {
  const now = Math.floor(Date.now() / 1000);
  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(now, tool, action, targetPath, details);
}