const path = require("path");

// Definimos la raíz del proyecto (un nivel arriba de /server)
const rootDir = path.join(__dirname, "..");

module.exports = {
    // Puerto del servidor
    port: process.env.PORT || 3000,

    // Configuración de límites para el body parser (JSON)
    bodyParser: {
        limit: "5mb",
    },

    // Rutas absolutas del sistema
    paths: {
        root: rootDir,
        public: path.join(rootDir, "public"),
        projects: path.join(rootDir, "projects"),
        templates: path.join(rootDir, "server", "templates"),
    },
};
