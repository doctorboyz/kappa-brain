import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

// Main knowledge index
export const kappaDocuments = sqliteTable("kappa_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zone: text("zone").notNull(),           // 'memory', 'work', 'communication', 'archive'
  folder: text("folder").notNull(),       // 'learnings', 'reference', 'resonance', 'drafts', 'lab', etc.
  path: text("path").notNull().unique(),
  title: text("title"),
  content: text("content"),
  summary: text("summary"),
  concepts: text("concepts"),             // JSON array
  isImmutable: integer("is_immutable", { mode: "boolean" }).default(false),
  supersededBy: integer("superseded_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Supersede audit log (Principle 1)
export const supersedeLog = sqliteTable("supersede_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  oldId: integer("old_id").notNull().references(() => kappaDocuments.id),
  newId: integer("new_id").notNull().references(() => kappaDocuments.id),
  reason: text("reason"),
  supersededAt: integer("superseded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  humanApproved: integer("human_approved", { mode: "boolean" }).default(false),
});

// System activity log
export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  tool: text("tool"),
  action: text("action"),
  targetPath: text("target_path"),
  details: text("details"),
});

// Cross-Cell messaging
export const cellMessages = sqliteTable("cell_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  direction: text("direction").notNull(), // 'in' or 'out'
  fromCell: text("from_cell"),
  toCell: text("to_cell"),
  content: text("content"),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  archived: integer("archived", { mode: "boolean" }).default(false),
});

// Scheduled tasks
export const schedule = sqliteTable("schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task: text("task").notNull(),
  cron: text("cron"),
  nextRun: integer("next_run", { mode: "timestamp" }),
  lastRun: integer("last_run", { mode: "timestamp" }),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
});

// Trace log (tool call chains)
export const traceLog = sqliteTable("trace_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  parentTraceId: integer("parent_trace_id"),
  tool: text("tool").notNull(),
  action: text("action"),
  input: text("input"),
  output: text("output"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  durationMs: integer("duration_ms"),
});

// Discussion threads
export const forumThreads = sqliteTable("forum_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  topic: text("topic"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  closed: integer("closed", { mode: "boolean" }).default(false),
});

export const forumMessages = sqliteTable("forum_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull().references(() => forumThreads.id),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});