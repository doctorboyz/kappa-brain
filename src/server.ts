#!/usr/bin/env bun
// kappa-brain — MCP server for Kappa Cell memory
// 23 tools, FTS5 + sqlite-vec, supersede system, KappaNet

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Initialize database
import "./db/index.js";

import {
  kappaSearch, kappaRead, kappaList, kappaLearn, kappaSupersede,
  kappaReflect, kappaHandoff, kappaInbox, kappaVerify,
} from "./tools/critical.js";

import {
  kappaLog, kappaWork, kappaArchive, kappaPromote,
  kappaDemote, kappaDefrag,
  kappaScheduleAdd, kappaScheduleList,
  kappaTrace, kappaTraceList, kappaTraceGet,
} from "./tools/important.js";

import {
  kappaConcepts, kappaThread, kappaThreads,
  kappaThreadUpdate, kappaStats,
} from "./tools/nice-to-have.js";

const server = new McpServer({
  name: "kappa-brain",
  version: "1.0.0",
});

// ─── CRITICAL TOOLS ───

server.tool("kappa_search", "Search knowledge across vault (FTS5 full-text search)", {
  query: z.string().describe("Search query"),
  zone: z.string().optional().describe("Filter by zone: memory, work, communication, archive"),
  limit: z.number().optional().default(20).describe("Max results"),
}, async ({ query, zone, limit }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaSearch(query, zone, limit), null, 2) }],
}));

server.tool("kappa_read", "Read a document by path", {
  path: z.string().describe("Document path (e.g. memory/learnings/2026-04-23_slug.md)"),
}, async ({ path }) => {
  const doc = kappaRead(path);
  if (!doc) return { content: [{ type: "text", text: `Document not found: ${path}` }], isError: true };
  return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
});

server.tool("kappa_list", "List documents by zone/folder", {
  zone: z.string().optional().describe("Filter by zone: memory, work, communication, archive"),
  folder: z.string().optional().describe("Filter by folder: learnings, reference, resonance, drafts, lab, research, retrospectives, logs"),
  limit: z.number().optional().default(50).describe("Max results"),
}, async ({ zone, folder, limit }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaList(zone, folder, limit), null, 2) }],
}));

server.tool("kappa_learn", "Add knowledge to vault", {
  path: z.string().describe("Vault-relative path (e.g. memory/learnings/2026-04-23_slug.md)"),
  title: z.string().describe("Document title"),
  content: z.string().describe("Document content"),
  summary: z.string().optional().describe("Short summary"),
  concepts: z.array(z.string()).optional().describe("Concept tags"),
  zone: z.string().optional().describe("Zone (default: memory)"),
  folder: z.string().optional().describe("Folder (default: learnings)"),
  immutable: z.boolean().optional().default(false).describe("If true, can only be superseded (for reference/)"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaLearn(args), null, 2) }],
}));

server.tool("kappa_supersede", "Update a reference/ document without deleting (Principle 1)", {
  oldPath: z.string().describe("Path of document to supersede"),
  newTitle: z.string().describe("New document title"),
  newContent: z.string().describe("New document content"),
  newSummary: z.string().optional().describe("New summary"),
  reason: z.string().describe("Why this supersede is needed"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaSupersede(args), null, 2) }],
}));

server.tool("kappa_reflect", "Get random wisdom from vault for reflection", {
  zone: z.string().optional().describe("Zone to reflect from (default: memory)"),
}, async ({ zone }) => ({
  content: [{ type: "text", text: JSON.stringify(kappaReflect(zone), null, 2) }],
}));

server.tool("kappa_handoff", "Prepare session handoff — latest retro, learnings, schedule", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaHandoff(), null, 2) }],
}));

server.tool("kappa_verify", "Check brain health — document counts, orphan supersedes, integrity", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(kappaVerify(), null, 2) }],
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

server.tool("kappa_work", "Manage work/ zone — drafts, lab, research (ephemeral)", {
  action: z.enum(["draft", "lab", "research"]).describe("Work subfolder"),
  operation: z.enum(["create", "read", "list", "delete"]).describe("CRUD operation"),
  path: z.string().optional().describe("Document path"),
  title: z.string().optional().describe("Document title"),
  content: z.string().optional().describe("Document content"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaWork(args), null, 2) }],
}));

server.tool("kappa_archive", "Archive a completed document (move to archive/ zone)", {
  path: z.string().describe("Document path to archive"),
  reason: z.string().optional().describe("Why this is being archived"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaArchive(args), null, 2) }],
}));

server.tool("kappa_promote", "Promote a learning to reference/ (human approves, makes it immutable)", {
  path: z.string().describe("Learning document path to promote"),
  reason: z.string().describe("Why this learning should become a reference"),
}, async (args) => ({
  content: [{ type: "text", text: JSON.stringify(kappaPromote(args), null, 2) }],
}));

server.tool("kappa_demote", "Demote a reference/ document back to learnings/ for re-evaluation (Principle 7: Keep Tidy)", {
  path: z.string().describe("Reference document path to demote"),
  reason: z.string().describe("Why this reference should be demoted back to learnings"),
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

// ─── START ───

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kappa-brain MCP server running on stdio");
}

main().catch(console.error);