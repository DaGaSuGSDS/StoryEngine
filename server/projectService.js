const fs = require("fs").promises;
const path = require("path");

const projectsRoot = path.join(__dirname, "..", "projects");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath, defaultValue) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf8");
}

async function listProjects() {
  await ensureDir(projectsRoot);
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const projectJsonPath = path.join(projectsRoot, id, "project.json");
    const meta = await readJson(projectJsonPath, { id, name: id });
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
      readJson(path.join(dir, "project.json"), {
        id,
        name: id,
        settings: {},
      }),
      readJson(path.join(dir, "scenes.json"), { scenes: [] }),
      readJson(path.join(dir, "characters.json"), { characters: [] }),
      readJson(path.join(dir, "flags.json"), { flags: [] }),
      readJson(path.join(dir, "images.json"), { images: [], folders: [] }),
      readJson(path.join(dir, "audio.json"), { audio: [] }),
    ]);

  return {
    id,
    name: projectMeta.name || id,
    scenes: scenes.scenes || [],
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
    writeJson(path.join(dir, "scenes.json"), {
      scenes: project.scenes || [],
    }),
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
}

async function addImageToProject(projectId, { originalName, fileName }) {
  const dir = path.join(projectsRoot, projectId);
  await ensureDir(dir);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });
  const id = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const asset = {
    id,
    name: originalName,
    fileName,
  };
  json.images.push(asset);
  await writeJson(imagesPath, json);
  return asset;
}

async function deleteImageFromProject(projectId, imageId) {
  const dir = path.join(projectsRoot, projectId);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });
  const img = json.images.find((i) => i.id === imageId);
  if (img) {
    const imgFilePath = path.join(dir, "images", img.fileName);
    try {
      await fs.unlink(imgFilePath);
    } catch (err) {
      console.warn(
        `No se pudo borrar el archivo de imagen "${imgFilePath}":`,
        err.message
      );
    }
    json.images = json.images.filter((i) => i.id !== imageId);
    await writeJson(imagesPath, json);
  }
}

async function addAudioToProject(projectId, { originalName, fileName }) {
  const dir = path.join(projectsRoot, projectId);
  await ensureDir(dir);
  const audioPath = path.join(dir, "audio.json");
  const json = await readJson(audioPath, { audio: [] });
  const id = "aud_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const asset = {
    id,
    name: originalName,
    fileName,
  };
  json.audio.push(asset);
  await writeJson(audioPath, json);
  return asset;
}

async function deleteAudioFromProject(projectId, audioId) {
  const dir = path.join(projectsRoot, projectId);
  const audioPath = path.join(dir, "audio.json");
  const json = await readJson(audioPath, { audio: [] });
  const aud = json.audio.find((a) => a.id === audioId);
  if (aud) {
    const audioFilePath = path.join(dir, "audio", aud.fileName);
    try {
      await fs.unlink(audioFilePath);
    } catch (err) {
      console.warn(
        `No se pudo borrar el archivo de audio "${audioFilePath}":`,
        err.message
      );
    }
    json.audio = json.audio.filter((a) => a.id !== audioId);
    await writeJson(audioPath, json);
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
