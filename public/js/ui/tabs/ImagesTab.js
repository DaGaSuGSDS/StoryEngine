import { showError, showInfo } from "../notifications.js";
import { generateId } from "../../utils/idGenerator.js";
/**
 * ImagesTab.js
 * UI component for managing image assets and folders.
 */
import { ImageFolder } from "../../models/ImageFolder.js";

export class ImagesTab {
  /**
   * @param {Object} projectStore
   * @param {Object} apiClient
   */
  constructor(projectStore, apiClient) {
    this.projectStore = projectStore;
    this.apiClient = apiClient;
    this.root = null;
    this.uploadBtn = null;
    this.currentFolderId = null;
    this.contextMenu = null;
    this.globalContextMenuHandler = null;
    this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
  }

  /**
   * Renders the tab.
   * @returns {HTMLElement}
   */
  render() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.projectStore.subscribe(() => this.refresh());
    }
    this.root = document.createElement("div");
    this.root.className = "panel";
    this.root.style.width = "100%";
    this.root.style.height = "100%";

    this.root.innerHTML = `
      <div class="panel-title">Imágenes</div>
      <div class="panel-section row">
        <input type="file" id="image-file" accept="image/*" />
        <button id="image-upload" class="btn small">Subir</button>
      </div>
      <div class="panel-section">
        <div id="folder-breadcrumbs" class="breadcrumbs"></div>
      </div>
      <div class="panel-section">
        <div class="folder-grid" id="folder-grid"></div>
      </div>
      <div class="panel-section">
        <div class="image-grid" id="image-grid"></div>
      </div>
    `;

    const uploadBtn = this.root.querySelector("#image-upload");
    this.uploadBtn = uploadBtn;

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => this.handleUpload());
    }

    this.globalContextMenuHandler = (e) => {
      if (!this.root || !this.root.isConnected) return;
      const target = e.target;
      if (!this.root.contains(target)) return;
      if (
        target.closest(".folder-card") ||
        target.closest(".image-card") ||
        target.closest(".context-menu")
      ) {
        return;
      }
      e.preventDefault();
      this.showEmptyAreaContextMenu(e.clientX, e.clientY);
    };
    document.addEventListener("contextmenu", this.globalContextMenuHandler);

    this.refresh();
    return this.root;
  }

  /**
   * Creates a new folder.
   * @param {string|null} parentId
   * @returns {Object|null}
   */
  createFolderAt(parentId) {
    if (!this.projectStore.project) {
      showError("Carga o crea un proyecto primero.");
      return null;
    }
    const name = prompt("Nombre de la nueva carpeta:");
    if (!name) return null;
    if (this.projectStore.addImageFolder) {
      return this.projectStore.addImageFolder(name, parentId);
    } else if (this.projectStore.project) {
      const folder = {
        id: generateId("imgFolder"),
        name,
        parentId,
      };
      if (!this.projectStore.project.imageFolders) {
        this.projectStore.project.imageFolders = [];
      }
      this.projectStore.project.imageFolders.push(folder);
      this.projectStore.notify();
      return folder;
    }
    return null;
  }

  /**
   * Closes the context menu.
   */
  closeContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }

  /**
   * Attaches lifecycle to context menu.
   * @param {HTMLElement} menu
   */
  attachContextMenuLifecycle(menu) {
    document.body.appendChild(menu);
    this.contextMenu = menu;

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${parseInt(menu.style.left || "0", 10) - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${parseInt(menu.style.top || "0", 10) - rect.height}px`;
    }

    const onClickOutside = (ev) => {
      if (!menu.contains(ev.target)) {
        this.closeContextMenu();
        document.removeEventListener("mousedown", onClickOutside);
        document.removeEventListener("contextmenu", onClickOutside);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("contextmenu", onClickOutside);
  }

  /**
   * Shows context menu for a folder.
   * @param {number} x
   * @param {number} y
   * @param {Object} folder
   */
  showFolderContextMenu(x, y, folder) {
    this.closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const renameItem = document.createElement("div");
    renameItem.className = "context-menu-item";
    renameItem.textContent = "Renombrar carpeta";
    renameItem.addEventListener("click", () => {
      const newName = prompt("Nuevo nombre de la carpeta:", folder.name);
      if (newName && newName.trim()) {
        if (this.projectStore.renameImageFolder) {
          this.projectStore.renameImageFolder(folder.id, newName.trim());
        } else if (
          this.projectStore.project &&
          this.projectStore.project.imageFolders
        ) {
          const f = this.projectStore.project.imageFolders.find(
            (it) => it.id === folder.id
          );
          if (f) {
            f.name = newName.trim();
            this.projectStore.notify();
          }
        }
      }
      this.closeContextMenu();
    });
    menu.appendChild(renameItem);

    const deleteItem = document.createElement("div");
    deleteItem.className = "context-menu-item";
    deleteItem.textContent = "Eliminar carpeta";
    deleteItem.addEventListener("click", () => {
      if (
        confirm(
          `¿Eliminar carpeta "${folder.name}" y mover sus imágenes a la raíz?`
        )
      ) {
        if (this.projectStore.deleteImageFolder) {
          this.projectStore.deleteImageFolder(folder.id);
        } else if (this.projectStore.project) {
          const folders = this.projectStore.project.imageFolders || [];
          const images = this.projectStore.project.images || [];
          const collectIds = new Set();
          const stack = [folder.id];
          while (stack.length > 0) {
            const current = stack.pop();
            if (!current || collectIds.has(current)) continue;
            collectIds.add(current);
            folders
              .filter((f) => f.parentId === current)
              .forEach((child) => stack.push(child.id));
          }
          images.forEach((img) => {
            if (img.folderId && collectIds.has(img.folderId)) {
              img.folderId = null;
            }
          });
          this.projectStore.project.imageFolders = folders.filter(
            (f) => !collectIds.has(f.id)
          );
          this.projectStore.notify();
        }
      }
      this.closeContextMenu();
    });
    menu.appendChild(deleteItem);

    this.attachContextMenuLifecycle(menu);
  }

  /**
   * Shows context menu for empty area.
   * @param {number} x
   * @param {number} y
   */
  showEmptyAreaContextMenu(x, y) {
    this.closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const createItem = document.createElement("div");
    createItem.className = "context-menu-item";
    createItem.textContent = "Nueva carpeta";
    createItem.addEventListener("click", () => {
      const parentId = this.currentFolderId || null;
      this.createFolderAt(parentId);
      this.closeContextMenu();
    });
    menu.appendChild(createItem);

    this.attachContextMenuLifecycle(menu);
  }

  /**
   * Moves image to a folder.
   * @param {Object} img
   * @param {string|null} folderId
   */
  setImageFolderForImage(img, folderId) {
    const finalId = folderId || null;
    if (this.projectStore.setImageFolderForImage) {
      this.projectStore.setImageFolderForImage(img.id, finalId);
    } else {
      img.folderId = finalId;
      this.projectStore.notify();
    }
  }

  /**
   * Shows context menu for an image.
   * @param {number} x
   * @param {number} y
   * @param {Object} img
   * @param {Array} folderOptions
   * @param {string} imageUrl
   */
  showImageContextMenu(x, y, img, folderOptions, imageUrl) {
    this.closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const openItem = document.createElement("div");
    openItem.className = "context-menu-item";
    openItem.textContent = "Ver imagen";
    openItem.addEventListener("click", () => {
      this.openImagePreview(imageUrl, img.name);
      this.closeContextMenu();
    });
    menu.appendChild(openItem);

    const moveRootItem = document.createElement("div");
    moveRootItem.className = "context-menu-item";
    moveRootItem.textContent = "Mover a (Raíz)";
    moveRootItem.addEventListener("click", () => {
      this.setImageFolderForImage(img, null);
      this.closeContextMenu();
    });
    menu.appendChild(moveRootItem);

    const createAndMoveItem = document.createElement("div");
    createAndMoveItem.className = "context-menu-item";
    createAndMoveItem.textContent = "Nueva carpeta y mover aquí";
    createAndMoveItem.addEventListener("click", () => {
      const parentId = this.currentFolderId || null;
      const folder = this.createFolderAt(parentId);
      if (folder && folder.id) {
        this.setImageFolderForImage(img, folder.id);
      }
      this.closeContextMenu();
    });
    menu.appendChild(createAndMoveItem);

    const divider = document.createElement("div");
    divider.className = "context-menu-divider";
    menu.appendChild(divider);

    folderOptions.forEach((opt) => {
      const item = document.createElement("div");
      item.className = "context-menu-item";
      item.textContent = `Mover a ${opt.label}`;
      item.addEventListener("click", () => {
        this.setImageFolderForImage(img, opt.id);
        this.closeContextMenu();
      });
      menu.appendChild(item);
    });

    this.attachContextMenuLifecycle(menu);
  }

  /**
   * Opens image preview modal.
   * @param {string} imageUrl
   * @param {string} name
   */
  openImagePreview(imageUrl, name) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const content = document.createElement("div");
    content.className = "overlay-content image-preview-modal";

    const header = document.createElement("div");
    header.className = "overlay-header";

    const title = document.createElement("div");
    title.textContent = name || "Imagen";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn small";
    closeBtn.textContent = "Cerrar";
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "overlay-body image-preview-body";

    const imgEl = document.createElement("img");
    imgEl.className = "image-preview-img";
    imgEl.src = imageUrl;

    body.appendChild(imgEl);

    content.appendChild(header);
    content.appendChild(body);
    overlay.appendChild(content);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }

  /**
   * Handles image upload.
   */
  async handleUpload() {
    if (!this.projectStore.project) {
      showError("Carga o crea un proyecto primero.");
      return;
    }
    const input = this.root.querySelector("#image-file");
    if (!input.files || input.files.length === 0) {
      showError("Selecciona un archivo de imagen.");
      return;
    }
    const file = input.files[0];
    try {
      if (this.uploadBtn) {
        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = "Subiendo...";
      }
      const asset = await this.apiClient.uploadImage(
        this.projectStore.project.id,
        file
      );
      const folderId = this.currentFolderId || null;
      if (folderId) {
        asset.folderId = folderId;
      }
      this.projectStore.addImageAsset(asset);
      input.value = "";
      showInfo("Imagen subida correctamente.");
    } catch (err) {
      console.error("Error al subir imagen", err);
      showError("Error al subir imagen.");
    } finally {
      if (this.uploadBtn) {
        this.uploadBtn.disabled = false;
        this.uploadBtn.textContent = "Subir";
      }
    }
  }

  /**
   * Refreshes the gallery view.
   */
  refresh() {
    if (!this.root || !this.root.isConnected) return;
    const grid = this.root.querySelector("#image-grid");
    const folderGrid = this.root.querySelector("#folder-grid");
    const breadcrumbsEl = this.root.querySelector("#folder-breadcrumbs");
    if (!grid || !folderGrid || !breadcrumbsEl) return;

    grid.innerHTML = "";
    folderGrid.innerHTML = "";
    breadcrumbsEl.innerHTML = "";

    if (!this.projectStore.project) {
      grid.innerHTML =
        '<div class="muted">Carga o crea un proyecto para añadir imágenes.</div>';
      return;
    }

    const projectId = this.projectStore.project.id;
    const folders = this.projectStore.imageFolders || [];
    const images = this.projectStore.images || [];

    // Asegurar que la carpeta actual es válida
    if (this.currentFolderId) {
      const exists = folders.some((f) => f.id === this.currentFolderId);
      if (!exists) {
        this.currentFolderId = null;
      }
    }

    // Breadcrumbs
    const rootCrumb = document.createElement("span");
    rootCrumb.className = "breadcrumb-item";
    if (!this.currentFolderId) {
      rootCrumb.classList.add("active");
    }
    rootCrumb.textContent = "Raíz";
    rootCrumb.addEventListener("click", () => {
      if (this.currentFolderId !== null) {
        this.currentFolderId = null;
        this.refresh();
      }
    });
    breadcrumbsEl.appendChild(rootCrumb);

    const pathFolders = [];
    let walkId = this.currentFolderId;
    while (walkId) {
      const folder = folders.find((f) => f.id === walkId);
      if (!folder) break;
      pathFolders.unshift(folder);
      walkId = folder.parentId || null;
    }

    pathFolders.forEach((folder) => {
      const sep = document.createElement("span");
      sep.textContent = " / ";
      breadcrumbsEl.appendChild(sep);
      const crumb = document.createElement("span");
      crumb.className = "breadcrumb-item";
      if (folder.id === this.currentFolderId) {
        crumb.classList.add("active");
      }
      crumb.textContent = folder.name;
      crumb.addEventListener("click", () => {
        if (this.currentFolderId !== folder.id) {
          this.currentFolderId = folder.id;
          this.refresh();
        }
      });
      breadcrumbsEl.appendChild(crumb);
    });

    // Carpetas dentro de la carpeta actual
    const currentId = this.currentFolderId || null;
    const subFolders = folders.filter(
      (f) => (f.parentId || null) === currentId
    );

    subFolders.forEach((folder) => {
      const card = document.createElement("div");
      card.className = "folder-card";

      const nameDiv = document.createElement("div");
      nameDiv.className = "folder-card-name";
      nameDiv.textContent = folder.name;

      card.appendChild(nameDiv);

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentFolderId = folder.id;
        this.refresh();
      });

      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showFolderContextMenu(e.clientX, e.clientY, folder);
      });

      folderGrid.appendChild(card);
    });

    // Opciones de carpeta para mover imágenes (lista plana con ruta)
    const folderOptions = folders.map((f) => {
      const names = [f.name];
      let parentId = f.parentId || null;
      while (parentId) {
        const parent = folders.find((pf) => pf.id === parentId);
        if (!parent) break;
        names.unshift(parent.name);
        parentId = parent.parentId || null;
      }
      return {
        id: f.id,
        label: names.join(" / "),
      };
    });
    folderOptions.sort((a, b) => a.label.localeCompare(b.label, "es"));

    // Imágenes dentro de la carpeta actual
    images
      .filter((img) => (img.folderId || null) === currentId)
      .forEach((img) => {
        const card = document.createElement("div");
        card.className = "image-card";

        const imgEl = document.createElement("img");
        imgEl.className = "thumbnail";
        const apiOrigin = new URL(this.apiClient.baseUrl).origin;
        const imgUrl = `${apiOrigin}/projects/${encodeURIComponent(
          projectId
        )}/images/${encodeURIComponent(img.fileName)}`;
        imgEl.src = imgUrl;

        const nameDiv = document.createElement("div");
        nameDiv.className = "image-card-name";
        nameDiv.textContent = img.name;

        const delBtn = document.createElement("button");
        delBtn.className = "btn small";
        delBtn.style.marginTop = "4px";
        delBtn.textContent = "Eliminar";
        delBtn.addEventListener("click", async () => {
          if (confirm(`¿Eliminar imagen "${img.name}"?`)) {
            try {
              await this.apiClient.deleteImage(projectId, img.id);
              this.projectStore.removeImageAsset(img.id);
            } catch (err) {
              console.error("Error al eliminar imagen", err);
              showError("Error al eliminar imagen.");
            }
          }
        });

        card.appendChild(imgEl);
        card.appendChild(nameDiv);
        card.appendChild(delBtn);

        card.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showImageContextMenu(e.clientX, e.clientY, img, folderOptions, imgUrl);
        });

        grid.appendChild(card);
      });
  }

  /**
   * Cleans up.
   */
  destroy() {
    this.closeContextMenu();
    if (this.globalContextMenuHandler) {
      document.removeEventListener("contextmenu", this.globalContextMenuHandler);
      this.globalContextMenuHandler = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
