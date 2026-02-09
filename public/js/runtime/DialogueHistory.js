/**
 * DialogueHistory - Sistema de historial de diálogos (Backlog)
 * Permite a los jugadores revisar diálogos anteriores
 */
export class DialogueHistory {
  constructor(maxEntries = 100) {
    this.history = [];
    this.maxEntries = maxEntries;
    this.modal = null;
    this.closeHandler = null;
  }

  /**
   * Añade una entrada al historial
   * @param {string} characterName - Nombre del personaje
   * @param {string} text - Texto del diálogo
   */
  addEntry(characterName, text) {
    if (!text || text.trim() === "") return;

    this.history.push({
      character: characterName,
      text: text,
      timestamp: Date.now(),
    });

    // Limitar el tamaño del historial
    if (this.history.length > this.maxEntries) {
      this.history.shift();
    }
  }

  /**
   * Muestra el modal del historial
   * @param {string} nameColor - Color para los nombres de personajes
   */
  show(nameColor = "#4fc3f7") {
    if (this.modal) {
      // Ya está abierto
      return;
    }

    // Crear overlay
    const overlay = document.createElement("div");
    overlay.className = "backlog-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Crear modal
    const modal = document.createElement("div");
    modal.className = "backlog-modal";
    modal.style.cssText = `
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      height: 80%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement("h2");
    title.textContent = "Historial de Diálogos";
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      color: #ffffff;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = "transparent";
    };
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content (scrollable)
    const content = document.createElement("div");
    content.className = "backlog-content";
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    `;

    if (this.history.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No hay diálogos en el historial aún.";
      empty.style.cssText = `
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        padding: 40px 20px;
      `;
      content.appendChild(empty);
    } else {
      // Mostrar historial en orden (más antiguo primero)
      this.history.forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.style.cssText = `
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        `;

        const charName = document.createElement("div");
        charName.textContent = entry.character;
        charName.style.cssText = `
          font-weight: 600;
          color: ${nameColor};
          margin-bottom: 4px;
        `;

        const textDiv = document.createElement("div");
        textDiv.textContent = entry.text;
        textDiv.style.cssText = `
          color: #ffffff;
          line-height: 1.6;
        `;

        entryDiv.appendChild(charName);
        entryDiv.appendChild(textDiv);
        content.appendChild(entryDiv);
      });

      // Auto-scroll al final
      setTimeout(() => {
        content.scrollTop = content.scrollHeight;
      }, 0);
    }

    // Footer con instrucciones
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      text-align: center;
    `;
    footer.textContent = "Presiona ESC o B para cerrar";

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Event listeners
    const closeHandler = (e) => {
      if (e.key === "Escape" || e.key === "b" || e.key === "B") {
        this.hide();
      }
    };
    document.addEventListener("keydown", closeHandler);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Guardar referencias
    this.modal = overlay;
    this.closeHandler = closeHandler;

    document.body.appendChild(overlay);
  }

  /**
   * Oculta el modal del historial
   */
  hide() {
    if (!this.modal) return;

    if (this.closeHandler) {
      document.removeEventListener("keydown", this.closeHandler);
    }
    this.modal.remove();
    this.modal = null;
    this.closeHandler = null;
  }

  /**
   * Limpia el historial
   */
  clear() {
    this.history = [];
  }

  /**
   * Serializa el historial para guardado
   */
  toJSON() {
    return {
      history: this.history,
    };
  }

  /**
   * Restaura el historial desde JSON
   */
  static fromJSON(data) {
    const history = new DialogueHistory();
    if (data && Array.isArray(data.history)) {
      history.history = data.history;
    }
    return history;
  }
}

