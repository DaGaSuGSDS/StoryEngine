export function renderFeaturesSection(settings) {
  return `
    <section class="settings-section" data-section="features">
      <div class="settings-section-header">
        <h3>Características del Juego</h3>
        <button type="button" class="collapse-toggle" data-target="features">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="enable-save-load" ${
              settings.enableSaveLoad ? "checked" : ""
            } />
            Habilitar Guardado y Carga
          </label>
          <small>Permite el sistema de guardado/carga en el juego exportado</small>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="enable-backlog" ${
              settings.enableBacklog ? "checked" : ""
            } />
            Habilitar Historial de Diálogos
          </label>
          <small>Permite revisar diálogos anteriores (presiona ESC en el juego)</small>
        </div>
      </div>
    </section>
  `;
}

export function renderGameOptionsSection(settings) {
  return `
    <section class="settings-section" data-section="game-options">
      <div class="settings-section-header">
        <h3>Opciones de Juego</h3>
        <button type="button" class="collapse-toggle" data-target="game-options">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group">
          <label>Velocidad de Texto (ms por carácter)</label>
          <input type="number" id="text-speed" value="${settings.textSpeed}" min="0" max="200" />
          <small>0 = instantáneo, 50 = normal, 100 = lento</small>
        </div>

        <div class="form-group">
          <label>Ancho de Ventana</label>
          <input type="number" id="window-width" value="${settings.windowWidth}" min="800" max="3840" />
        </div>

        <div class="form-group">
          <label>Alto de Ventana</label>
          <input type="number" id="window-height" value="${settings.windowHeight}" min="600" max="2160" />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="window-resizable" ${
              settings.resizable ? "checked" : ""
            } />
            Ventana Redimensionable
          </label>
        </div>
      </div>
    </section>
  `;
}
