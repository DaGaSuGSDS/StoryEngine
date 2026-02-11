const express = require("express");
const router = express.Router();
const {
    listProjects,
    createProject,
    loadProject,
    saveProject,
} = require("../projectService");

// Listar todos los proyectos
router.get("/", async (req, res) => {
    try {
        const projects = await listProjects();
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error listando proyectos");
    }
});

// Crear un nuevo proyecto
router.post("/", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.put("/:id", async (req, res) => {
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

module.exports = router;
