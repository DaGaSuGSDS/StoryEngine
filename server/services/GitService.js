/**
 * GitService.js
 * Manages a git repository per project for version history.
 * Tracks all project files (JSONs + assets). Ignores nothing.
 */

const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs").promises;

const GIT_AUTHOR_NAME = "StoryEngine";
const GIT_AUTHOR_EMAIL = "storyengine@local";

/**
 * Returns a configured simple-git instance for the given project directory.
 * @param {string} projectDir - Absolute path to the project folder.
 */
function getGit(projectDir) {
  return simpleGit(projectDir, {
    config: [
      `user.name=${GIT_AUTHOR_NAME}`,
      `user.email=${GIT_AUTHOR_EMAIL}`,
    ],
  });
}

/**
 * Ensures the project directory has a git repo initialized.
 * Safe to call multiple times (idempotent).
 * @param {string} projectDir
 */
// Per-directory lock to prevent concurrent git init race conditions
const _initLocks = new Map();

/**
 * Returns a simple-git instance WITHOUT user config (safe to use during init).
 */
function getGitRaw(projectDir) {
  return simpleGit(projectDir);
}

/**
 * Ensures the project directory has a git repo initialized.
 * Uses a per-directory lock to prevent concurrent init race conditions.
 * @param {string} projectDir
 */
async function ensureRepo(projectDir) {
  // If another call is already initializing this dir, wait for it
  if (_initLocks.has(projectDir)) {
    await _initLocks.get(projectDir);
    return;
  }

  const initPromise = _doEnsureRepo(projectDir);
  _initLocks.set(projectDir, initPromise);
  try {
    await initPromise;
  } finally {
    _initLocks.delete(projectDir);
  }
}

async function _doEnsureRepo(projectDir) {
  const gitDir = path.join(projectDir, ".git");

  // Check if .git exists AND is a valid repo (has HEAD file)
  let isValidRepo = false;
  try {
    await fs.access(path.join(gitDir, "HEAD"));
    isValidRepo = true;
  } catch {
    // .git doesn't exist or is broken — delete and reinitialize
    try { await fs.rm(gitDir, { recursive: true, force: true }); } catch { /* ignore */ }
    isValidRepo = false;
  }

  if (!isValidRepo) {
    // Use raw git instance (no config writes) to avoid lock conflicts during init
    const git = getGitRaw(projectDir);
    // --template="" skips system template files (fixes Windows file-exists errors)
    await git.raw(["init", "--template="]);
    // Set branch and user config AFTER init completes
    try { await git.raw(["checkout", "-b", "main"]); } catch { /* already on a branch */ }
    await git.raw(["config", "user.name", GIT_AUTHOR_NAME]);
    await git.raw(["config", "user.email", GIT_AUTHOR_EMAIL]);
    console.log(`[GitService] Initialized repo at ${projectDir}`);
  }
}

/**
 * Stages all changes and creates an automatic commit after a save.
 * Skips commit if there are no changes.
 * @param {string} projectDir
 * @param {string} projectName - Used for the commit message.
 */
async function autoCommit(projectDir, projectName) {
  try {
    await ensureRepo(projectDir);
    const git = getGit(projectDir);

    await git.add(".");
    const status = await git.status();

    if (status.files.length === 0) {
      return; // Nothing to commit
    }

    const now = new Date().toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await git.commit(`Auto-guardado: ${now}`);
    console.log(`[GitService] Auto-commit for "${projectName}"`);
  } catch (err) {
    // Git errors must never break the save flow
    console.error(`[GitService] Auto-commit failed for ${projectDir}:`, err.message);
  }
}

/**
 * Creates a manual commit with a user-provided message.
 * Stages all pending changes first.
 * @param {string} projectDir
 * @param {string} message - Commit message from the user.
 * @returns {Promise<{hash: string, message: string}>}
 */
async function manualCommit(projectDir, message) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  await git.add(".");
  const status = await git.status();

  if (status.files.length === 0) {
    throw new Error("No hay cambios pendientes para guardar en el historial.");
  }

  const result = await git.commit(message);
  const hash = result.commit;
  console.log(`[GitService] Manual commit: "${message}" (${hash})`);
  return { hash, message };
}

/**
 * Returns the commit history for a project.
 * @param {string} projectDir
 * @param {number} limit - Max number of commits to return.
 * @returns {Promise<Array<{hash: string, message: string, date: string, isAuto: boolean}>>}
 */
async function getHistory(projectDir, limit = 50) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  try {
    const log = await git.log({ maxCount: limit });
    return log.all.map((entry) => ({
      hash: entry.hash,
      shortHash: entry.hash.slice(0, 7),
      message: entry.message,
      date: entry.date,
      isAuto: entry.message.startsWith("Auto-guardado:"),
    }));
  } catch (err) {
    // Repo exists but has no commits yet
    if (err.message.includes("does not have any commits")) {
      return [];
    }
    throw err;
  }
}

/**
 * Restores the project to a specific commit using git checkout.
 * Creates a "restore" commit so the history is not rewritten.
 * @param {string} projectDir
 * @param {string} commitHash
 * @returns {Promise<{restoredTo: string, newCommitHash: string}>}
 */
async function restoreToCommit(projectDir, commitHash) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  // Verify the commit exists
  try {
    await git.show([commitHash, "--name-only", "--format=%H"]);
  } catch {
    throw new Error(`Commit no encontrado: ${commitHash}`);
  }

  // Check out all files from that commit without moving HEAD
  await git.checkout([commitHash, "--", "."]);

  // Stage and commit the restore
  await git.add(".");
  const status = await git.status();

  if (status.files.length === 0) {
    // Already at this state
    return { restoredTo: commitHash, newCommitHash: null, alreadyCurrent: true };
  }

  const result = await git.commit(
    `Restaurado al commit ${commitHash.slice(0, 7)}`
  );

  console.log(`[GitService] Restored ${projectDir} to ${commitHash}`);
  return { restoredTo: commitHash, newCommitHash: result.commit };
}

/**
 * Returns the pending (uncommitted) changes for a project.
 * @param {string} projectDir
 * @returns {Promise<{files: string[], hasChanges: boolean}>}
 */
async function getPendingChanges(projectDir) {
  try {
    await ensureRepo(projectDir);
    const git = getGit(projectDir);
    const status = await git.status();
    return {
      files: status.files.map((f) => f.path),
      hasChanges: status.files.length > 0,
    };
  } catch {
    return { files: [], hasChanges: false };
  }
}

// ─── BRANCH OPERATIONS ────────────────────────────────────────────────────────

/**
 * Returns the name of the current branch.
 * @param {string} projectDir
 * @returns {Promise<string>}
 */
async function getCurrentBranch(projectDir) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);
  try {
    const result = await git.revparse(["--abbrev-ref", "HEAD"]);
    return result.trim();
  } catch {
    return "main";
  }
}

/**
 * Lists all local branches with their last commit info.
 * @param {string} projectDir
 * @returns {Promise<Array<{name: string, isCurrent: boolean, lastCommit: string, lastDate: string}>>}
 */
async function listBranches(projectDir) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);
  try {
    const summary = await git.branchLocal();
    const branches = await Promise.all(
      summary.all.map(async (name) => {
        let lastCommit = "";
        let lastDate = "";
        try {
          const log = await git.log({ maxCount: 1, from: name, to: name });
          if (log.latest) {
            lastCommit = log.latest.message;
            lastDate = log.latest.date;
          }
        } catch {
          // Branch may have no commits yet
        }
        return {
          name,
          isCurrent: name === summary.current,
          lastCommit,
          lastDate,
        };
      })
    );
    return branches;
  } catch {
    return [];
  }
}

/**
 * Creates a new branch from the current HEAD.
 * @param {string} projectDir
 * @param {string} branchName
 * @returns {Promise<{name: string}>}
 */
async function createBranch(projectDir, branchName) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  const safe = branchName.trim().replace(/[^a-zA-Z0-9_\-]/g, "-");
  if (!safe) throw new Error("Nombre de rama inválido.");

  const summary = await git.branchLocal();
  if (summary.all.includes(safe)) {
    throw new Error(`La rama "${safe}" ya existe.`);
  }

  // Ensure at least one commit exists (needed to branch off)
  try {
    const log = await git.log({ maxCount: 1 }).catch(() => null);
    if (!log || log.total === 0) {
      await git.add(".");
      // Initialize on 'main' explicitly
      await git.raw(["checkout", "-b", "main"]);
      await git.commit("Commit inicial", { "--allow-empty": null });
    }
  } catch {
    // ignore if already on a branch
  }

  await git.checkoutLocalBranch(safe);
  console.log(`[GitService] Created branch "${safe}" in ${projectDir}`);
  return { name: safe };
}

/**
 * Switches to an existing branch. Commits pending changes first.
 * @param {string} projectDir
 * @param {string} branchName
 * @returns {Promise<{branch: string}>}
 */
async function switchBranch(projectDir, branchName) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  // Auto-commit pending changes before switching
  const status = await git.status();
  if (status.files.length > 0) {
    await git.add(".");
    await git.commit("Auto-guardado antes de cambiar de rama");
  }

  await git.checkout(branchName);
  console.log(`[GitService] Switched to branch "${branchName}"`);
  return { branch: branchName };
}

/**
 * Deletes a local branch (must not be current).
 * @param {string} projectDir
 * @param {string} branchName
 */
async function deleteBranch(projectDir, branchName) {
  await ensureRepo(projectDir);
  const git = getGit(projectDir);

  const current = await getCurrentBranch(projectDir);
  if (current === branchName) {
    throw new Error("No puedes borrar la rama activa.");
  }

  await git.deleteLocalBranch(branchName, true); // force=true
  console.log(`[GitService] Deleted branch "${branchName}"`);
}

/**
 * Reads a JSON file from a specific branch without switching.
 * @param {Object} git - simple-git instance
 * @param {string} branch
 * @param {string} filename - relative path within the repo
 * @returns {Promise<any|null>}
 */
async function getFileFromBranch(git, branch, filename) {
  try {
    const content = await git.show([`${branch}:${filename}`]);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

module.exports = {
  ensureRepo,
  autoCommit,
  manualCommit,
  getHistory,
  restoreToCommit,
  getPendingChanges,
  // Branches
  getCurrentBranch,
  listBranches,
  createBranch,
  switchBranch,
  deleteBranch,
  getFileFromBranch,
};
