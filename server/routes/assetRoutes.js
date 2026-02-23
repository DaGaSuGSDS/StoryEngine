const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const {
    addImageToProject,
    deleteImageFromProject,
    addAudioToProject,
    deleteAudioFromProject,
} = require("../projectService");

const projectsDir = config.paths.projects;

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

// Subir una imagen a un proyecto
router.post("/:id/images", uploadImage.single("image"), async (req, res) => {
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
});

// Eliminar una imagen de un proyecto
router.delete("/:id/images/:imageId", async (req, res) => {
    try {
        await deleteImageFromProject(req.params.id, req.params.imageId);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error eliminando imagen");
    }
});

// Subir un audio a un proyecto
router.post("/:id/audio", uploadAudio.single("audio"), async (req, res) => {
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
});

// Eliminar un audio de un proyecto
router.delete("/:id/audio/:audioId", async (req, res) => {
    try {
        await deleteAudioFromProject(req.params.id, req.params.audioId);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error eliminando audio");
    }
});

module.exports = router;
