/**
 * MergeService.js
 * JSON-aware merge logic for StoryEngine projects.
 *
 * Scenes    → one file per scene (scenes/<uuid>.json). Merged file-by-file.
 * Others    → single JSON arrays, diffed by ID.
 * Settings  → field-level diff.
 */

const path = require("path");
const fs = require("fs").promises;
const simpleGit = require("simple-git");
const GitService = require("./GitService");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getGit(projectDir) {
  return simpleGit(projectDir, {
    config: ["user.name=StoryEngine", "user.email=storyengine@local"],
  });
}

async function readLocalJson(filePath, defaultValue = {}) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return defaultValue;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Reads a file from a specific git branch without switching branches.
 */
async function getFileFromBranch(git, branch, filePath) {
  try {
    const content = await git.show([`${branch}:${filePath}`]);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Lists all scene filenames tracked in a branch (scenes/*.json).
 */
async function getSceneFilesFromBranch(git, branch) {
  try {
    const result = await git.raw(["ls-tree", "--name-only", branch, "scenes/"]);
    return result
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.basename(f, ".json")); // returns array of scene IDs
  } catch {
    return [];
  }
}

// ─── DIFF HELPERS ─────────────────────────────────────────────────────────────

/**
 * Diffs two arrays by ID.
 * Returns { autoAdded, kept, conflicts }
 */
function diffById(current = [], incoming = []) {
  const currentMap = new Map(current.map((i) => [i.id, i]));
  const incomingMap = new Map(incoming.map((i) => [i.id, i]));

  const autoAdded = [];
  const conflicts = [];
  const kept = [];

  for (const [id, item] of currentMap) {
    if (!incomingMap.has(id)) {
      kept.push(item);
    } else {
      const inc = incomingMap.get(id);
      if (JSON.stringify(item) === JSON.stringify(inc)) {
        kept.push(item);
      } else {
        conflicts.push({ id, current: item, incoming: inc });
      }
    }
  }

  for (const [id, item] of incomingMap) {
    if (!currentMap.has(id)) autoAdded.push(item);
  }

  return { autoAdded, kept, conflicts };
}

/**
 * Diffs two settings objects field by field.
 */
function diffSettings(current = {}, incoming = {}) {
  const merged = { ...current };
  const conflicts = [];

  for (const key of new Set([...Object.keys(current), ...Object.keys(incoming)])) {
    const inCurrent = key in current;
    const inIncoming = key in incoming;
    if (!inCurrent) {
      merged[key] = incoming[key];
    } else if (inIncoming && JSON.stringify(current[key]) !== JSON.stringify(incoming[key])) {
      conflicts.push({ key, current: current[key], incoming: incoming[key] });
    }
  }

  return { merged, conflicts };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Analyzes what a merge from sourceBranch into the current branch would produce.
 *
 * Scene merge is file-based:
 *   - Scene only in source  → autoAdded
 *   - Scene only in target  → kept
 *   - Scene in both, same   → kept
 *   - Scene in both, diff   → conflict (whole scene object)
 *
 * @param {string} projectDir
 * @param {string} sourceBranch
 * @returns {Promise<MergeAnalysis>}
 */
async function analyzeMerge(projectDir, sourceBranch) {
  const git = getGit(projectDir);
  const currentBranch = await GitService.getCurrentBranch(projectDir);
  if (sourceBranch === currentBranch) throw new Error("La rama origen y destino son la misma.");

  // ── Scenes: file-by-file diff ──────────────────────────────────────────────
  const scenesDir = path.join(projectDir, "scenes");

  // Scene IDs on current branch (from disk)
  let currentSceneIds = [];
  try {
    currentSceneIds = (await fs.readdir(scenesDir))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch { /* no scenes folder */ }

  // Scene IDs on source branch (from git)
  const sourceSceneIds = await getSceneFilesFromBranch(git, sourceBranch);

  const currentSceneSet = new Set(currentSceneIds);
  const sourceSceneSet = new Set(sourceSceneIds);
  const allSceneIds = new Set([...currentSceneIds, ...sourceSceneIds]);

  const scenesAutoAdded = [];
  const scenesKept = [];
  const scenesConflicts = [];

  for (const sceneId of allSceneIds) {
    const inCurrent = currentSceneSet.has(sceneId);
    const inSource = sourceSceneSet.has(sceneId);

    if (inCurrent && !inSource) {
      // Only in target → keep
      const scene = await readLocalJson(path.join(scenesDir, `${sceneId}.json`), null);
      if (scene) scenesKept.push(scene);
    } else if (!inCurrent && inSource) {
      // Only in source → auto-add
      const scene = await getFileFromBranch(git, sourceBranch, `scenes/${sceneId}.json`);
      if (scene) scenesAutoAdded.push(scene);
    } else {
      // In both — compare
      const currentScene = await readLocalJson(path.join(scenesDir, `${sceneId}.json`), null);
      const sourceScene = await getFileFromBranch(git, sourceBranch, `scenes/${sceneId}.json`);
      if (!currentScene || !sourceScene) continue;

      if (JSON.stringify(currentScene) === JSON.stringify(sourceScene)) {
        scenesKept.push(currentScene);
      } else {
        scenesConflicts.push({
          id: sceneId,
          current: currentScene,
          incoming: sourceScene,
        });
      }
    }
  }

  const scenesDiff = {
    autoAdded: scenesAutoAdded,
    kept: scenesKept,
    conflicts: scenesConflicts,
  };

  // ── Other collections: array diff by ID ───────────────────────────────────
  const [currentChars, currentFlags, currentImages, currentAudio, currentProject] =
    await Promise.all([
      readLocalJson(path.join(projectDir, "characters.json"), { characters: [] }),
      readLocalJson(path.join(projectDir, "flags.json"), { flags: [] }),
      readLocalJson(path.join(projectDir, "images.json"), { images: [], folders: [] }),
      readLocalJson(path.join(projectDir, "audio.json"), { audio: [] }),
      readLocalJson(path.join(projectDir, "project.json"), {}),
    ]);

  const [srcChars, srcFlags, srcImages, srcAudio, srcProject] = await Promise.all([
    getFileFromBranch(git, sourceBranch, "characters.json"),
    getFileFromBranch(git, sourceBranch, "flags.json"),
    getFileFromBranch(git, sourceBranch, "images.json"),
    getFileFromBranch(git, sourceBranch, "audio.json"),
    getFileFromBranch(git, sourceBranch, "project.json"),
  ]);

  const charsDiff    = diffById(currentChars.characters, srcChars?.characters || []);
  const flagsDiff    = diffById(currentFlags.flags, srcFlags?.flags || []);
  const imagesDiff   = diffById(currentImages.images, srcImages?.images || []);
  const audioDiff    = diffById(currentAudio.audio, srcAudio?.audio || []);
  const settingsDiff = diffSettings(currentProject.settings || {}, srcProject?.settings || {});

  const totalConflicts =
    scenesDiff.conflicts.length +
    charsDiff.conflicts.length +
    flagsDiff.conflicts.length +
    imagesDiff.conflicts.length +
    audioDiff.conflicts.length +
    settingsDiff.conflicts.length;

  const totalAutoAdded =
    scenesDiff.autoAdded.length +
    charsDiff.autoAdded.length +
    flagsDiff.autoAdded.length +
    imagesDiff.autoAdded.length +
    audioDiff.autoAdded.length;

  return {
    sourceBranch,
    targetBranch: currentBranch,
    totalConflicts,
    totalAutoAdded,
    collections: { scenes: scenesDiff, characters: charsDiff, flags: flagsDiff, images: imagesDiff, audio: audioDiff },
    settings: settingsDiff,
  };
}

/**
 * Applies a resolved merge to disk and commits it.
 *
 * @param {string} projectDir
 * @param {string} sourceBranch
 * @param {Object} resolvedCollections  - collections with resolvedConflicts arrays
 * @param {Object|null} resolvedSettings
 */
async function applyMerge(projectDir, sourceBranch, resolvedCollections, resolvedSettings) {
  function resolveArray(diff) {
    const resMap = new Map((diff.resolvedConflicts || []).map((r) => [r.id, r.choice]));
    const resolved = diff.conflicts.map((c) =>
      resMap.get(c.id) === "incoming" ? c.incoming : c.current
    );
    return [...diff.kept, ...diff.autoAdded, ...resolved];
  }

  // ── Scenes: write individual files ────────────────────────────────────────
  const scenesDir = path.join(projectDir, "scenes");
  await fs.mkdir(scenesDir, { recursive: true });

  const finalScenes = resolveArray(resolvedCollections.scenes);

  // Delete files for removed scenes (kept + autoAdded + resolved = final set)
  const finalSceneIds = new Set(finalScenes.map((s) => s.id));
  try {
    const existing = await fs.readdir(scenesDir);
    await Promise.all(
      existing
        .filter((f) => f.endsWith(".json") && !finalSceneIds.has(f.replace(".json", "")))
        .map((f) => fs.unlink(path.join(scenesDir, f)).catch(() => {}))
    );
  } catch { /* ignore */ }

  await Promise.all(
    finalScenes.map((scene) =>
      writeJson(path.join(scenesDir, `${scene.id}.json`), scene)
    )
  );

  // ── Other collections ──────────────────────────────────────────────────────
  await Promise.all([
    writeJson(path.join(projectDir, "characters.json"), { characters: resolveArray(resolvedCollections.characters) }),
    writeJson(path.join(projectDir, "flags.json"),      { flags:      resolveArray(resolvedCollections.flags) }),
    writeJson(path.join(projectDir, "images.json"),     { images:     resolveArray(resolvedCollections.images) }),
    writeJson(path.join(projectDir, "audio.json"),      { audio:      resolveArray(resolvedCollections.audio) }),
  ]);

  if (resolvedSettings) {
    const projectJsonPath = path.join(projectDir, "project.json");
    const current = await readLocalJson(projectJsonPath, {});
    current.settings = resolvedSettings;
    await writeJson(projectJsonPath, current);
  }

  // Commit the merge
  const git = getGit(projectDir);
  await git.add(".");
  const status = await git.status();
  if (status.files.length > 0) {
    await git.commit(`Merge de rama "${sourceBranch}"`);
  }

  console.log(`[MergeService] Applied merge from "${sourceBranch}" into ${projectDir}`);
}

module.exports = { analyzeMerge, applyMerge };
