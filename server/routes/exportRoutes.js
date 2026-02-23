const express = require("express");
const router = express.Router();
const ExportService = require("../services/ExportService");
const config = require("../config");

const exportService = new ExportService(config.paths.public);

// Exportar proyecto
router.get("/:id/export", async (req, res) => {
    try {
        await exportService.exportProject(req.params.id, res);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).send("Error exportando proyecto");
        }
    }
});

module.exports = router;
