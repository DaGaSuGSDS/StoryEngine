import { TabManager } from "./ui/TabManager.js";
import { ProjectStore } from "./state/ProjectStore.js";
import { ApiClient } from "./api/ApiClient.js";
import { GraphEditorTab } from "./ui/tabs/GraphEditorTab.js";
import { CharactersTab } from "./ui/tabs/CharactersTab.js";
import { FlagsTab } from "./ui/tabs/FlagsTab.js";
import { ImagesTab } from "./ui/tabs/ImagesTab.js";
import { AudioTab } from "./ui/tabs/AudioTab.js";
import { SettingsTab } from "./ui/tabs/SettingsTab.js";
import { StoryEngine } from "./runtime/StoryEngine.js";
import { showError, showInfo } from "./ui/notifications.js";

const apiClient = new ApiClient("http://localhost:3000/api");
const projectStore = new ProjectStore();
const storyEngine = new StoryEngine(projectStore, apiClient);

const projectSelect = document.getElementById("project-select");
const projectNewBtn = document.getElementById("project-new");
const projectLoadBtn = document.getElementById("project-load");
const projectSaveBtn = document.getElementById("project-save");
const projectExportBtn = document.getElementById("project-export");
const playSceneBtn = document.getElementById("play-scene");
const playOverlay = document.getElementById("play-overlay");
const playCloseBtn = document.getElementById("play-close");

const tabManager = new TabManager(document.getElementById("tab-content"), {
  graph: new GraphEditorTab(projectStore),
  characters: new CharactersTab(projectStore, apiClient),
  flags: new FlagsTab(projectStore),
  images: new ImagesTab(projectStore, apiClient),
  audio: new AudioTab(projectStore, apiClient),
  settings: new SettingsTab(projectStore, apiClient),
});

function refreshProjectSelect(projects, currentId) {
  projectSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccionar proyecto...";
  projectSelect.appendChild(placeholder);

  projects.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || p.id;
    projectSelect.appendChild(opt);
  });

  if (currentId) {
    projectSelect.value = currentId;
  }
}

async function loadProjectsList() {
  try {
    const projects = await apiClient.listProjects();
    refreshProjectSelect(projects, projectStore.project?.id);
  } catch (err) {
    console.error("Error al cargar proyectos", err);
    showError("Error al cargar la lista de proyectos.");
  }
}

async function handleCreateProject() {
  const name = window.prompt("Nombre del nuevo proyecto:");
  if (!name) return;
  try {
    const project = await apiClient.createProject({ name });
    projectStore.setProject(project);
    await loadProjectsList();
    refreshCurrentProject();
  } catch (err) {
    console.error("Error al crear proyecto", err);
    showError("Error al crear el proyecto.");
  }
}

async function handleLoadProject() {
  const id = projectSelect.value;
  if (!id) {
    showError("Selecciona un proyecto en la lista.");
    return;
  }
  try {
    const project = await apiClient.loadProject(id);
    projectStore.setProject(project);
    refreshCurrentProject();
  } catch (err) {
    console.error("Error al cargar proyecto", err);
    showError("Error al cargar el proyecto seleccionado.");
  }
}

async function handleSaveProject() {
  if (!projectStore.project) {
    showError("No hay proyecto cargado.");
    return;
  }
  try {
    await apiClient.saveProject(projectStore.toJSON());
    showInfo("Proyecto guardado correctamente.");
  } catch (err) {
    console.error("Error al guardar proyecto", err);
    showError("Error al guardar el proyecto.");
  }
}

function refreshCurrentProject() {
  tabManager.refreshAll();
  applyWindowPreferencesToEditor();
  updateFaviconFromProject();
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      tabManager.show(tabId);
    });
  });
  tabManager.show("graph");
}

function initPlayOverlay() {
  playCloseBtn.addEventListener("click", () => {
    playOverlay.classList.add("hidden");
    document.body.classList.remove("no-scroll");
    storyEngine.stop();
  });

  playSceneBtn.addEventListener("click", () => {
    if (!projectStore.currentScene) {
      showError(
        "Selecciona una escena primero en la pestaña de grafo."
      );
      return;
    }
    const playView = document.getElementById("play-view");
    playView.innerHTML = "";
    playOverlay.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    applyWindowPreferencesToEditor();
    storyEngine.playScene(projectStore.currentScene.id, playView);
  });
}

function initTopBar() {
  projectNewBtn.addEventListener("click", handleCreateProject);
  projectLoadBtn.addEventListener("click", handleLoadProject);
  projectSaveBtn.addEventListener("click", handleSaveProject);
  projectExportBtn.addEventListener("click", handleExportProject);
}

async function handleExportProject() {
  if (!projectStore.project) {
    showError("No hay proyecto cargado.");
    return;
  }

  const settingsTab = tabManager?.tabsMap?.settings;
  if (settingsTab && typeof settingsTab.flushPendingSave === "function") {
    settingsTab.flushPendingSave();
  }

  try {
    await apiClient.saveProject(projectStore.toJSON());
  } catch (err) {
    console.error("Error al guardar antes de exportar", err);
    showError("No se pudo exportar el proyecto. Intenta guardar primero.");
    return;
  }

  const id = projectStore.project.id;
  const url = `${apiClient.baseUrl}/projects/${encodeURIComponent(
    id
  )}/export`;
  window.location.href = url;
}

async function bootstrap() {
  initTabs();
  initTopBar();
  initPlayOverlay();
  await loadProjectsList();
  window.addEventListener("resize", applyWindowPreferencesToEditor);
}

bootstrap();

function applyWindowPreferencesToEditor() {
  const settings = projectStore.project?.settings;
  const overlayContent = document.querySelector(".overlay-content");
  if (!overlayContent) return;

  if (!settings) {
    overlayContent.style.width = "";
    overlayContent.style.height = "";
    overlayContent.style.maxWidth = "";
    overlayContent.style.maxHeight = "";
    overlayContent.style.resize = "";
    overlayContent.style.aspectRatio = "";
    return;
  }

  const baseW = settings.windowWidth || 1280;
  const baseH = settings.windowHeight || 720;
  const aspect = baseH > 0 ? baseW / baseH : 16 / 9;

  const maxW = window.innerWidth * 0.98;
  const maxH = window.innerHeight * 0.98;

  let targetW = maxW;
  let targetH = targetW / aspect;

  if (targetH > maxH) {
    targetH = maxH;
    targetW = targetH * aspect;
  }

  overlayContent.style.width = `${Math.floor(targetW)}px`;
  overlayContent.style.height = `${Math.floor(targetH)}px`;
  overlayContent.style.maxWidth = "98vw";
  overlayContent.style.maxHeight = "98vh";
  overlayContent.style.aspectRatio = `${baseW} / ${baseH}`;
  overlayContent.style.resize =
    settings.resizable !== false ? "both" : "none";
}

function updateFaviconFromProject() {
  const settings = projectStore.project?.settings;
  const images = projectStore.project?.images || [];
  const iconAsset =
    settings && settings.iconId
      ? images.find((img) => img.id === settings.iconId)
      : null;

  const existingLink =
    document.querySelector("link[rel='icon']") ||
    document.querySelector("link[rel='shortcut icon']");

  if (!iconAsset) {
    if (existingLink) {
      existingLink.parentNode.removeChild(existingLink);
    }
    return;
  }

  const origin = new URL(apiClient.baseUrl).origin;
  const href = `${origin}/projects/${encodeURIComponent(
    projectStore.project.id
  )}/images/${encodeURIComponent(iconAsset.fileName)}`;

  const link =
    existingLink || Object.assign(document.createElement("link"), { rel: "icon" });
  link.href = href;
  document.head.appendChild(link);
}
