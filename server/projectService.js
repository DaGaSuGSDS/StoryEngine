const fs = require("fs").promises;
const path = require("path");

const config = require("./config");

// Define la ruta raíz donde se almacenan todos los proyectos.
// Se ubica en una carpeta "projects" al mismo nivel que la carpeta "server".
const projectsRoot = config.paths.projects;

/**
 * Asegura que un directorio exista, creándolo si es necesario (incluyendo padres).
 * @param {string} dir - Ruta del directorio.
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Lee un archivo JSON y lo parsea.
 * @param {string} filePath - Ruta del archivo JSON.
 * @param {any} defaultValue - Valor a retornar si falla la lectura (ej. archivo no existe).
 * @returns {Promise<any>} - El objeto parseado o el valor por defecto.
 */
async function readJson(filePath, defaultValue) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Escribe datos en un archivo JSON con formato legible (indentación de 2 espacios).
 * Asegura que el directorio padre exista antes de escribir.
 * @param {string} filePath - Ruta del archivo.
 * @param {any} data - Datos a escribir.
 */
async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf8");
}

/**
 * Lista todos los proyectos disponibles en la carpeta `projectsRoot`.
 * Lee el archivo `project.json` de cada subdirectorio para obtener el nombre.
 * @returns {Promise<Array<{id: string, name: string}>>} - Lista de proyectos.
 */
async function listProjects() {
  await ensureDir(projectsRoot);
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const projects = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const projectJsonPath = path.join(projectsRoot, id, "project.json");
    // Leemos metadatos básicos, si falla usamos el ID como nombre
    const meta = await readJson(projectJsonPath, { id, name: id });
    projects.push({ id, name: meta.name || id });
  }
  return projects;
}

/**
 * Crea un nuevo proyecto inicializando su estructura de carpetas y archivos base.
 * @param {string} name - Nombre del proyecto.
 * @returns {Promise<Object>} - El objeto del proyecto creado.
 */
async function createProject(name) {
  // Genera un ID único basado en el nombre y la fecha actual
  const id = name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
  const dir = path.join(projectsRoot, id);
  await ensureDir(dir);

  // Estructura inicial del proyecto
  const project = {
    id,
    name,
    scenes: [],
    characters: [],
    flags: [],
    images: [],
    audio: [],
    imageFolders: [],
    settings: {}, // Configuraciones (resolución, colores, etc.)
  };

  // Guardamos el proyecto inicial en disco
  await saveProject(project);
  return project;
}

/**
 * Carga un proyecto completo leyendo sus múltiples archivos JSON (scenes, characters, etc.).
 * @param {string} id - ID del proyecto.
 * @returns {Promise<Object|null>} - Objeto con todos los datos del proyecto o null si no existe.
 */
async function loadProject(id) {
  const dir = path.join(projectsRoot, id);
  try {
    await fs.access(dir);
  } catch {
    return null; // El directorio no existe
  }

  // Carga paralela de todos los archivos de recursos
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

  // Combina todo en un único objeto de estado
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

/**
 * Guarda el estado completo del proyecto distribuyéndolo en varios archivos JSON.
 * @param {Object} project - Objeto con los datos del proyecto.
 */
async function saveProject(project) {
  const dir = path.join(projectsRoot, project.id);
  await ensureDir(dir);

  // Escritura paralela para mejorar rendimiento
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

/**
 * Registra una imagen en el archivo `images.json` del proyecto.
 * NOTA: La subida física del archivo se maneja en el controlador (index.js).
 * @param {string} projectId - ID del proyecto.
 * @param {Object} fileInfo - { originalName, fileName }
 * @returns {Promise<Object>} - El objeto de asset de imagen creado.
 */
async function addImageToProject(projectId, { originalName, fileName }) {
  const dir = path.join(projectsRoot, projectId);
  await ensureDir(dir);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });

  // Genera ID único para el asset
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

/**
 * Elimina una imagen del registro `images.json` y borra el archivo físico.
 * @param {string} projectId - ID del proyecto.
 * @param {string} imageId - ID del asset de imagen.
 */
async function deleteImageFromProject(projectId, imageId) {
  const dir = path.join(projectsRoot, projectId);
  const imagesPath = path.join(dir, "images.json");
  const json = await readJson(imagesPath, { images: [], folders: [] });
  const img = json.images.find((i) => i.id === imageId);

  if (img) {
    const imgFilePath = path.join(dir, "images", img.fileName);
    try {
      await fs.unlink(imgFilePath); // Borrado físico
    } catch (err) {
      console.warn(
        `No se pudo borrar el archivo de imagen "${imgFilePath}":`,
        err.message
      );
    }
    // Actualización del registro
    json.images = json.images.filter((i) => i.id !== imageId);
    await writeJson(imagesPath, json);
  }
}

/**
 * Registra un archivo de audio en `audio.json`.
 * @param {string} projectId - ID del proyecto.
 * @param {Object} fileInfo - { originalName, fileName }
 * @returns {Promise<Object>} - El objeto de asset de audio.
 */
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

/**
 * Elimina un audio del registro y del sistema de archivos.
 * @param {string} projectId - ID del proyecto.
 * @param {string} audioId - ID del asset de audio.
 */
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
