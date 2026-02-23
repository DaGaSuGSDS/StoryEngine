export class CharactersTab {
  /**
   * @param {Object} projectStore
   * @param {Object} apiClient
   */
  constructor(projectStore, apiClient) {
    this.projectStore = projectStore;
    this.apiClient = apiClient || null;
    this.root = null;
    this.selectedCharacterId = null;
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
    this.root.style.display = "flex";
    this.root.style.width = "100%";
    this.root.style.height = "100%";

    const leftPanel = document.createElement("div");
    leftPanel.className = "panel";
    leftPanel.style.width = "220px";
    leftPanel.innerHTML = `
      <div class="panel-title">Personajes</div>
      <div class="panel-section">
        <ul class="list" id="char-list"></ul>
      </div>
      <div class="panel-section row">
        <button id="char-add" class="btn small">Añadir</button>
        <button id="char-remove" class="btn small">Eliminar</button>
      </div>
    `;

    const rightPanel = document.createElement("div");
    rightPanel.className = "panel panel-right";
    rightPanel.style.flex = "1";
    rightPanel.innerHTML = `
      <div class="panel-title">Detalles personaje</div>
      <div id="char-details"></div>
    `;

    this.root.appendChild(leftPanel);
    this.root.appendChild(rightPanel);

    this.attachHandlers(leftPanel, rightPanel);
    this.refresh();
    return this.root;
  }

  /**
   * Attaches handlers to buttons.
   * @param {HTMLElement} leftPanel
   * @param {HTMLElement} rightPanel
   */
  attachHandlers(leftPanel, rightPanel) {
    leftPanel.querySelector("#char-add").addEventListener("click", () => {
      this.projectStore.addCharacter();
    });
    leftPanel
      .querySelector("#char-remove")
      .addEventListener("click", () => {
        if (!this.selectedCharacterId) return;
        if (confirm("¿Eliminar personaje seleccionado?")) {
          this.projectStore.removeCharacter(this.selectedCharacterId);
          this.selectedCharacterId = null;
        }
      });
  }

  /**
   * Refreshes the view.
   */
  refresh() {
    if (!this.root) return;
    this.renderCharacterList();
    this.renderCharacterDetails();
  }

  /**
   * Cleans up subscriptions.
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Renders the list of characters.
   */
  renderCharacterList() {
    const ul = this.root.querySelector("#char-list");
    if (!ul) return;
    ul.innerHTML = "";
    const chars = this.projectStore.characters;
    chars.forEach((c) => {
      const li = document.createElement("li");
      li.className = "list-item";
      if (c.id === this.selectedCharacterId) {
        li.classList.add("selected");
      }
      li.textContent = c.name;
      li.addEventListener("click", () => {
        this.selectedCharacterId = c.id;
        this.refresh();
      });
      ul.appendChild(li);
    });
  }

  /**
   * Renders the details of selected character.
   */
  renderCharacterDetails() {
    const container = this.root.querySelector("#char-details");
    if (!container) return;
    container.innerHTML = "";

    const character = this.projectStore.characters.find(
      (c) => c.id === this.selectedCharacterId
    );
    if (!character) {
      container.innerHTML =
        '<div class="muted">Selecciona un personaje o crea uno nuevo.</div>';
      return;
    }

    const root = document.createElement("div");
    root.innerHTML = `
      <div class="panel-section">
        <label>Nombre</label>
        <input id="char-name" value="${character.name}" />
      </div>
      <div class="panel-section">
        <div class="row-space-between">
          <span>Estados</span>
          <button id="state-add" class="btn small">Añadir estado</button>
        </div>
        <table class="table" id="states-table">
          <thead>
            <tr><th>Nombre</th><th>Imagen</th><th>Altura (%)</th><th>Vista</th><th></th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="panel-section">
        <div class="row-space-between">
          <span>Variables</span>
          <button id="var-add" class="btn small">Añadir variable</button>
        </div>
        <table class="table" id="vars-table">
          <thead>
            <tr><th>Nombre</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    container.appendChild(root);

    const nameInput = root.querySelector("#char-name");
    nameInput.addEventListener("change", () => {
      character.name = nameInput.value;
      this.projectStore.notify();
    });

    const statesTbody = root.querySelector("#states-table tbody");
    character.states.forEach((s, index) => {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      const nameInput = document.createElement("input");
      nameInput.dataset.idx = index;
      nameInput.value = s.name;
      nameInput.addEventListener("change", () => {
        const idx = parseInt(nameInput.dataset.idx, 10);
        character.states[idx].name = nameInput.value;
        this.projectStore.notify();
      });
      nameTd.appendChild(nameInput);

      const imageTd = document.createElement("td");
      const imageSelect = document.createElement("select");
      imageSelect.dataset.idx = index;
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "(ninguna)";
      imageSelect.appendChild(emptyOpt);
      this.projectStore.images.forEach((img) => {
        const opt = document.createElement("option");
        opt.value = img.id;
        opt.textContent = img.name;
        imageSelect.appendChild(opt);
      });
      imageSelect.value = s.imageId || "";
      imageSelect.addEventListener("change", () => {
        const idx = parseInt(imageSelect.dataset.idx, 10);
        const val = imageSelect.value;
        character.states[idx].imageId = val || null;
        this.projectStore.notify();
      });
      imageTd.appendChild(imageSelect);

      const heightTd = document.createElement("td");
      const heightInput = document.createElement("input");
      heightInput.type = "range";
      heightInput.min = "0";
      heightInput.max = "100";
      heightInput.step = "1";
      heightInput.dataset.idx = index;
      heightInput.value = this.clampHeightPercent(s.heightPercent);
      heightInput.addEventListener("input", () => {
        const idx = parseInt(heightInput.dataset.idx, 10);
        const nextValue = this.clampHeightPercent(heightInput.value);
        heightValue.textContent = `${nextValue}%`;
        character.states[idx].heightPercent = nextValue;
      });
      heightInput.addEventListener("change", () => {
        const idx = parseInt(heightInput.dataset.idx, 10);
        const nextValue = this.clampHeightPercent(heightInput.value);
        character.states[idx].heightPercent = nextValue;
        this.projectStore.notify();
      });
      const heightValue = document.createElement("div");
      heightValue.className = "state-height-value";
      heightValue.textContent = `${this.clampHeightPercent(s.heightPercent)}%`;
      heightTd.appendChild(heightInput);
      heightTd.appendChild(heightValue);

      const previewTd = document.createElement("td");
      const previewBtn = document.createElement("button");
      previewBtn.className = "btn small";
      previewBtn.textContent = "Ver";
      previewBtn.dataset.idx = index;
      previewBtn.addEventListener("click", () => {
        const idx = parseInt(previewBtn.dataset.idx, 10);
        this.openStatePreview(character, character.states[idx]);
      });
      previewTd.appendChild(previewBtn);

      const actionsTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "btn small";
      delBtn.textContent = "X";
      delBtn.dataset.idx = index;
      delBtn.addEventListener("click", () => {
        const idx = parseInt(delBtn.dataset.idx, 10);
        character.states.splice(idx, 1);
        this.projectStore.notify();
      });
      actionsTd.appendChild(delBtn);

      tr.appendChild(nameTd);
      tr.appendChild(imageTd);
      tr.appendChild(heightTd);
      tr.appendChild(previewTd);
      tr.appendChild(actionsTd);
      statesTbody.appendChild(tr);
    });

    const varsTbody = root.querySelector("#vars-table tbody");
    character.variables.forEach((v, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input data-idx="${index}" data-field="name" value="${v.name}" /></td>
        <td><input data-idx="${index}" data-field="value" type="number" value="${v.value
        }" /></td>
        <td><button data-idx="${index}" class="btn small">X</button></td>
      `;
      varsTbody.appendChild(tr);
    });

    varsTbody.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = parseInt(input.dataset.idx, 10);
        const field = input.dataset.field;
        if (field === "value") {
          character.variables[idx][field] = parseFloat(input.value || "0");
        } else {
          character.variables[idx][field] = input.value;
        }
        this.projectStore.notify();
      });
    });
    varsTbody.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        character.variables.splice(idx, 1);
        this.projectStore.notify();
      });
    });

    root.querySelector("#state-add").addEventListener("click", () => {
      character.states.push({
        name: "Nuevo estado",
        imageId: "",
        heightPercent: this.clampHeightPercent(80),
      });
      this.projectStore.notify();
    });
    root.querySelector("#var-add").addEventListener("click", () => {
      character.variables.push({ name: "var", value: 0 });
      this.projectStore.notify();
    });
  }

  /**
   * Clamps height percentage between 0 and 100.
   * @param {string|number} rawValue
   * @returns {number}
   */
  clampHeightPercent(rawValue) {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) {
      return 80;
    }
    return Math.min(100, Math.max(0, parsed));
  }

  /**
   * Gets image URL for an asset ID.
   * @param {string} imageId
   * @returns {string|null}
   */
  getImageUrl(imageId) {
    if (!imageId || !this.projectStore.project || !this.apiClient) return null;
    const asset = this.projectStore.images.find((img) => img.id === imageId);
    if (!asset) return null;
    const origin = new URL(this.apiClient.baseUrl).origin;
    return `${origin}/projects/${encodeURIComponent(
      this.projectStore.project.id
    )}/images/${encodeURIComponent(asset.fileName)}`;
  }

  /**
   * Opens a preview modal for character state.
   * @param {Object} character
   * @param {Object} state
   */
  openStatePreview(character, state) {
    if (!state) return;
    const heightPercent = this.clampHeightPercent(state.heightPercent);
    const settings = this.projectStore.project?.settings || {};
    const baseW = settings.windowWidth || 1280;
    const baseH = settings.windowHeight || 720;
    const approxPx = Math.round((heightPercent / 100) * baseH);
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const content = document.createElement("div");
    content.className = "overlay-content state-preview-modal";

    const header = document.createElement("div");
    header.className = "overlay-header";

    const title = document.createElement("div");
    const stateName = state.name || "Estado";
    const charName = character?.name || "Personaje";
    title.textContent = `${charName} — ${stateName}`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn small";
    closeBtn.textContent = "Cerrar";
    closeBtn.addEventListener("click", () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "overlay-body state-preview-body";

    const info = document.createElement("div");
    info.className = "state-preview-info";
    info.textContent = `Altura configurada: ${heightPercent}% (~${approxPx}px) sobre una ventana de ${baseW}x${baseH}.`;

    const stage = document.createElement("div");
    stage.className = "state-preview-stage";
    stage.style.aspectRatio = `${baseW} / ${baseH}`;

    const imageUrl = this.getImageUrl(state.imageId);
    if (imageUrl) {
      const imgEl = document.createElement("img");
      imgEl.className = "state-preview-character";
      imgEl.src = imageUrl;
      imgEl.alt = state.name || "Estado";
      imgEl.style.height = `${heightPercent}%`;
      stage.appendChild(imgEl);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "state-preview-placeholder";
      placeholder.style.height = `${heightPercent}%`;
      placeholder.textContent = "Sin imagen";
      stage.appendChild(placeholder);
    }

    const helper = document.createElement("div");
    helper.className = "state-preview-helper";
    helper.textContent =
      "La imagen se ajusta a este porcentaje del alto visible y se alinea a la base de la pantalla.";

    body.appendChild(info);
    body.appendChild(stage);
    body.appendChild(helper);

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
}
