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

// ─── MEDITATION TOOLS (Principle 7: Keep Tidy) ───

export function kappaDemote(args: { path: string; reason: string }) {
  const doc = sqlite.prepare(`SELECT * FROM kappa_documents WHERE path = ? AND folder = 'reference' AND is_immutable = 1`).get(args.path) as any;
  if (!doc) throw new Error(`Reference document not found or not immutable: ${args.path}`);

  const now = Math.floor(Date.now() / 1000);
  const newPath = doc.path.replace("reference/", "learnings/");

  // Create learnings version (mutable, not immutable)
  const result = sqlite.prepare(`
    INSERT INTO kappa_documents (zone, folder, path, title, content, summary, concepts, is_immutable, created_at)
    VALUES ('memory', 'learnings', ?, ?, ?, ?, ?, 0, ?)
  `).run(newPath, doc.title, doc.content, doc.summary, doc.concepts, now);

  // Mark reference as superseded by the demoted learning
  sqlite.prepare(`UPDATE kappa_documents SET superseded_by = ? WHERE id = ?`).run(result.lastInsertRowid, doc.id);

  // Log the demotion
  sqlite.prepare(`
    INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved)
    VALUES (?, ?, ?, ?, 1)
  `).run(doc.id, result.lastInsertRowid, `Demoted from reference: ${args.reason}`, now);

  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, 'kappa_demote', 'demote', ?, ?)
  `).run(now, args.path, `→ ${newPath}: ${args.reason}`);

  // Update FTS: remove old, add new
  sqlite.prepare(`DELETE FROM kappa_fts WHERE rowid = ?`).run(doc.id);
  sqlite.prepare(`INSERT INTO kappa_fts (rowid, title, content, summary, concepts) VALUES (?, ?, ?, ?, ?)`)
    .run(result.lastInsertRowid, doc.title, doc.content, doc.summary || "", doc.concepts || "");

  return { oldPath: args.path, newPath, newId: result.lastInsertRowid, reason: args.reason };
}

export function kappaDefrag() {
  const now = Math.floor(Date.now() / 1000);
  const changes: { action: string; detail: string }[] = [];

  // Step 1: Find duplicates (same title in same folder)
  const duplicates = sqlite.prepare(`
    SELECT title, folder, COUNT(*) as cnt FROM kappa_documents
    WHERE superseded_by IS NULL AND title IS NOT NULL AND title != ''
    GROUP BY title, folder HAVING cnt > 1
  `).all() as any[];

  // Step 2: Find orphaned supersedes (superseded_by set but no log entry)
  const orphans = sqlite.prepare(`
    SELECT d.id, d.path, d.superseded_by FROM kappa_documents d
    WHERE d.superseded_by IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM supersede_log s WHERE s.old_id = d.id
    )
  `).all() as any[];

  // Step 3: Find stale work/ items older than 7 days
  const sevenDaysAgo = now - 7 * 86400;
  const staleWork = sqlite.prepare(`
    SELECT id, path, folder, title FROM kappa_documents
    WHERE zone = 'work' AND created_at < ? AND superseded_by IS NULL
  `).all(sevenDaysAgo) as any[];

  // Step 4: Count by zone for summary
  const zoneCounts = sqlite.prepare(`
    SELECT zone, folder, COUNT(*) as count FROM kappa_documents
    WHERE superseded_by IS NULL GROUP BY zone, folder
  `).all() as any[];

  // Fix orphaned supersedes by creating log entries
  for (const orphan of orphans) {
    sqlite.prepare(`
      INSERT INTO supersede_log (old_id, new_id, reason, superseded_at, human_approved)
      VALUES (?, ?, 'defrag: auto-repaired orphaned supersede', ?, 0)
    `).run(orphan.id, orphan.superseded_by, now);
    changes.push({ action: "repair-orphan", detail: `${orphan.path} → ${orphan.superseded_by}` });
  }

  // Log defrag activity
  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, 'kappa_defrag', 'defrag', 'vault', ?)
  `).run(now, JSON.stringify({ duplicatesFound: duplicates.length, orphansRepaired: orphans.length, staleWork: staleWork.length }));

  return {
    duplicatesFound: duplicates.length,
    duplicates: duplicates,
    orphansRepaired: orphans.length,
    staleWorkItems: staleWork.length,
    staleWork: staleWork,
    zoneCounts,
    changes,
    defraggedAt: now,
  };
}