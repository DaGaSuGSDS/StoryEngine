/**
 * SaveLoadUI - Interfaz de usuario para guardar y cargar partidas
 */
export class SaveLoadUI {
  constructor(saveManager, storyEngine) {
    this.saveManager = saveManager;
    this.storyEngine = storyEngine;
    this.modal = null;
    this.isOpen = false;
    this.mode = null; // 'select-slot', 'load'
    this.onSlotSelected = null; // Callback cuando se selecciona slot
    this.forceNewGameSelection = false; // Selección de slot solo para nueva partida
    this.slotSelectorTitle = null;
    this.onGameLoaded = null; // Callback opcional tras cargar/restaurar
  }

  /**
   * Muestra el selector de slot al inicio del juego
   * @param {Function} onSelected - Callback que recibe el slot seleccionado
   */
  async showSlotSelector(onSelected, options = {}) {
    this.mode = "select-slot";
    this.onSlotSelected = onSelected;
    this.forceNewGameSelection = options.forceNewGame || false;
    this.slotSelectorTitle =
      options.title ||
      (this.forceNewGameSelection
        ? "Elige un slot para la nueva partida"
        : "Seleccionar Slot de Guardado");
    await this.showModal();
  }

  /**
   * Muestra el modal de carga
   */
  async showLoadModal() {
    this.mode = "load";
    await this.showModal();
  }

  /**
   * Muestra el modal
   */
  async showModal() {
    if (this.isOpen) return;

    this.createModal();
    await this.refreshSlots();
    this.isOpen = true;
  }

  /**
   * Cierra el modal
   */
  closeModal() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
    this.isOpen = false;
    this.forceNewGameSelection = false;
    this.slotSelectorTitle = null;
  }

  /**
   * Crea la estructura del modal
   */
  createModal() {
    this.modal = document.createElement("div");
    this.modal.className = "save-load-overlay";

    let title = "Cargar Partida";
    let showCloseBtn = true;

    if (this.mode === "select-slot") {
      title = this.slotSelectorTitle || "Seleccionar Slot de Guardado";
      showCloseBtn = false; // No se puede cerrar sin seleccionar
    }

    this.modal.innerHTML = `
      <div class="save-load-modal">
        <div class="save-load-header">
          <h2>${title}</h2>
          ${
            showCloseBtn
              ? '<button class="btn small close-btn" type="button">&times;</button>'
              : ""
          }
        </div>
        <div class="save-load-content">
          <div id="save-slots-container" class="save-slots-container"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Event listeners
    const closeBtn = this.modal.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }

    if (showCloseBtn) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * Refresca la lista de slots de guardado
   */
  async refreshSlots() {
    if (!this.saveManager.isAvailable()) {
      this.showError("Sistema de guardado no disponible");
      return;
    }

    const container = this.modal.querySelector("#save-slots-container");
    container.innerHTML = "<p>Cargando...</p>";

    try {
      const saves = await this.saveManager.listSaves();
      container.innerHTML = "";

      saves.forEach((save) => {
        const slotElement = this.createSlotElement(save);
        container.appendChild(slotElement);
      });
    } catch (err) {
      console.error("Error loading saves:", err);
      container.innerHTML = "<p>Error al cargar los guardados</p>";
    }
  }

  /**
   * Crea el elemento visual de un slot
   */
  createSlotElement(save) {
    const slot = document.createElement("div");
    slot.className = "save-slot";
    const forceNewGame = this.forceNewGameSelection && this.mode === "select-slot";

    if (save.empty) {
      slot.classList.add("empty");
      slot.innerHTML = `
        <div class="save-slot-header">
          <span class="save-slot-number">Slot ${save.slotNumber}</span>
        </div>
        <div class="save-slot-body">
          <p class="save-slot-empty">Vacío</p>
        </div>
        <div class="save-slot-actions">
          ${
            this.mode === "select-slot"
              ? ""
              : `<button class="btn small" disabled>Vacío</button>`
          }
        </div>
      `;
    } else {
      slot.innerHTML = `
        <div class="save-slot-header">
          <span class="save-slot-number">Slot ${save.slotNumber}</span>
          <span class="save-slot-date">${save.date}</span>
        </div>
        <div class="save-slot-body">
          <p class="save-slot-scene">${save.scenePreview}</p>
          <p class="save-slot-time">Tiempo: ${save.playTime}</p>
          ${
            forceNewGame
              ? '<p class="save-slot-warning">Este slot será sobrescrito al empezar una nueva partida.</p>'
              : ""
          }
        </div>
        <div class="save-slot-actions">
          <button class="btn small delete-btn" data-slot="${save.slotNumber}">Borrar</button>
        </div>
      `;
    }

    // Event listeners
    // El slot completo es clickeable (excepto el botón Borrar)
    slot.style.cursor = "pointer";

    // Agregar evento click al slot (excepto en el elemento delete-btn)
    slot.addEventListener("click", (e) => {
      // No hacer nada si se hace clic en el botón Borrar
      if (e.target.classList.contains("delete-btn")) {
        return;
      }

      if (this.mode === "select-slot") {
        if (save.empty) {
          this.handleSlotSelection(save.slotNumber, false);
        } else {
          this.handleSlotSelection(save.slotNumber, true);
        }
      } else {
        // Modo carga
        if (!save.empty) {
          this.handleLoad(save.slotNumber);
        }
      }
    });

    const deleteBtn = slot.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Evitar que el click se propague al slot
        this.handleDelete(save.slotNumber);
      });
    }

    return slot;
  }

  /**
   * Maneja la selección de un slot
   */
  async handleSlotSelection(slotNumber, hasExistingSave) {
    const forceNewGame = this.forceNewGameSelection && this.mode === "select-slot";

    if (hasExistingSave && !forceNewGame) {
      // Si tiene guardado y no es forzar nueva partida, cargar la partida
      try {
        const gameState = await this.saveManager.loadGame(slotNumber);
        if (!gameState) {
          this.showError("No se pudo cargar la partida");
          return;
        }

        this.closeModal();
        if (this.onSlotSelected) {
          this.onSlotSelected(slotNumber, gameState);
        }
      } catch (err) {
        console.error("Error loading game:", err);
        this.showError("Error al cargar la partida");
      }
      return;
    }

    if (hasExistingSave && forceNewGame) {
      const confirmOverwrite = window.confirm(
        "Este slot ya tiene una partida guardada. ¿Sobrescribirla con una nueva?"
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    // Nueva partida (slot vacío o forzada)
    this.closeModal();
    if (this.onSlotSelected) {
      this.onSlotSelected(slotNumber, null);
    }
  }

  /**
   * Maneja la carga de un slot
   */
  async handleLoad(slotNumber) {
    try {
      const gameState = await this.saveManager.loadGame(slotNumber);
      if (!gameState) {
        this.showError("No se pudo cargar la partida");
        return;
      }

      const container =
        this.storyEngine.containerElement ||
        document.getElementById("play-view");
      await this.storyEngine.restoreGameState(gameState, container);
      if (typeof this.onGameLoaded === "function") {
        this.onGameLoaded();
      }
      this.showSuccess("Partida cargada correctamente");
      this.closeModal();
    } catch (err) {
      console.error("Error loading game:", err);
      this.showError("Error al cargar la partida");
    }
  }

  /**
   * Maneja la eliminación de un guardado
   */
  async handleDelete(slotNumber) {
    if (!confirm("¿Estás seguro de que quieres borrar este guardado?")) {
      return;
    }

    try {
      await this.saveManager.deleteSave(slotNumber);
      this.showSuccess("Guardado eliminado");
      await this.refreshSlots();
    } catch (err) {
      console.error("Error deleting save:", err);
      this.showError("Error al eliminar el guardado");
    }
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message) {
    alert(message); // TODO: Reemplazar con un sistema de notificaciones mejor
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message) {
    console.log(message); // TODO: Reemplazar con un sistema de notificaciones mejor
  }
}
