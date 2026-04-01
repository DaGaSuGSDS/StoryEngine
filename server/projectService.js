const fs = require("fs").promises;
const path = require("path");

const config = require("./config");
const GitService = require("./services/GitService");

const projectsRoot = config.paths.projects;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath, defaultValue) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ─── SCENES ───────────────────────────────────────────────────────────────────

/**
 * Reads all scene files from projects/<id>/scenes/*.json
 * Each file contains a single scene object.
 * @param {string} dir - Project root directory.
 * @returns {Promise<Array>} - Array of scene objects.
 */
async function loadScenes(dir) {
  const scenesDir = path.join(dir, "scenes");
  try {
    await fs.access(scenesDir);
  } catch {
    // Fallback: legacy projects stored all scenes in a single scenes.json
    const legacy = await readJson(path.join(dir, "scenes.json"), null);
    if (legacy && Array.isArray(legacy.scenes)) {
      return legacy.scenes;
    }
    return [];
  }
  const entries = await fs.readdir(scenesDir);
  const sceneFiles = entries.filter((f) => f.endsWith(".json"));
  const scenes = await Promise.all(
    sceneFiles.map((f) => readJson(path.join(scenesDir, f), null))
  );
  return scenes.filter(Boolean);
}

/**
 * Saves scenes as individual files: projects/<id>/scenes/<sceneId>.json
 * Deletes files for scenes that no longer exist in the project.
 * @param {string} dir - Project root directory.
 * @param {Array} scenes - Array of scene objects.
 */
async function saveScenes(dir, scenes) {
  const scenesDir = path.join(dir, "scenes");
  await ensureDir(scenesDir);

  // Get existing scene files on disk
  const existing = new Set(
    (await fs.readdir(scenesDir))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
  );

  // Write one file per scene
  const current = new Set();
  await Promise.all(
    scenes.map((scene) => {
      current.add(scene.id);
      return writeJson(path.join(scenesDir, `${scene.id}.json`), scene);
    })
  );

  // Delete files for removed scenes
  const removed = [...existing].filter((id) => !current.has(id));
  await Promise.all(
    removed.map((id) =>
      fs.unlink(path.join(scenesDir, `${id}.json`)).catch(() => {})
    )
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

async function listProjects() {
  await ensureDir(projectsRoot);
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const meta = await readJson(path.join(projectsRoot, id, "project.json"), { id, name: id });
    projects.push({ id, name: meta.name || id });
  }
  return projects;
}

async function createProject(name) {
  const id = name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
  const dir = path.join(projectsRoot, id);
  await ensureDir(dir);

  const project = {
    id,
    name,
    scenes: [],
    characters: [],
    flags: [],
    images: [],
    audio: [],
    imageFolders: [],
    settings: {},
  };

  await saveProject(project);
  return project;
}

async function loadProject(id) {
  const dir = path.join(projectsRoot, id);
  try {
    await fs.access(dir);
  } catch {
    return null;
  }

  const [projectMeta, scenes, characters, flags, images, audio] =
    await Promise.all([
      readJson(path.join(dir, "project.json"), { id, name: id, settings: {} }),
      loadScenes(dir),
      readJson(path.join(dir, "characters.json"), { characters: [] }),
      readJson(path.join(dir, "flags.json"), { flags: [] }),
      readJson(path.join(dir, "images.json"), { images: [], folders: [] }),
      readJson(path.join(dir, "audio.json"), { audio: [] }),
    ]);

  return {
    id,
    name: projectMeta.name || id,
    scenes,
    characters: characters.characters || [],
    flags: flags.flags || [],
    images: images.images || [],
    imageFolders: images.folders || [],
    audio: audio.audio || [],
    settings: projectMeta.settings || {},
  };
}

async function saveProject(project) {
  const dir = path.join(projectsRoot, project.id);
  await ensureDir(dir);

  await Promise.all([
    writeJson(path.join(dir, "project.json"), {
      id: project.id,
      name: project.name || project.id,
      settings:
        project.settings && typeof project.settings === "object"
          ? project.settings
          : {},
    }),
    saveScenes(dir, project.scenes || []),
    writeJson(path.join(dir, "characters.json"), {
      characters: project.characters || [],
    }),
    writeJson(path.join(dir, "flags.json"), {
      flags: project.flags || [],
    }),
    writeJson(path.join(dir, "images.json"), {
      images: project.images || [],
      folders: project.imageFolders || [],
    }),
    writeJson(path.join(dir, "audio.json"), {
      audio: project.audio || [],
    }),
  ]);

  await GitService.autoCommit(dir, project.name || project.id);
}

// ─── ASSETS ───────────────────────────────────────────────────────────────────

async function addImageToProject(projectId, { originalName, fileName }) {
  const dir = path.join(projectsRoot, projectId);
  await ensureDir(dir);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });

  const asset = { id: crypto.randomUUID(), name: originalName, fileName };
  json.images.push(asset);
  await writeJson(imagesPath, json);
  await GitService.autoCommit(dir, `proyecto:${projectId}`);
  return asset;
}

async function deleteImageFromProject(projectId, imageId) {
  const dir = path.join(projectsRoot, projectId);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });
  const img = json.images.find((i) => i.id === imageId);

  if (img) {
    try {
      await fs.unlink(path.join(dir, "images", img.fileName));
    } catch (err) {
      console.warn(`No se pudo borrar imagen "${img.fileName}":`, err.message);
    }
    json.images = json.images.filter((i) => i.id !== imageId);
    await writeJson(imagesPath, json);
    await GitService.autoCommit(dir, `proyecto:${projectId}`);
  }
}

async function addAudioToProject(projectId, { originalName, fileName }) {
  const dir = path.join(projectsRoot, projectId);
  await ensureDir(dir);
  const audioPath = path.join(dir, "audio.json");
  const json = await readJson(audioPath, { audio: [] });

  const asset = { id: crypto.randomUUID(), name: originalName, fileName };
  json.audio.push(asset);
  await writeJson(audioPath, json);
  await GitService.autoCommit(dir, `proyecto:${projectId}`);
  return asset;
}

async function deleteAudioFromProject(projectId, audioId) {
  const dir = path.join(projectsRoot, projectId);
  const audioPath = path.join(dir, "audio.json");
  const json = await readJson(audioPath, { audio: [] });
  const aud = json.audio.find((a) => a.id === audioId);

  if (aud) {
    try {
      await fs.unlink(path.join(dir, "audio", aud.fileName));
    } catch (err) {
      console.warn(`No se pudo borrar audio "${aud.fileName}":`, err.message);
    }
    json.audio = json.audio.filter((a) => a.id !== audioId);
    await writeJson(audioPath, json);
    await GitService.autoCommit(dir, `proyecto:${projectId}`);
  }
}

module.exports = {
  listProjects,
  createProject,
  loadProject,
  saveProject,
  addImageToProject,
  deleteImageFromProject,
  addAudioToProject,
  deleteAudioFromProject,
};
