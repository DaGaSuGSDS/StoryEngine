/**
 * AudioTab.js
 * UI component for managing audio assets in the project.
 */
import { AudioAsset } from "../../models/AudioAsset.js";
import { showError, showInfo } from "../notifications.js";

export class AudioTab {
  /**
   * @param {Object} projectStore
   * @param {Object} apiClient
   */
  constructor(projectStore, apiClient) {
    this.projectStore = projectStore;
    this.apiClient = apiClient;
    this.root = null;
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
      <div class="panel-title">Audio</div>
      <div class="panel-section row">
        <input type="file" id="audio-file" accept="audio/*" />
        <button id="audio-upload" class="btn small">Subir</button>
      </div>
      <div class="panel-section">
        <table class="table" id="audio-table">
          <thead>
            <tr><th>Nombre</th><th>Previsualizar</th><th></th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    const uploadBtn = this.root.querySelector("#audio-upload");
    uploadBtn.addEventListener("click", () => this.handleUpload());

    this.refresh();
    return this.root;
  }

  /**
   * Handles audio upload.
   */
  async handleUpload() {
    if (!this.projectStore.project) {
      showError("Carga o crea un proyecto primero.");
      return;
    }
    const input = this.root.querySelector("#audio-file");
    if (!input.files || input.files.length === 0) {
      showError("Selecciona un archivo de audio.");
      return;
    }
    const file = input.files[0];
    try {
      const asset = await this.apiClient.uploadAudio(
        this.projectStore.project.id,
        file
      );
      this.projectStore.addAudioAsset(asset);
      input.value = "";
      showInfo("Audio subido correctamente.");
    } catch (err) {
      console.error("Error al subir audio", err);
      showError("Error al subir audio.");
    }
  }

  /**
   * Refreshes audio list.
   */
  refresh() {
    if (!this.root) return;
    const tbody = this.root.querySelector("#audio-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!this.projectStore.project) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.innerHTML =
        '<span class="muted">Carga o crea un proyecto para añadir audio.</span>';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const projectId = this.projectStore.project.id;
    const apiOrigin = new URL(this.apiClient.baseUrl).origin;

    this.projectStore.audio.forEach((aud) => {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = aud.name;

      const previewTd = document.createElement("td");
      const url = `${apiOrigin}/projects/${encodeURIComponent(
        projectId
      )}/audio/${encodeURIComponent(aud.fileName)}`;
      const audio = new Audio(url);

      const renderPlayButton = () => {
        previewTd.innerHTML = "";
        const playBtn = document.createElement("button");
        playBtn.className = "btn small";
        playBtn.textContent = "Reproducir";
        playBtn.addEventListener("click", () => {
          try {
            audio.currentTime = 0;
          } catch {
            // ignore
          }
          audio
            .play()
            .then(() => {
              renderPlayingControls();
            })
            .catch((err) => {
              console.error(
                "Error reproduciendo audio de previsualización",
                err
              );
            });
        });
        previewTd.appendChild(playBtn);
      };

      const renderPlayingControls = () => {
        previewTd.innerHTML = "";

        const pauseBtn = document.createElement("button");
        pauseBtn.className = "btn small";
        pauseBtn.textContent = "Pausar";

        const stopBtn = document.createElement("button");
        stopBtn.className = "btn small";
        stopBtn.style.marginLeft = "4px";
        stopBtn.textContent = "Detener";

        pauseBtn.addEventListener("click", () => {
          if (audio.paused) {
            audio
              .play()
              .then(() => {
                pauseBtn.textContent = "Pausar";
              })
              .catch((err) => {
                console.error(
                  "Error reanudando audio de previsualización",
                  err
                );
              });
          } else {
            audio.pause();
            pauseBtn.textContent = "Continuar";
          }
        });

        stopBtn.addEventListener("click", () => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {
            // ignore
          }
          renderPlayButton();
        });

        audio.addEventListener(
          "ended",
          () => {
            renderPlayButton();
          },
          { once: true }
        );

        previewTd.appendChild(pauseBtn);
        previewTd.appendChild(stopBtn);
      };

      renderPlayButton();

      const actionsTd = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "btn small";
      delBtn.textContent = "Eliminar";
      delBtn.addEventListener("click", async () => {
        if (confirm(`¿Eliminar audio "${aud.name}"?`)) {
          try {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {
              // ignore
            }
            await this.apiClient.deleteAudio(projectId, aud.id);
            this.projectStore.removeAudioAsset(aud.id);
          } catch (err) {
            console.error("Error al eliminar audio", err);
            showError("Error al eliminar audio.");
          }
        }
      });
      actionsTd.appendChild(delBtn);

      tr.appendChild(nameTd);
      tr.appendChild(previewTd);
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });
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
}
