const path = require("path");
const express = require("express");
const cors = require("cors"); // Middleware para permitir peticiones HTTP desde otros dominios
const multer = require("multer"); // Middleware para manejar subida de archivos (multipart/form-data)
const fs = require("fs");

// Importamos las funciones de servicio que manejan la lógica de negocio y persistencia
const {
  listProjects,
  createProject,
  loadProject,
  saveProject,
  addImageToProject,
  deleteImageFromProject,
  addAudioToProject,
  deleteAudioFromProject,
} = require("./projectService");

const ExportService = require("./services/ExportService");

const app = express();
const config = require("./config");
const port = config.port;

// Configuración básica de Express
app.use(cors());
app.use(express.json(config.bodyParser)); // Aumentamos límite para guardar proyectos grandes

// Definición de directorios estáticos
const publicDir = config.paths.public; // Archivos del frontend (js, css, html)
const projectsDir = config.paths.projects; // Carpeta donde se guardan los proyectos de usuario

// Inicializar servicios
const exportService = new ExportService(publicDir);

// Servimos el frontend y los proyectos como archivos estáticos
app.use(express.static(publicDir));
// Permitimos acceso web a los assets de los proyectos (ej. /projects/my_project/images/foo.png)
app.use("/projects", express.static(projectsDir));

// Aseguramos que la carpeta de proyectos exista al inicio
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// Configuración de almacenamiento para imágenes
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectId = req.params.id;
    const imgDir = path.join(projectsDir, projectId, "images");
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    cb(null, imgDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectId = req.params.id;
    const audioDir = path.join(projectsDir, projectId, "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadAudio = multer({ storage: audioStorage });

// --- ENDPOINTS DE API ---

// Listar todos los proyectos
app.get("/api/projects",
  async (req, res) => {
    try {
      const projects = await listProjects();
      res.json(projects);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error listando proyectos");
    }
  });

// Crear un nuevo proyecto
app.post("/api/projects",
  async (req, res) => {
    try {
      const body = req.body || {};
      const name =
        typeof body.name === "string" && body.name.trim().length > 0
          ? body.name.trim()
          : "Proyecto";
      const project = await createProject(name);
      res.json(project);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creando proyecto");
    }
  });

// Cargar un proyecto específico por ID
app.get("/api/projects/:id",
  async (req, res) => {
    try {
      const project = await loadProject(req.params.id);
      if (!project) {
        res.status(404).send("Proyecto no encontrado");
        return;
      }
      res.json(project);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error cargando proyecto");
    }
  });

// Guardar/Actualizar un proyecto
app.put("/api/projects/:id",
  async (req, res) => {
    try {
      const project = req.body;
      if (!project || typeof project !== "object") {
        res.status(400).send("Proyecto inválido");
        return;
      }

      project.id = req.params.id;
      project.name =
        typeof project.name === "string" && project.name.trim().length > 0
          ? project.name.trim()
          : project.id;
      project.scenes = Array.isArray(project.scenes) ? project.scenes : [];
      project.characters = Array.isArray(project.characters)
        ? project.characters
        : [];
      project.flags = Array.isArray(project.flags) ? project.flags : [];
      project.images = Array.isArray(project.images) ? project.images : [];
      project.audio = Array.isArray(project.audio) ? project.audio : [];
      project.settings =
        project.settings && typeof project.settings === "object"
          ? project.settings
          : {};

      await saveProject(project);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error guardando proyecto");
    }
  });

// Subir una imagen a un proyecto
app.post("/api/projects/:id/images",
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const projectId = req.params.id;
      const file = req.file;
      if (!file) {
        res.status(400).send("Falta archivo");
        return;
      }
      const asset = await addImageToProject(projectId, {
        originalName: file.originalname,
        fileName: file.filename,
      });
      res.json(asset);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error subiendo imagen");
    }
  }
);

// Eliminar una imagen de un proyecto
app.delete("/api/projects/:id/images/:imageId",
  async (req, res) => {
    try {
      await deleteImageFromProject(req.params.id, req.params.imageId);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error eliminando imagen");
    }
  });

// Subir un audio a un proyecto
app.post("/api/projects/:id/audio",
  uploadAudio.single("audio"),
  async (req, res) => {
    try {
      const projectId = req.params.id;
      const file = req.file;
      if (!file) {
        res.status(400).send("Falta archivo");
        return;
      }
      const asset = await addAudioToProject(projectId, {
        originalName: file.originalname,
        fileName: file.filename,
      });
      res.json(asset);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error subiendo audio");
    }
  }
);

// Eliminar un audio de un proyecto
app.delete("/api/projects/:id/audio/:audioId",
  async (req, res) => {
    try {
      await deleteAudioFromProject(req.params.id, req.params.audioId);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error eliminando audio");
    }
  });

/**
 * EXPORTAR PROYECTO
 * Genera un archivo .zip que contiene el juego completo listo para ejecutarse de forma independiente
 * o con Electron. Empaqueta el JSON del proyecto, los assets, y el runtime necesario.
 */
app.get("/api/projects/:id/export",
  async (req, res) => {
    try {
      await exportService.exportProject(req.params.id, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).send("Error exportando proyecto");
      }
    }
  });

app.listen(port, () => {
  console.log(`StoryEnginev2 escuchando en http://localhost:${port}`);
});
