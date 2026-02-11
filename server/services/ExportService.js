const archiver = require("archiver");
const path = require("path");
const fs = require("fs").promises; // Asegurar uso de promises para readFile
const { loadProject } = require("../projectService");
const config = require("../config");

/**
 * Servicio encargado de la lógica de exportación de proyectos.
 * Genera un archivo ZIP auto-contenido que incluye:
 * - El motor del juego (código frontend).
 * - Los datos del proyecto (project.json y assets).
 * - Archivos necesarios para ejecutar el juego con Electron (main.js, package.json).
 */
class ExportService {
  /**
   * @param {string} publicDir - Ruta absoluta al directorio público del frontend.
   *                             Se utiliza para copiar los archivos base del motor.
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
    // 1. Cargar datos del proyecto
    const project = await loadProject(projectId);
    if (!project) {
      res.status(404).send("Proyecto no encontrado");
      return;
    }

    // 2. Configurar headers para descarga de archivo ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${projectId}.zip"`
    );

    // 3. Inicializar archiver (nivel de compresión máximo)
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    // Conectar el stream del archivo ZIP directamente a la respuesta HTTP
    archive.pipe(res);

    // 4. Agregar el archivo de datos del proyecto
    archive.append(JSON.stringify(project, null, 2), {
      name: "project.json",
    });

    // 5. Copiar archivos estáticos base (CSS)
    archive.file(path.join(this.publicDir, "css", "main.css"), {
      name: "styles.css",
    });
    archive.file(path.join(this.publicDir, "css", "save-load.css"), {
      name: "save-load.css",
    });

    const jsDir = path.join(this.publicDir, "js");

    // 6. Copiar directorios de código fuente del frontend
    // Estos directorios contienen la lógica del motor del juego.
    archive.directory(path.join(jsDir, "models"), "js/models");
    archive.directory(path.join(jsDir, "runtime"), "js/runtime");
    archive.directory(path.join(jsDir, "save"), "js/save");
    archive.directory(path.join(jsDir, "state"), "js/state");
    archive.directory(path.join(jsDir, "utils"), "js/utils");
    archive.directory(path.join(jsDir, "commands"), "js/commands");

    // 7. Generación de código dinámico y plantillas
    // Inyectamos el bootstrap del juego que inicializa el motor con los datos del proyecto.
    const gameJs = this._generateGameJs(project);
    archive.append(gameJs, { name: "js/game.js" });

    // Generamos el package.json para Electron usando la plantilla
    const electronPackageJson = await this._generateElectronPackageJson(projectId);
    archive.append(electronPackageJson, { name: "package.json" });

    // Generamos el main.js de Electron con la configuración específica del proyecto
    const electronMainJs = await this._generateElectronMainJs(project);
    archive.append(electronMainJs, { name: "main.js" });

    // Generamos el index.html
    const indexHtml = await this._generateIndexHtml(project);
    archive.append(indexHtml, { name: "index.html" });

    // 8. Copiar assets (imágenes y audio) usados en el proyecto
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

    // 9. Preload script para permitir comunicación segura en Electron
    const preloadJs = await this._generatePreloadJs();
    archive.append(preloadJs, { name: "preload.js" });

    // Finalizar el archivo ZIP (esto cierra el stream de respuesta)
    await archive.finalize();
  }

  /**
   * Genera el archivo game.js que arranca el juego.
   * Inyecta los datos del proyecto directamente en el código para evitar peticiones fetch locales (problemas de CORS).
   */
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

  /**
   * Carga una plantilla de texto desde el sistema de archivos.
   * @param {string} filename - Nombre del archivo en server/templates/export
   */
  async _loadTemplate(filename) {
    const templatePath = path.join(config.paths.templates, "export", filename);
    return await fs.readFile(templatePath, "utf-8");
  }

  async _generateElectronPackageJson(projectId) {
    const template = await this._loadTemplate("package.json");
    // Reemplazo simple de string para el ID del proyecto (nombre del paquete)
    return template.replace("{{PROJECT_ID}}", projectId);
  }

  /**
   * Genera el main.js de Electron inyectando la configuración como un objeto JSON.
   */
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

    // Objeto de configuración que será inyectado en el código final
    const config = {
      width: windowWidth,
      height: windowHeight,
      resizable: resizable,
      iconFileName: iconFileName,
    };

    let template = await this._loadTemplate("electron-main.js");

    // Reemplazamos el bloque de configuración por defecto en la plantilla
    // con el objeto JSON real generado a partir de los settings del proyecto.
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
