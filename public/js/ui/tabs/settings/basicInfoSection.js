export function renderBasicInfoSection(settings, imageOptionsHtml) {
  return `
    <section class="settings-section" data-section="basic-info">
      <div class="settings-section-header">
        <h3>Información Básica</h3>
        <button type="button" class="collapse-toggle" data-target="basic-info">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group">
          <label>Título del Juego</label>
          <input type="text" id="game-title" value="${settings.gameTitle}" />
        </div>

        <div class="form-group">
          <label>Versión</label>
          <input type="text" id="game-version" value="${settings.gameVersion}" />
        </div>

        <div class="form-group">
          <label>Autor</label>
          <input type="text" id="game-author" value="${settings.author}" />
        </div>

        <div class="form-group">
          <label>Icono del Juego (para exportación)</label>
          <select id="game-icon">
            <option value="">Sin icono</option>
            ${imageOptionsHtml}
          </select>
          <small>Selecciona una imagen que se usará como icono del ejecutable</small>
        </div>
      </div>
    </section>
  `;
}
