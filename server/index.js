const express = require("express");
const cors = require("cors");
const config = require("./config");
const fs = require("fs");

const app = express();
const port = config.port;

// Configuración básica de Express
app.use(cors());
app.use(express.json(config.bodyParser));

// Importar rutas
const projectRoutes = require("./routes/projectRoutes");
const assetRoutes = require("./routes/assetRoutes");
const exportRoutes = require("./routes/exportRoutes");
const gitRoutes = require("./routes/gitRoutes");

// Definición de directorios estáticos
const publicDir = config.paths.public;
const projectsDir = config.paths.projects;

// Aseguramos que la carpeta de proyectos exista al inicio
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// Servimos el frontend y los proyectos como archivos estáticos
app.use(express.static(publicDir));
app.use("/projects", express.static(projectsDir));

// Montar rutas de API
app.use("/api/projects", projectRoutes);
app.use("/api/projects", assetRoutes);
app.use("/api/projects", exportRoutes);
app.use("/api/projects", gitRoutes);

app.listen(port, () => {
  console.log(`StoryEnginev2 escuchando en http://localhost:${port}`);
});
