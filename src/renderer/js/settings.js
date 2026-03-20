// ============================================================
// SETTINGS.JS
// ============================================================
const Settings = {
  async load() {
    const page = document.getElementById('page-settings');
    const spreadsheetId = await API.auth.getSpreadsheetId() || '—';
    const iva = Settings.getIva();

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

        <!-- About -->
        <div class="table-card" style="margin-bottom:0">
          <div class="table-header"><span class="table-title">ℹ️ Acerca del Sistema</span></div>
          <div style="padding:var(--sp-5)">
            <p style="margin-bottom:var(--sp-2)"><strong>Sistema de Inventario</strong> v1.0.0</p>
            <p>Electron + Google Sheets • Arquitectura Hexagonal</p>
          </div>
        </div>

      </div>
    `;
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
  }
};
