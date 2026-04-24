import { sqlite } from "../db/index.js";

// ─── NICE-TO-HAVE TOOLS (4) ───

export function kappaConcepts(args: { query?: string }) {
  // Extract unique concepts from the concepts JSON field
  const rows = sqlite.prepare(`
    SELECT concepts FROM kappa_documents
    WHERE concepts IS NOT NULL AND superseded_by IS NULL
  `).all() as any[];

  const conceptMap = new Map<string, number>();
  for (const row of rows) {
    try {
      const concepts = JSON.parse(row.concepts);
      for (const c of concepts) {
        conceptMap.set(c, (conceptMap.get(c) || 0) + 1);
      }
    } catch {}
  }

  const sorted = [...conceptMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  return { concepts: sorted, total: conceptMap.size };
}

export function kappaThread(args: { action: "create" | "list" | "read"; title?: string; topic?: string }) {
  const now = Math.floor(Date.now() / 1000);

  if (args.action === "create") {
    const result = sqlite.prepare(`
      INSERT INTO forum_threads (title, topic, created_at) VALUES (?, ?, ?)
    `).run(args.title || "Untitled", args.topic || null, now);
    return { id: result.lastInsertRowid, title: args.title };
  }

  if (args.action === "list") {
    return sqlite.prepare(`
      SELECT t.*, COUNT(m.id) as message_count
      FROM forum_threads t
      LEFT JOIN forum_messages m ON m.thread_id = t.id
      WHERE t.closed = 0
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `).all();
  }

  if (args.action === "read") {
    if (!args.title) throw new Error("title (thread ID) is required for read action");
    const thread = sqlite.prepare(`SELECT * FROM forum_threads WHERE id = ?`).get(args.title);
    const messages = sqlite.prepare(`SELECT * FROM forum_messages WHERE thread_id = ? ORDER BY created_at ASC`).all(args.title);
    return { thread, messages };
  }

  throw new Error(`Unknown action: ${args.action}`);
}

export function kappaThreads() {
  return sqlite.prepare(`
    SELECT t.*, COUNT(m.id) as message_count
    FROM forum_threads t
    LEFT JOIN forum_messages m ON m.thread_id = t.id
    WHERE t.closed = 0
    GROUP BY t.id
    ORDER BY t.updated_at DESC
  `).all();
}

export function kappaThreadUpdate(args: { threadId: number; author: string; content: string }) {
  const now = Math.floor(Date.now() / 1000);
  const result = sqlite.prepare(`
    INSERT INTO forum_messages (thread_id, author, content, created_at) VALUES (?, ?, ?, ?)
  `).run(args.threadId, args.author, args.content, now);

  sqlite.prepare(`UPDATE forum_threads SET updated_at = ? WHERE id = ?`).run(now, args.threadId);

  return { id: result.lastInsertRowid, threadId: args.threadId };
}

export function kappaStats() {
  const totalDocs = sqlite.prepare(`SELECT COUNT(*) as count FROM kappa_documents`).get() as any;
  const activeDocs = sqlite.prepare(`SELECT COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL`).get() as any;
  const byZone = sqlite.prepare(`SELECT zone, COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL GROUP BY zone`).all();
  const byFolder = sqlite.prepare(`SELECT folder, COUNT(*) as count FROM kappa_documents WHERE superseded_by IS NULL GROUP BY folder ORDER BY count DESC`).all();
  const supersedeCount = sqlite.prepare(`SELECT COUNT(*) as count FROM supersede_log`).get() as any;
  const messageCount = sqlite.prepare(`SELECT COUNT(*) as count FROM cell_messages WHERE archived = 0`).get() as any;
  const traceCount = sqlite.prepare(`SELECT COUNT(*) as count FROM trace_log`).get() as any;
  const oldest = sqlite.prepare(`SELECT MIN(created_at) as oldest FROM kappa_documents`).get() as any;
  const newest = sqlite.prepare(`SELECT MAX(created_at) as newest FROM kappa_documents`).get() as any;

  return {
    total: totalDocs.count,
    active: activeDocs.count,
    superseded: totalDocs.count - activeDocs.count,
    byZone,
    byFolder,
    supersedeOperations: supersedeCount.count,
    activeMessages: messageCount.count,
    traceEntries: traceCount.count,
    oldestEntry: oldest.oldest,
    newestEntry: newest.newest,
  };
}