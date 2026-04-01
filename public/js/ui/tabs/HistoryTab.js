/**
 * HistoryTab.js
 * Tab for git version history, branch management and merge with conflict resolution.
 */

import { showError, showInfo } from "../notifications.js";

const COLLECTION_LABELS = {
  scenes: "Escenas",
  characters: "Personajes",
  flags: "Flags",
  images: "Imágenes",
  audio: "Audio",
};

export class HistoryTab {
  constructor(projectStore, apiClient) {
    this.projectStore = projectStore;
    this.apiClient = apiClient;
    this._el = null;
    this._mergeAnalysis = null;
    this._mergeResolutions = {};
  }

  render() {
    const el = document.createElement("div");
    el.className = "history-tab";
    el.innerHTML = `
      <div class="history-layout">
        <div class="history-sidebar">
          <div class="history-section">
            <h3 class="history-section-title">Ramas</h3>
            <div id="history-current-branch" class="history-current-branch">
              <span class="branch-icon">⎇</span>
              <span id="history-branch-name" class="branch-name">—</span>
            </div>
            <div id="history-branch-list" class="history-branch-list"></div>
            <div class="history-new-branch-form">
              <input id="history-branch-input" type="text" class="history-input"
                placeholder="Nueva rama..." maxlength="60" />
              <button id="history-branch-create-btn" class="btn small">Crear</button>
            </div>
          </div>
          <div class="history-section">
            <h3 class="history-section-title">Merge</h3>
            <p class="history-hint">Trae los cambios de otra rama a la rama actual.</p>
            <select id="history-merge-source" class="history-select">
              <option value="">Elegir rama origen...</option>
            </select>
            <button id="history-merge-analyze-btn" class="btn history-btn" style="margin-top:8px">
              Analizar cambios
            </button>
          </div>
          <div class="history-section">
            <h3 class="history-section-title">Guardar punto</h3>
            <div class="history-commit-form">
              <input id="history-commit-input" type="text" class="history-input"
                placeholder="ej: Terminé el cold open del día 1" maxlength="100" />
              <button id="history-commit-btn" class="btn primary history-btn">Guardar punto</button>
            </div>
          </div>
          <div class="history-section">
            <h3 class="history-section-title">Cambios pendientes</h3>
            <div id="history-pending" class="history-pending">
              <span class="history-loading">Cargando...</span>
            </div>
          </div>
        </div>
        <div class="history-main">
          <div class="history-header">
            <h3 class="history-section-title">Historial de versiones</h3>
            <button id="history-refresh-btn" class="btn small history-refresh" title="Actualizar">↻</button>
          </div>
          <div id="history-list" class="history-list">
            <span class="history-loading">Cargando historial...</span>
          </div>
        </div>
      </div>

      <div id="history-restore-modal" class="history-modal hidden">
        <div class="history-modal-box">
          <h3>¿Restaurar esta versión?</h3>
          <p id="history-modal-desc" class="history-modal-desc"></p>
          <p class="history-modal-warn">⚠️ El estado actual se guardará como commit antes de restaurar.</p>
          <div class="history-modal-actions">
            <button id="history-modal-cancel" class="btn">Cancelar</button>
            <button id="history-modal-confirm" class="btn primary">Restaurar</button>
          </div>
        </div>
      </div>

      <div id="history-merge-modal" class="history-modal hidden">
        <div class="history-modal-box history-merge-box">
          <div class="merge-header">
            <h3 id="merge-title">Merge</h3>
            <button id="merge-close-btn" class="btn small">✕</button>
          </div>
          <div id="merge-summary" class="merge-summary"></div>
          <div id="merge-conflicts-container" class="merge-conflicts-container"></div>
          <div class="history-modal-actions">
            <button id="merge-cancel-btn" class="btn">Cancelar</button>
            <button id="merge-apply-btn" class="btn primary" disabled>Aplicar merge</button>
          </div>
        </div>
      </div>
    `;
    this._el = el;
    this._bindEvents();
    this._loadAll();
    return el;
  }

  _bindEvents() {
    const el = this._el;
    el.querySelector("#history-refresh-btn").addEventListener("click", () => this._loadAll());
    el.querySelector("#history-commit-btn").addEventListener("click", () => this._handleManualCommit());
    el.querySelector("#history-commit-input").addEventListener("keydown", e => { if (e.key === "Enter") this._handleManualCommit(); });
    el.querySelector("#history-branch-create-btn").addEventListener("click", () => this._handleCreateBranch());
    el.querySelector("#history-branch-input").addEventListener("keydown", e => { if (e.key === "Enter") this._handleCreateBranch(); });
    el.querySelector("#history-merge-analyze-btn").addEventListener("click", () => this._handleAnalyzeMerge());
    el.querySelector("#history-modal-cancel").addEventListener("click", () => this._closeRestoreModal());
    el.querySelector("#history-modal-confirm").addEventListener("click", () => this._confirmRestore());
    el.querySelector("#merge-close-btn").addEventListener("click", () => this._closeMergeModal());
    el.querySelector("#merge-cancel-btn").addEventListener("click", () => this._closeMergeModal());
    el.querySelector("#merge-apply-btn").addEventListener("click", () => this._applyMerge());
  }

  async _loadAll() {
    if (!this._el) return;
    const project = this.projectStore.project;
    if (!project) { this._renderEmpty(); return; }
    await Promise.all([this._loadBranches(), this._loadHistory(), this._loadPending()]);
  }

  async _loadBranches() {
    const project = this.projectStore.project;
    try {
      const branches = await this.apiClient.listBranches(project.id);
      const current = branches.find(b => b.isCurrent);
      this._el.querySelector("#history-branch-name").textContent = current?.name || "—";
      const listEl = this._el.querySelector("#history-branch-list");
      const others = branches.filter(b => !b.isCurrent);
      if (others.length === 0) {
        listEl.innerHTML = `<p class="history-empty" style="font-size:11px;margin:4px 0">Sin otras ramas</p>`;
      } else {
        listEl.innerHTML = others.map(b => `
          <div class="branch-item">
            <span class="branch-item-name">${this._esc(b.name)}</span>
            <div class="branch-item-actions">
              <button class="btn small branch-switch-btn" data-name="${this._esc(b.name)}">Cambiar</button>
              <button class="btn small branch-delete-btn" data-name="${this._esc(b.name)}" title="Borrar">✕</button>
            </div>
          </div>
        `).join("");
        listEl.querySelectorAll(".branch-switch-btn").forEach(btn =>
          btn.addEventListener("click", () => this._handleSwitchBranch(btn.dataset.name)));
        listEl.querySelectorAll(".branch-delete-btn").forEach(btn =>
          btn.addEventListener("click", () => this._handleDeleteBranch(btn.dataset.name)));
      }
      const select = this._el.querySelector("#history-merge-source");
      const prev = select.value;
      select.innerHTML = `<option value="">Elegir rama origen...</option>` +
        others.map(b => `<option value="${this._esc(b.name)}">${this._esc(b.name)}</option>`).join("");
      if (prev) select.value = prev;
    } catch (err) { console.error("Error loading branches", err); }
  }

  async _handleCreateBranch() {
    const input = this._el.querySelector("#history-branch-input");
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const btn = this._el.querySelector("#history-branch-create-btn");
    btn.disabled = true;
    try {
      const result = await this.apiClient.createBranch(this.projectStore.project.id, name);
      input.value = "";
      showInfo(`Rama "${result.name}" creada y activa.`);
      await this._loadBranches();
      await this._loadHistory();
    } catch (err) { showError(err.message); }
    finally { btn.disabled = false; }
  }

  async _handleSwitchBranch(name) {
    if (!confirm(`¿Cambiar a la rama "${name}"?\n\nLos cambios pendientes se guardarán automáticamente.`)) return;
    try {
      await this.apiClient.switchBranch(this.projectStore.project.id, name);
      showInfo(`Cambiado a "${name}". Recarga el proyecto para ver los cambios.`);
      await this._loadAll();
    } catch (err) { showError(err.message); }
  }

  async _handleDeleteBranch(name) {
    if (!confirm(`¿Borrar la rama "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await this.apiClient.deleteBranch(this.projectStore.project.id, name);
      showInfo(`Rama "${name}" eliminada.`);
      await this._loadBranches();
    } catch (err) { showError(err.message); }
  }

  async _handleAnalyzeMerge() {
    const sourceBranch = this._el.querySelector("#history-merge-source").value;
    if (!sourceBranch) { showError("Elige una rama origen."); return; }
    const btn = this._el.querySelector("#history-merge-analyze-btn");
    btn.disabled = true;
    btn.textContent = "Analizando...";
    try {
      const analysis = await this.apiClient.analyzeMerge(this.projectStore.project.id, sourceBranch);
      this._mergeAnalysis = analysis;
      this._mergeResolutions = {};
      this._openMergeModal(analysis);
    } catch (err) { showError(err.message); }
    finally { btn.disabled = false; btn.textContent = "Analizar cambios"; }
  }

  _openMergeModal(analysis) {
    const modal = this._el.querySelector("#history-merge-modal");
    this._el.querySelector("#merge-title").textContent = `Merge: "${analysis.sourceBranch}" → "${analysis.targetBranch}"`;
    const hasConflicts = analysis.totalConflicts > 0;
    this._el.querySelector("#merge-summary").innerHTML = `
      <div class="merge-stat ${analysis.totalAutoAdded > 0 ? "good" : ""}">
        <strong>${analysis.totalAutoAdded}</strong> elemento${analysis.totalAutoAdded !== 1 ? "s" : ""} nuevos (se añaden automáticamente)
      </div>
      <div class="merge-stat ${hasConflicts ? "warn" : "good"}">
        <strong>${analysis.totalConflicts}</strong> conflicto${analysis.totalConflicts !== 1 ? "s" : ""} ${hasConflicts ? "que requieren tu decisión" : "— ¡sin conflictos!"}
      </div>
    `;
    const container = this._el.querySelector("#merge-conflicts-container");
    container.innerHTML = "";
    if (!hasConflicts) {
      container.innerHTML = `<p class="merge-no-conflicts">✓ No hay conflictos. El merge se puede aplicar directamente.</p>`;
    } else {
      for (const [key, diff] of Object.entries(analysis.collections)) {
        if (diff.conflicts.length === 0) continue;
        const section = document.createElement("div");
        section.className = "merge-collection-section";
        section.innerHTML = `<h4 class="merge-collection-title">${COLLECTION_LABELS[key] || key} (${diff.conflicts.length} conflicto${diff.conflicts.length !== 1 ? "s" : ""})</h4>`;
        diff.conflicts.forEach(conflict => section.appendChild(this._buildConflictItem(key, conflict)));
        container.appendChild(section);
      }
    }
    this._el.querySelector("#merge-apply-btn").disabled = hasConflicts;
    modal.classList.remove("hidden");
  }

  _buildConflictItem(collectionKey, conflict) {
    const el = document.createElement("div");
    el.className = "merge-conflict-item";
    const label = conflict.current.name || conflict.current.id || conflict.id;
    el.innerHTML = `
      <div class="conflict-header">
        <span class="conflict-label">${this._esc(label)}</span>
        <span class="conflict-id">ID: ${this._esc(conflict.id)}</span>
      </div>
      <div class="conflict-columns">
        <div class="conflict-col">
          <div class="conflict-col-header">Rama actual (${this._esc(this._mergeAnalysis?.targetBranch || "")})</div>
          <pre class="conflict-preview">${this._esc(this._truncateJson(JSON.stringify(conflict.current, null, 2)))}</pre>
          <button class="btn small conflict-choose-btn" data-choice="current">Usar esta versión</button>
        </div>
        <div class="conflict-col">
          <div class="conflict-col-header">Rama origen (${this._esc(this._mergeAnalysis?.sourceBranch || "")})</div>
          <pre class="conflict-preview">${this._esc(this._truncateJson(JSON.stringify(conflict.incoming, null, 2)))}</pre>
          <button class="btn small conflict-choose-btn" data-choice="incoming">Usar esta versión</button>
        </div>
      </div>
      <div class="conflict-resolution" id="res-${this._esc(collectionKey)}-${this._esc(conflict.id)}"></div>
    `;
    el.querySelectorAll(".conflict-choose-btn").forEach(btn =>
      btn.addEventListener("click", () => this._resolveConflict(collectionKey, conflict.id, btn.dataset.choice, el)));
    return el;
  }

  _resolveConflict(collectionKey, id, choice, itemEl) {
    if (!this._mergeResolutions[collectionKey]) this._mergeResolutions[collectionKey] = {};
    this._mergeResolutions[collectionKey][id] = choice;
    itemEl.querySelectorAll(".conflict-choose-btn").forEach(btn =>
      btn.classList.toggle("active", btn.dataset.choice === choice));
    const resEl = itemEl.querySelector(`#res-${collectionKey}-${id}`);
    resEl.innerHTML = `<span class="conflict-resolved">✓ Usando versión "${choice === "current" ? "actual" : "origen"}"</span>`;
    itemEl.classList.add("resolved");
    this._checkAllResolved();
  }

  _checkAllResolved() {
    if (!this._mergeAnalysis) return;
    let allResolved = true;
    for (const [key, diff] of Object.entries(this._mergeAnalysis.collections)) {
      for (const conflict of diff.conflicts) {
        if (!this._mergeResolutions[key]?.[conflict.id]) { allResolved = false; break; }
      }
      if (!allResolved) break;
    }
    this._el.querySelector("#merge-apply-btn").disabled = !allResolved;
  }

  async _applyMerge() {
    const analysis = this._mergeAnalysis;
    if (!analysis) return;
    const collections = {};
    for (const [key, diff] of Object.entries(analysis.collections)) {
      collections[key] = {
        ...diff,
        resolvedConflicts: diff.conflicts.map(c => ({
          id: c.id,
          choice: this._mergeResolutions[key]?.[c.id] || "current",
        })),
      };
    }
    const applyBtn = this._el.querySelector("#merge-apply-btn");
    applyBtn.disabled = true;
    applyBtn.textContent = "Aplicando...";
    try {
      await this.apiClient.applyMerge(
        this.projectStore.project.id,
        analysis.sourceBranch,
        collections,
        analysis.settings?.merged
      );
      this._closeMergeModal();
      showInfo(`Merge de "${analysis.sourceBranch}" aplicado. Recarga el proyecto para ver los cambios.`);
      await this._loadAll();
    } catch (err) { showError(`Error al aplicar merge: ${err.message}`); }
    finally { applyBtn.disabled = false; applyBtn.textContent = "Aplicar merge"; }
  }

  _closeMergeModal() {
    this._mergeAnalysis = null;
    this._mergeResolutions = {};
    this._el.querySelector("#history-merge-modal").classList.add("hidden");
  }

  async _loadHistory() {
    const project = this.projectStore.project;
    const listEl = this._el.querySelector("#history-list");
    listEl.innerHTML = `<span class="history-loading">Cargando...</span>`;
    try {
      const history = await this.apiClient.getHistory(project.id, 60);
      if (history.length === 0) {
        listEl.innerHTML = `<p class="history-empty">Aún no hay versiones guardadas.<br>Se crearán automáticamente al guardar el proyecto.</p>`;
        return;
      }
      listEl.innerHTML = "";
      history.forEach(commit => listEl.appendChild(this._buildCommitItem(commit)));
    } catch (err) {
      listEl.innerHTML = `<p class="history-error">Error: ${err.message}</p>`;
    }
  }

  async _loadPending() {
    const project = this.projectStore.project;
    const el = this._el.querySelector("#history-pending");
    try {
      const { files, hasChanges } = await this.apiClient.getPendingChanges(project.id);
      if (!hasChanges) {
        el.innerHTML = `<span class="history-no-changes">✓ Sin cambios pendientes</span>`;
      } else {
        el.innerHTML = `
          <span class="history-changes-count">${files.length} archivo${files.length !== 1 ? "s" : ""} modificado${files.length !== 1 ? "s" : ""}</span>
          <ul class="history-files-list">
            ${files.slice(0, 8).map(f => `<li>${this._esc(f)}</li>`).join("")}
            ${files.length > 8 ? `<li class="history-more">...y ${files.length - 8} más</li>` : ""}
          </ul>`;
      }
    } catch { el.innerHTML = `<span class="history-error-small">No disponible</span>`; }
  }

  async _handleManualCommit() {
    const input = this._el.querySelector("#history-commit-input");
    const message = input.value.trim();
    if (!message) { input.focus(); return; }
    const btn = this._el.querySelector("#history-commit-btn");
    btn.disabled = true; btn.textContent = "Guardando...";
    try {
      await this.apiClient.createCommit(this.projectStore.project.id, message);
      input.value = "";
      showInfo(`Punto guardado: "${message}"`);
      await this._loadAll();
    } catch (err) { showError(err.message); }
    finally { btn.disabled = false; btn.textContent = "Guardar punto"; }
  }

  _buildCommitItem(commit) {
    const div = document.createElement("div");
    div.className = `history-commit-item ${commit.isAuto ? "is-auto" : "is-manual"}`;
    const date = new Date(commit.date);
    div.innerHTML = `
      <div class="commit-icon">${commit.isAuto ? "⟳" : "★"}</div>
      <div class="commit-body">
        <span class="commit-message">${this._esc(commit.message)}</span>
        <span class="commit-meta">${date.toLocaleDateString("es-ES", {day:"2-digit",month:"short",year:"numeric"})} · ${date.toLocaleTimeString("es-ES", {hour:"2-digit",minute:"2-digit"})} · <code>${commit.shortHash}</code></span>
      </div>
      <button class="btn small commit-restore-btn">Restaurar</button>
    `;
    div.querySelector(".commit-restore-btn").addEventListener("click", () => this._openRestoreModal(commit));
    return div;
  }

  _openRestoreModal(commit) {
    this._pendingRestoreHash = commit.hash;
    this._el.querySelector("#history-modal-desc").textContent = `"${commit.message}" — ${new Date(commit.date).toLocaleString("es-ES")}`;
    this._el.querySelector("#history-restore-modal").classList.remove("hidden");
  }

  _closeRestoreModal() {
    this._pendingRestoreHash = null;
    this._el.querySelector("#history-restore-modal").classList.add("hidden");
  }

  async _confirmRestore() {
    const hash = this._pendingRestoreHash;
    if (!hash) return;
    const btn = this._el.querySelector("#history-modal-confirm");
    btn.disabled = true; btn.textContent = "Restaurando...";
    try {
      await this.apiClient.restoreCommit(this.projectStore.project.id, hash);
      this._closeRestoreModal();
      showInfo("Proyecto restaurado. Recarga el proyecto para ver los cambios.");
      await this._loadAll();
    } catch (err) { showError(`Error al restaurar: ${err.message}`); }
    finally { btn.disabled = false; btn.textContent = "Restaurar"; }
  }

  _renderEmpty() {
    if (!this._el) return;
    this._el.querySelector("#history-list").innerHTML = `<p class="history-empty">Abre un proyecto para ver su historial.</p>`;
    this._el.querySelector("#history-pending").innerHTML = "";
    this._el.querySelector("#history-branch-list").innerHTML = "";
  }

  _esc(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  _truncateJson(str, maxLines = 12) {
    const lines = str.split("\n");
    if (lines.length <= maxLines) return str;
    return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} líneas más)`;
  }

  refresh() { this._loadAll(); }
  destroy() { this._el = null; }
}
