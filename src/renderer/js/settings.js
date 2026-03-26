// ============================================================
// SETTINGS.JS
// ============================================================
const Settings = {
  async load() {
    const page = document.getElementById('page-settings');
    const spreadsheetId = await API.auth.getSpreadsheetId() || '—';
    const iva = Settings.getIva();
    const appVersion = await API.updater.getVersion().catch(() => '1.0.0');

    page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Configuración</h1><p class="page-subtitle">Ajustes del sistema</p></div>
      </div>

      <div style="max-width:600px;display:flex;flex-direction:column;gap:var(--sp-4)">

        <!-- IVA / Facturación -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">🧾 Facturación e IVA</span></div>
          <div style="padding:var(--sp-5)">
            <p style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-bottom:var(--sp-4)">
              Configura el porcentaje de IVA que se aplicará cuando el usuario lo active en ventas y proformas.
            </p>
            <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-4)">
              <div class="form-group">
                <label class="form-label">Porcentaje de IVA (%)</label>
                <input type="number" id="cfg-iva" class="form-input" value="${iva}" min="0" max="100" step="0.1" placeholder="ej. 15"/>
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end">
                <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);width:100%;text-align:center">
                  <span style="font-size:var(--fs-xs);color:var(--color-text-muted)">IVA actual</span>
                  <div style="font-size:var(--fs-2xl);font-weight:800;color:var(--color-accent)">${iva}%</div>
                </div>
              </div>
            </div>
            <button class="btn btn-primary" onclick="Settings.saveIva()">💾 Guardar IVA</button>
          </div>
        </div>

        <!-- Google Sheets config -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">🔗 Google Sheets</span></div>
          <div style="padding:var(--sp-5)">
            <div class="form-group" style="margin-bottom:var(--sp-3)">
              <label class="form-label">ID de Spreadsheet actual</label>
              <input type="text" id="cfg-sheet-id" class="form-input" value="${spreadsheetId}" placeholder="ID de la hoja de cálculo"/>
            </div>
            <button class="btn btn-primary" onclick="Settings.updateSpreadsheet()">💾 Actualizar Spreadsheet</button>
          </div>
        </div>

        <!-- Account -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">👤 Cuenta Google</span></div>
          <div style="padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-3)">
            <p>Sesión activa con tu cuenta Google.</p>
            <button class="btn btn-danger" onclick="Settings.logout()">🚪 Cerrar sesión y reconectar</button>
          </div>
        </div>

        <!-- Auto-update -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">🔄 Actualizaciones</span></div>
          <div style="padding:var(--sp-5)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4)">
              <div>
                <p style="margin-bottom:var(--sp-1)"><strong>Versión actual:</strong> v${appVersion}</p>
                <p style="font-size:var(--fs-sm);color:var(--color-text-muted)">Buscar actualizaciones.</p>
              </div>
            </div>
            <div id="update-status" style="margin-bottom:var(--sp-3)"></div>
            <button class="btn btn-primary" id="btn-check-update" onclick="Settings.checkForUpdates()">🔍 Buscar actualizaciones</button>
          </div>
        </div>

        <!-- About -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">ℹ️ Acerca del Sistema</span></div>
          <div style="padding:var(--sp-5)">
            <p style="margin-bottom:var(--sp-2)"><strong>Sistema de Inventario</strong> v${appVersion}</p>
          </div>
        </div>

      </div>
    `;

    Settings.setupUpdateListener();
  },

  getIva() {
    return parseFloat(localStorage.getItem('cfg_iva') ?? '15') || 0;
  },

  saveIva() {
    const val = parseFloat(document.getElementById('cfg-iva')?.value) || 0;
    localStorage.setItem('cfg_iva', String(val));
    Toast.show(`✅ IVA guardado: ${val}%`, 'success');
    Settings.load();
  },

  async updateSpreadsheet() {
    const id = document.getElementById('cfg-sheet-id').value.trim();
    if (!id) { Toast.show('Ingresa un ID válido', 'error'); return; }
    const res = await API.auth.setSpreadsheet(id);
    if (res.ok) Toast.show('✅ Spreadsheet actualizado', 'success');
    else Toast.show('Error: ' + res.error, 'error');
  },

  async logout() {
    if (!confirm('¿Cerrar sesión? Deberás autenticarte de nuevo.')) return;
    await API.auth.logout();
    API.close();
  },

  async checkForUpdates() {
    const btn = document.getElementById('btn-check-update');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando...'; }
    const status = document.getElementById('update-status');
    if (status) status.innerHTML = '<p style="color:var(--color-text-muted)">Consultando servidor...</p>';
    await API.updater.check();
  },

  setupUpdateListener() {
    if (Settings._listenerActive) return;
    Settings._listenerActive = true;
    API.updater.onStatus((data) => {
      const status = document.getElementById('update-status');
      const btn = document.getElementById('btn-check-update');
      if (!status) return;

      switch (data.status) {
        case 'checking':
          status.innerHTML = '<p style="color:var(--color-text-muted)">🔍 Buscando actualizaciones...</p>';
          break;
        case 'available':
          status.innerHTML = `
            <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4)">
              <p style="color:var(--color-green);font-weight:700;margin-bottom:var(--sp-2)">🎉 ¡Nueva versión disponible! v${data.version}</p>
              <button class="btn btn-success" onclick="Settings.downloadUpdate()">⬇️ Descargar actualización</button>
            </div>`;
          if (btn) { btn.disabled = false; btn.textContent = '🔍 Buscar actualizaciones'; }
          break;
        case 'up-to-date':
          status.innerHTML = '<p style="color:var(--color-green)">✅ Estás usando la versión más reciente.</p>';
          if (btn) { btn.disabled = false; btn.textContent = '🔍 Buscar actualizaciones'; }
          break;
        case 'downloading':
          status.innerHTML = `
            <div style="margin-bottom:var(--sp-2)">
              <p style="margin-bottom:var(--sp-2)">⬇️ Descargando... ${data.percent}%</p>
              <div style="background:var(--color-surface-2);border-radius:var(--radius-full);height:8px;overflow:hidden">
                <div style="background:var(--color-accent);height:100%;width:${data.percent}%;transition:width 0.3s"></div>
              </div>
            </div>`;
          break;
        case 'downloaded':
          status.innerHTML = `
            <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4)">
              <p style="color:var(--color-green);font-weight:700;margin-bottom:var(--sp-2)">✅ Actualización v${data.version} lista</p>
              <button class="btn btn-success" onclick="Settings.installUpdate()">🔄 Instalar y reiniciar</button>
            </div>`;
          if (btn) { btn.disabled = false; btn.textContent = '🔍 Buscar actualizaciones'; }
          break;
        case 'error':
          status.innerHTML = `<p style="color:var(--color-red)">❌ Error: ${data.message}</p>`;
          if (btn) { btn.disabled = false; btn.textContent = '🔍 Buscar actualizaciones'; }
          break;
      }
    });
  },

  async downloadUpdate() {
    const status = document.getElementById('update-status');
    if (status) status.innerHTML = '<p style="color:var(--color-text-muted)">⬇️ Iniciando descarga...</p>';
    await API.updater.download();
  },

  installUpdate() {
    API.updater.install();
  }
};
