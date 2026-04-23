import { sqlite } from "../db/index.js";

// ─── IMPORTANT TOOLS (8) ───

export function kappaLog(args: { action: "append" | "read" | "search"; date?: string; query?: string; entry?: string }) {
  const now = Math.floor(Date.now() / 1000);

  if (args.action === "append") {
    sqlite.prepare(`
      INSERT INTO activity_log (timestamp, tool, action, target_path, details)
      VALUES (?, 'system', 'auto-log', ?, ?)
    `).run(now, args.date || new Date().toISOString().split("T")[0], args.entry || "");
    return { logged: true };
  }

  if (args.action === "read") {
    const startOfDay = args.date ? Math.floor(new Date(args.date).getTime() / 1000) : now - 86400;
    return sqlite.prepare(`
      SELECT * FROM activity_log WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT 100
    `).all(startOfDay);
  }

  if (args.action === "search") {
    return sqlite.prepare(`
      SELECT * FROM activity_log WHERE details LIKE ? ORDER BY timestamp DESC LIMIT 50
    `).all(`%${args.query || ""}%`);
  }

  throw new Error(`Unknown action: ${args.action}`);
}

export function kappaWork(args: {
  action: "draft" | "lab" | "research";
  operation: "create" | "read" | "list" | "delete";
  path?: string;
  title?: string;
  content?: string;
}) {
  const zone = "work";
  const folder = args.action; // drafts, lab, or research
  const now = Math.floor(Date.now() / 1000);

  if (args.operation === "list") {
    return sqlite.prepare(`
      SELECT id, path, title, summary, created_at FROM kappa_documents
      WHERE zone = ? AND folder = ? AND superseded_by IS NULL
      ORDER BY created_at DESC LIMIT 50
    `).all(zone, folder);
  }

  if (args.operation === "create") {
    const path = args.path || `${zone}/${folder}/${now}_${(args.title || "untitled").replace(/\s+/g, "-").toLowerCase()}.md`;
    const result = sqlite.prepare(`
      INSERT INTO kappa_documents (zone, folder, path, title, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(zone, folder, path, args.title || "Untitled", args.content || "", now);

    sqlite.prepare(`
      INSERT INTO kappa_fts (rowid, title, content, summary, concepts)
      VALUES (?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, args.title || "", args.content || "", "", "");

    return { id: result.lastInsertRowid, path, zone, folder };
  }

  if (args.operation === "read") {
    return sqlite.prepare(`SELECT * FROM kappa_documents WHERE zone = ? AND folder = ? AND path = ?`)
      .get(zone, folder, args.path);
  }

  if (args.operation === "delete") {
    // Ephemeral: work/ zone CAN be cleared (not Principle 1 — work is ephemeral)
    sqlite.prepare(`DELETE FROM kappa_fts WHERE rowid IN (SELECT id FROM kappa_documents WHERE zone = ? AND folder = ? AND path = ?)`)
      .run(zone, folder, args.path);
    sqlite.prepare(`DELETE FROM kappa_documents WHERE zone = ? AND folder = ? AND path = ?`)
      .run(zone, folder, args.path);
    return { deleted: true, path: args.path };
  }

  throw new Error(`Unknown operation: ${args.operation}`);
}

export function kappaArchive(args: { path: string; reason?: string }) {
  const doc = sqlite.prepare(`SELECT * FROM kappa_documents WHERE path = ?`).get(args.path) as any;
  if (!doc) throw new Error(`Document not found: ${args.path}`);

  const now = Math.floor(Date.now() / 1000);
  const archivePath = `archive/${doc.folder}/${doc.path.replace(/^\w+\/\w+\//, "")}`;

  // Move to archive zone
  sqlite.prepare(`
    UPDATE kappa_documents SET zone = 'archive', path = ?, updated_at = ? WHERE id = ?
  `).run(archivePath, now, doc.id);

  // Update FTS
  sqlite.prepare(`DELETE FROM kappa_fts WHERE rowid = ?`).run(doc.id);
  sqlite.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`)
    .run(doc.id, doc.title, doc.content, doc.summary || "", doc.concepts || "");

  const logEntry = `Archived ${args.path} → ${archivePath}: ${args.reason || "completed"}`;
  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, 'kappa_archive', 'archive', ?, ?)
  `).run(now, args.path, logEntry);

  return { archived: true, oldPath: args.path, newPath: archivePath };
}

export function kappaPromote(args: { path: string; reason: string }) {
  const doc = sqlite.prepare(`SELECT * FROM kappa_documents WHERE path = ? AND folder = 'learnings'`).get(args.path) as any;
  if (!doc) throw new Error(`Learning not found: ${args.path}`);

  const now = Math.floor(Date.now() / 1000);
  const newPath = doc.path.replace("learnings/", "reference/");

  // Create reference version (immutable)
  const result = sqlite.prepare(`
    INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at)
    VALUES ('memory', 'reference', ?, ?, ?, ?, ?, 1, ?)
  `).run(newPath, doc.title, doc.content, doc.summary, doc.concepts, now);

  // Mark learning as superseded by the new reference
  sqlite.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, doc.id);

  // Log the promotion
  sqlite.prepare(`
    INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved)
    VALUES (?, ?, ?, ?, 1)
  `).run(doc.id, result.lastInsertRowid, `Promoted to reference: ${args.reason}`, now);

  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, 'kappa_promote', 'promote', ?, ?)
  `).run(now, args.path, `→ ${newPath}: ${args.reason}`);

  return { oldPath: args.path, newPath, newId: result.lastInsertRowid, reason: args.reason };
}

export function kappaScheduleAdd(args: { task: string; cron?: string; nextRun?: number }) {
  const result = sqlite.prepare(`
    INSERT INTO schedule (task, cron, next_run, enabled) VALUES (?, ?, ?, 1)
  `).run(args.task, args.cron || null, args.nextRun || null);
  return { id: result.lastInsertRowid, task: args.task };
}

export function kappaScheduleList() {
  return sqlite.prepare(`SELECT * FROM schedule WHERE enabled = 1 ORDER BY next_run ASC`).all();
}

export function kappaTrace(args: { sessionId: string; tool: string; action?: string; input?: string; output?: string; durationMs?: number }) {
  const result = sqlite.prepare(`
    INSERT INTO trace_log (session_id, tool, action, input, output, started_at, duration_ms)
    VALUES (?, ?, ?, ?, ?, unixepoch(), ?)
  `).run(args.sessionId, args.tool, args.action || "", args.input || null, args.output || null, args.durationMs || null);
  return { id: result.lastInsertRowid };
}

export function kappaTraceList(args: { sessionId: string; limit?: number }) {
  return sqlite.prepare(`
    SELECT * FROM trace_log WHERE session_id = ? ORDER BY started_at DESC LIMIT ?
  `).all(args.sessionId, args.limit || 50);
}

export function kappaTraceGet(args: { id: number }) {
  return sqlite.prepare(`SELECT * FROM trace_log WHERE id = ?`).get(args.id);
}