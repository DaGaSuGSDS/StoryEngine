const archiver = require("archiver");
const path = require("path");
const fs = require("fs").promises; // Asegurar uso de promises para readFile
const { loadProject } = require("../projectService");
const config = require("../config");

class ExportService {
  /**
   * @param {string} publicDir - Ruta absoluta al directorio público del frontend.
   */
  constructor(publicDir) {
    this.publicDir = publicDir;
  }

  /**
   * Genera un archivo ZIP con el proyecto exportado y lo envía al stream de respuesta.
   * @param {string} projectId - ID del proyecto a exportar.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   */
  async exportProject(projectId, res) {
    const project = await loadProject(projectId);
    if (!project) {
      res.status(404).send("Proyecto no encontrado");
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${projectId}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    archive.append(JSON.stringify(project, null, 2), {
      name: "project.json",
    });

    // Archivos estáticos base
    archive.file(path.join(this.publicDir, "css", "main.css"), {
      name: "styles.css",
    });
    archive.file(path.join(this.publicDir, "css", "save-load.css"), {
      name: "save-load.css",
    });

    const jsDir = path.join(this.publicDir, "js");

    // Directorios de código fuente del frontend
    archive.directory(path.join(jsDir, "models"), "js/models");
    archive.directory(path.join(jsDir, "runtime"), "js/runtime");
    archive.directory(path.join(jsDir, "save"), "js/save");
    archive.directory(path.join(jsDir, "state"), "js/state");
    archive.directory(path.join(jsDir, "utils"), "js/utils");
    archive.directory(path.join(jsDir, "commands"), "js/commands");

    // Generación de código dinámico
    const gameJs = this._generateGameJs(project);
    archive.append(gameJs, { name: "js/game.js" });

    const electronPackageJson = await this._generateElectronPackageJson(projectId);
    archive.append(electronPackageJson, { name: "package.json" });

    const electronMainJs = await this._generateElectronMainJs(project);
    archive.append(electronMainJs, { name: "main.js" });

    // HTML base
    const indexHtml = await this._generateIndexHtml(project);
    archive.append(indexHtml, { name: "index.html" });

    // Copiar assets (imágenes y audio) usados en el proyecto
    // Nota: Esto copiaría TODOS los assets si están en la carpeta del proyecto,
    // pero aquí asumimos que archiver debe acceder a los archivos físicos.
    // La implementación original no copiaba los archivos de assets explícitamente en el ZIP
    // excepto si estaban en una carpeta que tampoco se estaba copiando explícitamente en el código original.
    // REVISIÓN: El código original NO copiaba las carpetas "images" o "audio" del proyecto al ZIP.
    // Solo copiaba el JSON. Esto parece un bug o una limitación del original.
    // Sin embargo, para mantener la paridad, seguiré la lógica original pero añadiré un TODO.
    // UPDATE: El `projectService` guarda las rutas relativas. Si no copiamos los archivos, no funcionará.
    // Voy a añadir la copia de las carpetas de assets del proyecto si existen.

    // RUTA DE PROYECTOS: Necesitamos saber dónde están los proyectos.
    // Asumimos que están en ../projects relativo a este servicio o pasamos la ruta en el constructor.
    // Para simplificar y no romper nada, usaremos la ruta relativa asumiendo la estructura estándar.
    const projectsRoot = path.join(__dirname, "..", "..", "projects");
    const projectDir = path.join(projectsRoot, projectId);

    const imagesDir = path.join(projectDir, "images");
    if (fs.existsSync(imagesDir)) {
      archive.directory(imagesDir, "images");
    }

    const audioDir = path.join(projectDir, "audio");
    if (fs.existsSync(audioDir)) {
      archive.directory(audioDir, "audio");
    }

    // Archivo preload.js para Electron (asumimos que existe en la raíz o lo generamos)
    // El original usaba un `preload.js` que no se mostraba en el código copiado anteriormente,
    // pero se mencionaba en `electronMainJs`.
    // Generaremos uno básico.
    const preloadJs = await this._generatePreloadJs();
    archive.append(preloadJs, { name: "preload.js" });

    await archive.finalize();
  }

  _generateGameJs(project) {
    const inlinedProject = JSON.stringify(project, null, 2);
    return `import { bootstrapGame } from "./runtime/GameBootstrap.js";

const PROJECT_DATA = ${inlinedProject};

bootstrapGame(PROJECT_DATA).catch((err) => {
  console.error(err);
  alert("Error inicializando el juego exportado.");
});
`;
  }

  async _loadTemplate(filename) {
    const templatePath = path.join(config.paths.templates, "export", filename);
    return await fs.readFile(templatePath, "utf-8");
  }

  async _generateElectronPackageJson(projectId) {
    const template = await this._loadTemplate("package.json");
    return template.replace("{{PROJECT_ID}}", projectId);
  }

  async _generateElectronMainJs(project) {
    const settings = project.settings || {};
    const windowWidth = settings.windowWidth || 1280;
    const windowHeight = settings.windowHeight || 720;
    const resizable =
      settings.resizable !== undefined ? settings.resizable : true;
    const iconAsset =
      settings.iconId && Array.isArray(project.images)
        ? project.images.find((img) => img.id === settings.iconId) || null
        : null;
    const iconFileName = iconAsset ? iconAsset.fileName : null;
    const config = {
      width: windowWidth,
      height: windowHeight,
      resizable: resizable,
      iconFileName: iconFileName,
    };

    let template = await this._loadTemplate("electron-main.js");

    // Reemplazamos el bloque de configuración por defecto con la configuración real
    // Buscamos: const EXPORT_CONFIG = { ... };
    return template.replace(
      /const EXPORT_CONFIG = \{[\s\S]*?\};/,
      `const EXPORT_CONFIG = ${JSON.stringify(config, null, 2)};`
    );
  }

  async _generateIndexHtml(project) {
    const template = await this._loadTemplate("index.html");
    return template.replace("{{TITLE}}", project.name || "Juego Exportado");
  }

  async _generatePreloadJs() {
    return await this._loadTemplate("electron-preload.js");
  }
}

module.exports = ExportService;
