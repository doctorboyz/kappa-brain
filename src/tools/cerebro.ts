import { sqlite } from "../db/index.js";

// ─── CEREBRO TOOLS (4) ───
// Cell discovery, lineage tracking, and family tree queries
// See kappanet/protocol.md in kappa-genome for the protocol spec

export function cerebroScan(repo?: string, limit = 50) {
  // Scan for birth announcements via GitHub Issues
  // If repo is provided, scan that repo's kappanet:birth issues
  // If no repo, scan this Cell's own repo (from manifest)
  const kappanetId = getOwnKappaNetId();

  // Get all registered cells
  const cells = sqlite.prepare(`
    SELECT kappanet_id, cell_name, repo, parent_kappanet_id, ancestry, dna_version, born, status, last_seen
    FROM cell_registry
    ORDER BY born ASC
    LIMIT ?
  `).all(limit);

  // Get direct children of this Cell
  const children = sqlite.prepare(`
    SELECT kappanet_id, cell_name, repo, dna_version, born, status
    FROM cell_registry
    WHERE parent_kappanet_id = ?
  `).all(kappanetId);

  logActivity("cerebro_scan", "scan", kappanetId, `Found ${cells.length} cells, ${children.length} children`);

  return {
    self: kappanetId,
    totalCells: cells.length,
    childrenCount: children.length,
    children,
    allCells: cells,
    repoSuggestion: repo || null,
    hint: repo
      ? `Run: gh issue list --repo ${repo} --label kappanet:birth to find birth announcements`
      : "Provide a repo to scan for birth announcements",
  };
}

export function cerebroLineage(direction: "ancestors" | "descendants" | "tree" = "tree") {
  const kappanetId = getOwnKappaNetId();

  const self = sqlite.prepare(`SELECT * FROM cell_registry WHERE kappanet_id = ?`).get(kappanetId) as any;
  if (!self) {
    return { error: "Cell not found in registry. Run cerebro_register first.", kappanetId };
  }

  if (direction === "ancestors") {
    // Walk up the ancestry chain
    const ancestry = parseAncestry(self.ancestry);
    const ancestors = ancestry.map((repo: string) => {
      const cell = sqlite.prepare(`SELECT * FROM cell_registry WHERE repo = ?`).get(repo) as any;
      return cell || { repo, status: "unknown" };
    });
    logActivity("cerebro_lineage", "ancestors", kappanetId, `${ancestry.length} ancestors`);
    return { direction: "ancestors", kappanetId, lineage: ancestors };
  }

  if (direction === "descendants") {
    // Find all descendants using closure table
    const descendants = sqlite.prepare(`
      SELECT cr.kappanet_id, cr.cell_name, cr.repo, cr.dna_version, cr.born, cr.status, cl.depth
      FROM cell_lineage cl
      JOIN cell_registry cr ON cr.kappanet_id = cl.descendant_id
      WHERE cl.ancestor_id = ?
      ORDER BY cl.depth ASC
    `).all(kappanetId);
    logActivity("cerebro_lineage", "descendants", kappanetId, `${descendants.length} descendants`);
    return { direction: "descendants", kappanetId, lineage: descendants };
  }

  // tree: return both ancestors and descendants
  const ancestry = parseAncestry(self.ancestry);
  const ancestors = ancestry.map((repo: string) => {
    const cell = sqlite.prepare(`SELECT * FROM cell_registry WHERE repo = ?`).get(repo) as any;
    return cell || { repo, status: "unknown" };
  });

  const descendants = sqlite.prepare(`
    SELECT cr.kappanet_id, cr.cell_name, cr.repo, cr.dna_version, cr.born, cr.status, cl.depth
    FROM cell_lineage cl
    JOIN cell_registry cr ON cr.kappanet_id = cl.descendant_id
    WHERE cl.ancestor_id = ?
    ORDER BY cl.depth ASC
  `).all(kappanetId);

  logActivity("cerebro_lineage", "tree", kappanetId, `${ancestors.length} ancestors, ${descendants.length} descendants`);

  return {
    direction: "tree",
    kappanetId,
    self: { name: self.cell_name, repo: self.repo, born: self.born, status: self.status },
    ancestors,
    descendants,
  };
}

export function cerebroPing(targetKappanetId?: string) {
  const ownId = getOwnKappaNetId();

  // Update own last_seen timestamp
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  sqlite.prepare(`UPDATE cell_registry SET last_seen = ?, updated_at = ? WHERE kappanet_id = ?`)
    .run(now, Math.floor(Date.now() / 1000), ownId);

  if (targetKappanetId) {
    // Check if a specific cell is known
    const target = sqlite.prepare(`SELECT * FROM cell_registry WHERE kappanet_id = ?`).get(targetKappanetId) as any;
    logActivity("cerebro_ping", "ping", ownId, target ? `found ${targetKappanetId}` : `unknown ${targetKappanetId}`);
    return {
      self: ownId,
      target: target ? { kappanetId: target.kappanet_id, name: target.cell_name, repo: target.repo, status: target.status, lastSeen: target.last_seen } : null,
      found: !!target,
    };
  }

  // No target specified — return own status
  const self = sqlite.prepare(`SELECT * FROM cell_registry WHERE kappanet_id = ?`).get(ownId) as any;
  logActivity("cerebro_ping", "ping", ownId, "self-check");
  return {
    self: ownId,
    status: self ? self.status : "unregistered",
    lastSeen: self ? self.last_seen : null,
    message: self ? "Cell is registered and active" : "Cell not found in registry. Run cerebro_register first.",
  };
}

export function cerebroRegister(args: {
  cellName: string;
  repo: string;
  parentKappanetId?: string;
  ancestry?: string;
  dnaVersion: string;
  born: string;
}) {
  const kappanetId = `kappa:${args.repo.split("/")[0].toLowerCase()}:${args.cellName.toLowerCase()}`;

  // Check if already registered
  const existing = sqlite.prepare(`SELECT * FROM cell_registry WHERE kappanet_id = ?`).get(kappanetId) as any;

  if (existing) {
    // Update last_seen
    const now = new Date().toISOString().split("T")[0];
    sqlite.prepare(`UPDATE cell_registry SET last_seen = ?, updated_at = ? WHERE kappanet_id = ?`)
      .run(now, Math.floor(Date.now() / 1000), kappanetId);
    logActivity("cerebro_register", "update", kappanetId, "Cell already registered, updated last_seen");
    return { kappanetId, action: "updated", message: "Cell already registered. Updated last_seen." };
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const ancestryJson = args.ancestry || "[]";

  // Insert into cell_registry
  sqlite.prepare(`
    INSERT INTO cell_registry (kappanet_id, cell_name, repo, parent_kappanet_id, ancestry, dna_version, born, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(
    kappanetId,
    args.cellName,
    args.repo,
    args.parentKappanetId || null,
    ancestryJson,
    args.dnaVersion,
    args.born,
    nowTs,
    nowTs,
  );

  // Insert self-reference in lineage (depth 0)
  sqlite.prepare(`
    INSERT OR IGNORE INTO cell_lineage (ancestor_id, descendant_id, depth)
    VALUES (?, ?, 0)
  `).run(kappanetId, kappanetId);

  // If has parent, add lineage entries
  if (args.parentKappanetId) {
    // depth 1: parent → child
    sqlite.prepare(`
      INSERT OR IGNORE INTO cell_lineage (ancestor_id, descendant_id, depth)
      VALUES (?, ?, 1)
    `).run(args.parentKappanetId, kappanetId);

    // Copy all ancestors of parent and add as ancestors of child with increased depth
    const parentAncestors = sqlite.prepare(`
      SELECT ancestor_id, depth FROM cell_lineage WHERE descendant_id = ?
    `).all(args.parentKappanetId) as any[];

    for (const row of parentAncestors) {
      if (row.ancestor_id !== kappanetId) {
        sqlite.prepare(`
          INSERT OR IGNORE INTO cell_lineage (ancestor_id, descendant_id, depth)
          VALUES (?, ?, ?)
        `).run(row.ancestor_id, kappanetId, row.depth + 1);
      }
    }
  }

  logActivity("cerebro_register", "register", kappanetId, `Registered ${args.cellName} from ${args.repo}`);
  return { kappanetId, action: "registered", cellName: args.cellName, repo: args.repo };
}

// ─── Helpers ───

function getOwnKappaNetId(): string {
  // Read from manifest to get kappanet_id
  // Fallback: construct from repo path
  try {
    const fs = require("fs");
    const path = require("path");
    const vaultRoot = process.env.KAPPA_VAULT || process.cwd();
    const manifestPath = path.join(vaultRoot, "κ", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifest.kappanet_id) return manifest.kappanet_id;
    }
  } catch {
    // Manifest not available, construct from cwd
  }

  // Fallback: derive from current working directory
  const cwd = process.cwd();
  const parts = cwd.split("/");
  const repoName = parts[parts.length - 1] || "unknown";
  const owner = parts[parts.length - 2] || "unknown";
  return `kappa:${owner.toLowerCase()}:${repoName.toLowerCase()}`;
}

function parseAncestry(ancestryJson: string): string[] {
  try {
    return JSON.parse(ancestryJson || "[]");
  } catch {
    return [];
  }
}

function logActivity(tool: string, action: string, targetPath: string, details: string) {
  const now = Math.floor(Date.now() / 1000);
  sqlite.prepare(`
    INSERT INTO activity_log (timestamp, tool, action, target_path, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(now, tool, action, targetPath, details);
}