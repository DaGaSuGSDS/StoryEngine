/**
 * gitRoutes.js
 * API routes for git version history and branches per project.
 *
 * History:
 *   GET    /api/projects/:id/history              - List commit history
 *   GET    /api/projects/:id/history/pending      - Uncommitted changes
 *   POST   /api/projects/:id/history/commit       - Manual commit
 *   POST   /api/projects/:id/history/restore      - Restore to commit
 *
 * Branches:
 *   GET    /api/projects/:id/branches             - List branches
 *   GET    /api/projects/:id/branches/current     - Current branch name
 *   POST   /api/projects/:id/branches             - Create branch
 *   POST   /api/projects/:id/branches/switch      - Switch branch
 *   DELETE /api/projects/:id/branches/:name       - Delete branch
 *
 * Merge:
 *   POST   /api/projects/:id/branches/merge/analyze  - Analyze merge conflicts
 *   POST   /api/projects/:id/branches/merge/apply    - Apply resolved merge
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const config = require("../config");
const GitService = require("../services/GitService");
const MergeService = require("../services/MergeService");

function projectDir(id) {
  return path.join(config.paths.projects, id);
}

// GET /api/projects/:id/history
router.get("/:id/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = await GitService.getHistory(projectDir(req.params.id), limit);
    res.json(history);
  } catch (err) {
    console.error("[gitRoutes] history error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/history/pending
router.get("/:id/history/pending", async (req, res) => {
  try {
    const pending = await GitService.getPendingChanges(projectDir(req.params.id));
    res.json(pending);
  } catch (err) {
    console.error("[gitRoutes] pending error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/history/commit  { message: string }
router.post("/:id/history/commit", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Se requiere un mensaje para el commit." });
    }
    const result = await GitService.manualCommit(
      projectDir(req.params.id),
      message.trim()
    );
    res.json(result);
  } catch (err) {
    console.error("[gitRoutes] commit error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:id/history/restore  { hash: string }
router.post("/:id/history/restore", async (req, res) => {
  try {
    const { hash } = req.body || {};
    if (!hash || typeof hash !== "string") {
      return res.status(400).json({ error: "Se requiere el hash del commit." });
    }
    const result = await GitService.restoreToCommit(
      projectDir(req.params.id),
      hash
    );
    res.json(result);
  } catch (err) {
    console.error("[gitRoutes] restore error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ─── BRANCH ROUTES ────────────────────────────────────────────────────────────

// GET /api/projects/:id/branches/current
router.get("/:id/branches/current", async (req, res) => {
  try {
    const branch = await GitService.getCurrentBranch(projectDir(req.params.id));
    res.json({ branch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/branches
router.get("/:id/branches", async (req, res) => {
  try {
    const branches = await GitService.listBranches(projectDir(req.params.id));
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/branches  { name: string }
router.post("/:id/branches", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Se requiere un nombre para la rama." });
    }
    const result = await GitService.createBranch(projectDir(req.params.id), name.trim());
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:id/branches/switch  { name: string }
router.post("/:id/branches/switch", async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: "Nombre de rama requerido." });
    const result = await GitService.switchBranch(projectDir(req.params.id), name);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/projects/:id/branches/:name
router.delete("/:id/branches/:name", async (req, res) => {
  try {
    await GitService.deleteBranch(projectDir(req.params.id), req.params.name);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── MERGE ROUTES ─────────────────────────────────────────────────────────────

// POST /api/projects/:id/branches/merge/analyze  { sourceBranch: string }
router.post("/:id/branches/merge/analyze", async (req, res) => {
  try {
    const { sourceBranch } = req.body || {};
    if (!sourceBranch) {
      return res.status(400).json({ error: "Se requiere la rama origen." });
    }
    const analysis = await MergeService.analyzeMerge(
      projectDir(req.params.id),
      sourceBranch
    );
    res.json(analysis);
  } catch (err) {
    console.error("[gitRoutes] merge/analyze error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:id/branches/merge/apply
// Body: { sourceBranch, collections: { scenes, characters, ... }, settings }
// Each collection has { kept, autoAdded, conflicts (with resolvedConflicts) }
router.post("/:id/branches/merge/apply", async (req, res) => {
  try {
    const { sourceBranch, collections, settings } = req.body || {};
    if (!sourceBranch || !collections) {
      return res.status(400).json({ error: "Datos de merge incompletos." });
    }
    await MergeService.applyMerge(
      projectDir(req.params.id),
      sourceBranch,
      collections,
      settings
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[gitRoutes] merge/apply error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
