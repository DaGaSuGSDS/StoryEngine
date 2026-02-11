# Mejoras y Refactorización del Proyecto

Este documento detalla sugerencias para mejorar la estructura, mantenibilidad y escalabilidad del proyecto **StoryEngine**.

## 1. Arquitectura del Servidor (`server/`)

Actualmente, `server/index.js` actúa como un gran controlador monolítico.

### Sugerencias:
- **Separación de Rutas**: Mover los endpoints de Express a archivos de rutas separados (ej. `routes/projects.js`, `routes/assets.js`). `index.js` solo debería encargarse de la configuración inicial del servidor y montar las rutas.
- **Configuración Centralizada**: Extraer puertos, rutas de archivos y configuraciones a un archivo `config.js` o usar variables de entorno (`dotenv`). Evitar rutas relativas "mágicas" como `path.join(__dirname, "..", "projects")` dispersas por el código.
- **Servicio de Exportación**: La lógica de exportación en `index.js` (generación del ZIP) mezcla lógica de negocio con generación de código mediante strings (`gameJs`, `electronMainJs`). Esto es propenso a errores.
    - **Acción**: Crear un `ExportService.js` dedicado.
    - **Mejora**: Usar archivos de plantilla (ej. handlebars o simples archivos `.js` de text) en lugar de cadenas de texto hardcodeadas dentro del código.

### Clases/Archivos a revisar:
- `server/index.js`: Demasiada responsabilidad.
- `server/projectService.js`: Buen inicio, pero podría beneficiarse de un manejo de errores más robusto y validación de esquemas (ej. usando `zod` o `joi`).

## 2. Estructura del Frontend (`public/js/`)

El frontend utiliza Vanilla JS con manipulación directa del DOM. Aunque es ligero, puede volverse inmanejable.

### Sugerencias:
- **Componentes Web / UI Helpers**: La creación de elementos DOM es verbosa (`document.createElement`, asignación de estilos, etc.).
    - **Refactorización**: Crear una librería de utilidades de UI más robusta o considerar adoptar Web Components nativos para elementos reusables (botones, modales, tarjetas de nodos).
- **Gestión de Estado**: `main.js` inicializa y orquesta todo. `ProjectStore` es el singleton de estado.
    - **Mejora**: Implementar un patrón Observador más formal o usar un sistema de eventos centralizado para desacoplar componentes.
- **GraphEditor**: `GraphEditorTab.js` es muy grande y maneja lógica de UI, lógica de grafo y eventos de mouse.
    - **Refactorización**: Separar la lógica de interacción (drag & drop, selección) de la lógica de renderizado (`NodeRenderer`) y de la lógica de datos.
    - **Canvas Virtual**: Si el grafo crece mucho, el rendimiento caerá. Considerar usar un canvas HTML5 real o una librería como `PixiJS` si el DOM se vuelve lento, aunque para grafos de tamaño medio el DOM está bien si se optimiza.

### Clases/Archivos a revisar:
- `public/js/ui/tabs/GraphEditorTab.js`: Candidato principal para refactorización. Separar handlers de eventos en controladores dedicados.
- `public/js/main.js`: Reducir su responsabilidad moviendo la inicialización de módulos a un `App` o `Bootstrapper`.

## 3. Calidad de Código y Tooling

### Sugerencias:
- **Testing**: No se observan tests automatizados.
    - **Acción Crítica**: Añadir soporte para tests unitarios (Jest o Mocha).
    - **Prioridad**: Testear `server/projectService.js` (lógica de archivos crítica) y `public/js/models/Graph.js` (lógica core del grafo).
- **TypeScript**: Debido a la complejidad de las estructuras de datos (Nodos, Grafo, Proyecto), el proyecto se beneficiaría enormemente de **TypeScript**.
    - Ayudaría a prevenir errores de tipos en el paso de mensajes entre servidor y cliente y en la manipulación del grafo.
- **Validación de Datos**: Al cargar un proyecto (`loadProject`), no hay validación estricta de que el JSON cumpla con la estructura esperada. Si un archivo se corrompe, la app podría fallar silenciosamente o de forma extraña.

## 4. Refactorizaciones Específicas Propuestas

### A. Modularización de la Exportación
Extraer la generación del "Juego Exportado" del `index.js`.
```javascript
// server/services/ExportService.js
class ExportService {
  async exportProject(projectId, projectData) {
    // Lógica de creación del ZIP
  }
  
  _generateGameJs(projectData) {
    // Generación del contenido JS
  }
}
```

### B. Desacoplamiento de `GraphEditorTab`
Dividir la lógica de interacción.
```javascript
// public/js/ui/graph/GraphInteractionManager.js
export class GraphInteractionManager {
  constructor(renderer, store) { ... }
  setupMarquee() { ... }
  setupDragDrop() { ... }
}
```

### C. Unificación de Estilos
Muchos estilos se aplican vía JS (`element.style.width = ...`). Mover tanto como sea posible a clases CSS y solo manipular variables CSS o clases de estado (`.is-hidden`, `.is-active`).
