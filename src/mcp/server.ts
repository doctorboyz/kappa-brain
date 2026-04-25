#!/usr/bin/env bun
// @kappa/brain-cli — MCP server mode
// 29 tools, FTS5, supersede system, wisdom lifecycle, vault sync, Cerebro lineage

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Initialize database
import "../db/index.js";

import {
  kappaSearch, kappaRead, kappaList, kappaLearn, kappaSupersede,
  kappaReflect, kappaHandoff, kappaInbox, kappaVerify, kappaSync,
} from "../tools/critical.js";

import {
  kappaLog, kappaWork, kappaArchive, kappaPromote,
  kappaDemote, kappaDefrag,
  kappaScheduleAdd, kappaScheduleList,
  kappaTrace, kappaTraceList, kappaTraceGet,
} from "../tools/important.js";

import {
  kappaConcepts, kappaThread, kappaThreads,
  kappaThreadUpdate, kappaStats,
} from "../tools/nice-to-have.js";

import {
  cerebroScan, cerebroLineage, cerebroPing, cerebroRegister,
} from "../tools/cerebro.js";

const server = new McpServer({
  name: "kappa-brain",
  version: "2.0.1",
});

// ─── CRITICAL TOOLS ───

server.tool("kappa_search", "Search knowledge across vault (FTS5 full-text search)", {
  query: z.string().describe("Search query"),
  zone: z.string().optional().describe("Filter by zone: intrinsic, extrinsic"),
  limit: z.number().optional().default(20).describe("Max results"),
}, async ({ query, zone, limit }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaSearch(query, zone, limit), null, 2) }],
}));

server.tool("kappa_read", "Read a document by path", {
  path: z.string().describe("Document path (e.g. extrinsic/learn/2026-04-23_slug.md)"),
}, async ({ path }) => {
  const doc = kappaRead(path);
  if (!doc) return { content: [{ type: "text", text: `Document not found: ${path}` }], isError: true };
  return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
});

server.tool("kappa_list", "List documents by zone/folder", {
  zone: z.string().optional().describe("Filter by zone: intrinsic, extrinsic"),
  folder: z.string().optional().describe("Filter by folder: instinct, inherit, identity, communication, experience, wisdom, archive, or nested: inbox, outbox, work, learn, drafts, lab, logs, retrospective, knowledge, reference"),
  limit: z.number().optional().default(50).describe("Max results"),
}, async ({ zone, folder, limit }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaList(zone, folder, limit), null, 2) }],
}));

server.tool("kappa_learn", "Add knowledge to vault", {
  path: z.string().describe("Vault-relative path (e.g. extrinsic/learn/2026-04-23_slug.md)"),
  title: z.string().describe("Document title"),
  content: z.string().describe("Document content"),
  summary: z.string().optional().describe("Short summary"),
  concepts: z.array(z.string()).optional().describe("Concept tags"),
  zone: z.string().optional().describe("Zone (default: extrinsic)"),
  folder: z.string().optional().describe("Folder (default: learn)"),
  immutable: z.boolean().optional().default(false).describe("If true, can only be superseded (for instinct/reference)"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaLearn(args), null, 2) }],
}));

server.tool("kappa_supersede", "Update an immutable document (instinct or reference) without deleting (Principle 1)", {
  oldPath: z.string().describe("Path of document to supersede"),
  newTitle: z.string().describe("New document title"),
  newContent: z.string().describe("New document content"),
  newSummary: z.string().optional().describe("New summary"),
  reason: z.string().describe("Why this supersede is needed"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaSupersede(args), null, 2) }],
}));

server.tool("kappa_reflect", "Get random wisdom from vault for reflection", {
  zone: z.string().optional().describe("Zone to reflect from (default: extrinsic)"),
}, async ({ zone }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaReflect(zone), null, 2) }],
}));

server.tool("kappa_handoff", "Prepare session handoff — latest retro, knowledge, schedule", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaHandoff(), null, 2) }],
}));

server.tool("kappa_verify", "Check brain health — document counts, orphan supersedes, integrity", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaVerify(), null, 2) }],
}));

server.tool("kappa_sync", "Sync vault files ↔ DB (bidirectional)", {
  action: z.enum(["import", "export", "sync"]).describe("import: vault→DB, export: DB→vault, sync: bidirectional"),
  zone: z.string().optional().describe("Filter by zone: intrinsic, extrinsic"),
  folder: z.string().optional().describe("Filter by folder"),
  dryRun: z.boolean().optional().default(false).describe("Preview changes without writing"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaSync(args), null, 2) }],
}));

// ─── IMPORTANT TOOLS ───

server.tool("kappa_inbox", "Manage cross-Cell messages (inbox/outbox)", {
  action: z.enum(["receive", "send", "list"]).describe("Action: receive incoming, send outgoing, or list messages"),
  fromCell: z.string().optional().describe("Source cell name (for receive)"),
  toCell: z.string().optional().describe("Target cell name (for send)"),
  content: z.string().optional().describe("Message content"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaInbox(args), null, 2) }],
}));

server.tool("kappa_log", "System activity log — append auto-logs, read, or search", {
  action: z.enum(["append", "read", "search"]).describe("Append entry, read by date, or search"),
  date: z.string().optional().describe("Date to read (YYYY-MM-DD)"),
  query: z.string().optional().describe("Search query for logs"),
  entry: z.string().optional().describe("Log entry to append"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaLog(args), null, 2) }],
}));

server.tool("kappa_work", "Manage extrinsic/experience/work/ zone — drafts, lab, logs (ephemeral, handoff notes go in logs)", {
  action: z.enum(["draft", "lab", "log"]).describe("Work subfolder: drafts, lab, or logs"),
  operation: z.enum(["create", "read", "list", "delete"]).describe("CRUD operation"),
  path: z.string().optional().describe("Document path"),
  title: z.string().optional().describe("Document title"),
  content: z.string().optional().describe("Document content"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaWork(args), null, 2) }],
}));

server.tool("kappa_archive", "Archive a completed document to extrinsic/archive/", {
  path: z.string().describe("Document path to archive"),
  reason: z.string().optional().describe("Why this is being archived"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaArchive(args), null, 2) }],
}));

server.tool("kappa_promote", "Promote knowledge to wisdom/reference/ (human approves, makes it immutable)", {
  path: z.string().describe("Knowledge document path to promote"),
  reason: z.string().describe("Why this knowledge should become a reference"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaPromote(args), null, 2) }],
}));

server.tool("kappa_demote", "Demote wisdom/reference/ back to wisdom/knowledge/ for re-evaluation (Principle 7: Keep Tidy)", {
  path: z.string().describe("Reference document path to demote"),
  reason: z.string().describe("Why this reference should be demoted back to knowledge"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaDemote(args), null, 2) }],
}));

server.tool("kappa_defrag", "Defragment vault — find duplicates, repair orphans, identify stale work/ items (Principle 7: Keep Tidy)", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaDefrag(), null, 2) }],
}));

server.tool("kappa_schedule_add", "Add a scheduled task", {
  task: z.string().describe("Task description"),
  cron: z.string().optional().describe("Cron expression"),
  nextRun: z.number().optional().describe("Next run as unix timestamp"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaScheduleAdd(args), null, 2) }],
}));

server.tool("kappa_schedule_list", "List scheduled tasks", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaScheduleList(), null, 2) }],
}));

server.tool("kappa_trace", "Record a tool call trace", {
  sessionId: z.string().describe("Session ID"),
  tool: z.string().describe("Tool name"),
  action: z.string().optional().describe("Action performed"),
  input: z.string().optional().describe("Tool input (JSON)"),
  output: z.string().optional().describe("Tool output (JSON)"),
  durationMs: z.number().optional().describe("Duration in ms"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaTrace(args), null, 2) }],
}));

server.tool("kappa_trace_list", "List traces for a session", {
  sessionId: z.string().describe("Session ID"),
  limit: z.number().optional().default(50).describe("Max results"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaTraceList(args), null, 2) }],
}));

server.tool("kappa_trace_get", "Get a specific trace entry", {
  id: z.number().describe("Trace ID"),
}, async ({ id }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaTraceGet({ id }), null, 2) }],
}));

// ─── NICE-TO-HAVE TOOLS ───

server.tool("kappa_concepts", "List concept tags and their frequency across vault", {
  query: z.string().optional().describe("Filter concepts by substring"),
}, async ({ query }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaConcepts({ query }), null, 2) }],
}));

server.tool("kappa_thread", "Create or read a discussion thread", {
  action: z.enum(["create", "list", "read"]).describe("Create thread, list threads, or read thread messages"),
  title: z.string().optional().describe("Thread title (for create) or thread ID (for read)"),
  topic: z.string().optional().describe("Thread topic"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaThread(args), null, 2) }],
}));

server.tool("kappa_threads", "List all active discussion threads", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaThreads(), null, 2) }],
}));

server.tool("kappa_thread_update", "Add a message to a discussion thread", {
  threadId: z.number().describe("Thread ID"),
  author: z.string().describe("Message author"),
  content: z.string().describe("Message content"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaThreadUpdate(args), null, 2) }],
}));

server.tool("kappa_stats", "Vault statistics — document counts by zone/folder, supersede count, messages", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaStats(), null, 2) }],
}));

// ─── CEREBRO TOOLS ───

server.tool("cerebro_scan", "Scan KappaNet for Cells — list registered cells and find children (KappaNet discovery)", {
  repo: z.string().optional().describe("GitHub repo to scan for birth announcements (owner/repo)"),
  limit: z.number().optional().default(50).describe("Max results"),
}, async ({ repo, limit }) => ({
  content: [{ type: "text", text: JSON.stringify(cerebroScan(repo, limit), null, 2) }],
}));

server.tool("cerebro_lineage", "Query Cell lineage — ancestors, descendants, or full family tree (KappaNet Cerebro)", {
  direction: z.enum(["ancestors", "descendants", "tree"]).optional().default("tree").describe("Direction: ancestors (up), descendants (down), or tree (both)"),
}, async ({ direction }) => ({
  content: [{ type: "text", text: JSON.stringify(cerebroLineage(direction), null, 2) }],
}));

server.tool("cerebro_ping", "Check Cell presence — update own last_seen or check if a Cell is registered (KappaNet heartbeat)", {
  targetKappanetId: z.string().optional().describe("Target kappanet_id to check (omit for self-check)"),
}, async ({ targetKappanetId }) => ({
  content: [{ type: "text", text: JSON.stringify(cerebroPing(targetKappanetId), null, 2) }],
}));

server.tool("cerebro_register", "Register this Cell in the KappaNet registry (Cerebro birth enrollment)", {
  cellName: z.string().describe("Cell name (e.g. Adams-kappa)"),
  repo: z.string().describe("GitHub repo (e.g. doctorboyz/Adams-kappa)"),
  parentKappanetId: z.string().optional().describe("Parent kappanet_id (omit for root Cell)"),
  ancestry: z.string().optional().describe("JSON array of ancestor repos (e.g. [\"doctorboyz/Adams-kappa\"])"),
  dnaVersion: z.string().describe("kappa-genome version (e.g. 1.0.0)"),
  born: z.string().describe("Birth date (YYYY-MM-DD)"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(cerebroRegister(args), null, 2) }],
}));

// ─── START ───

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@kappa/brain-cli MCP server running on stdio");
}