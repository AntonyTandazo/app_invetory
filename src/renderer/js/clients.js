// ============================================================
// CLIENTS.JS
// ============================================================
const Clients = {
    allClients: [],
    filterActive: 'all',
    filterDebt: 'all',

    async load() {
        const page = document.getElementById('page-clients');
        const res = await API.clients.getAll();
        this.allClients = res.ok ? res.data : [];

        const total = this.allClients.length;
        const activos = this.allClients.filter(c => c.activo === true || c.activo === 'true' || c.activo === 'TRUE').length;
        const conDeuda = this.allClients.filter(c => Number(c.deuda) > 0).length;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const nuevos = this.allClients.filter(c => c.fecha_registro && c.fecha_registro.startsWith(monthKey)).length;

        page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Gestión de Clientes</h1><p class="page-subtitle">Administración de clientes registrados</p></div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Clients.openModal()">➕ Nuevo Cliente</button>
        </div>
      </div>

      <div class="cards-grid">
        <div class="stat-card blue"><div class="stat-icon">👥</div><div class="stat-value">${total}</div><div class="stat-label">Total Clientes</div></div>
        <div class="stat-card green"><div class="stat-icon">⭐</div><div class="stat-value">${activos}</div><div class="stat-label">Clientes Activos</div></div>
        <div class="stat-card purple"><div class="stat-icon">🆕</div><div class="stat-value">${nuevos}</div><div class="stat-label">Nuevos este Mes</div></div>
        <div class="stat-card red"><div class="stat-icon">💸</div><div class="stat-value">${conDeuda}</div><div class="stat-label">Con Deuda</div></div>
      </div>

      <div class="search-bar">
        <div class="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="client-search" class="search-input" placeholder="Buscar por nombre, cédula/RUC..."/>
        </div>
        <button class="filter-btn active" data-active="all">Todos</button>
        <button class="filter-btn" data-active="activos">Activos</button>
        <button class="filter-btn" data-active="inactivos">Inactivos</button>
        <button class="filter-btn" data-debt="deuda">Con Deuda</button>
        <button class="filter-btn" data-debt="sin">Sin Deuda</button>
      </div>

      <div class="table-card">
        <div class="table-header"><span class="table-title">Lista de Clientes</span><span id="client-count" class="text-muted">0 clientes</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th><th>Dirección</th><th>Compras</th><th>Deuda</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="clients-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

        this.renderTable(this.allClients);

        let search = '';
        document.getElementById('client-search').addEventListener('input', e => { search = e.target.value; this.applyFilters(search); });
        document.querySelectorAll('.filter-btn[data-active]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn[data-active]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active'); this.filterActive = btn.dataset.active; this.applyFilters(search);
            });
        });
        document.querySelectorAll('.filter-btn[data-debt]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn[data-debt]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active'); this.filterDebt = btn.dataset.debt; this.applyFilters(search);
            });
        });
    },

    applyFilters(search) {
        let r = this.allClients;
        if (search) { const s = search.toLowerCase(); r = r.filter(c => c.nombre.toLowerCase().includes(s) || (c.cedula_ruc || '').includes(s)); }
        if (this.filterActive === 'activos') r = r.filter(c => c.activo === true || c.activo === 'true' || c.activo === 'TRUE');
        if (this.filterActive === 'inactivos') r = r.filter(c => c.activo === false || c.activo === 'false' || c.activo === 'FALSE');
        if (this.filterDebt === 'deuda') r = r.filter(c => Number(c.deuda) > 0);
        if (this.filterDebt === 'sin') r = r.filter(c => Number(c.deuda) <= 0);
        this.renderTable(r);
    },

    renderTable(clients) {
        const body = document.getElementById('clients-table-body');
        const count = document.getElementById('client-count');
        if (!body) return;
        count && (count.textContent = clients.length + ' clientes');
        if (clients.length === 0) { body.innerHTML = `<tr><td colspan="8" class="table-empty"><span class="empty-icon">👥</span>No hay clientes</td></tr>`; return; }
        body.innerHTML = clients.map(c => `<tr>
      <td class="text-accent" style="font-size:var(--fs-xs)">${c.id}</td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.telefono || '—'}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.direccion || '—'}</td>
      <td>${c.total_compras || 0}</td>
      <td class="${Number(c.deuda) > 0 ? 'text-red fw-600' : ''}">${Number(c.deuda) > 0 ? fmt(c.deuda) : '—'}</td>
      <td>${statusBadge((c.activo === true || c.activo === 'true' || c.activo === 'TRUE') ? 'activo' : 'inactivo')}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="Clients.editClient('${c.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="Clients.deleteClient('${c.id}')">🗑️</button>
      </td>
    </tr>`).join('');
    },

    openModal(client = null) {
        Modal.open(client ? 'Editar Cliente' : 'Nuevo Cliente', `
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre Completo <span class="form-required">*</span></label>
          <input type="text" id="cf-nombre" class="form-input" value="${client?.nombre || ''}" placeholder="Nombre y apellido"/>
        </div>
        <div class="form-group">
          <label class="form-label">Cédula / RUC</label>
          <input type="text" id="cf-cedula" class="form-input" value="${client?.cedula_ruc || ''}" placeholder="1234567890"/>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono <span class="form-required">*</span></label>
          <input type="tel" id="cf-telefono" class="form-input" value="${client?.telefono || ''}" placeholder="0999123456"/>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="cf-email" class="form-input" value="${client?.email || ''}" placeholder="correo@ejemplo.com"/>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección</label>
          <input type="text" id="cf-direccion" class="form-input" value="${client?.direccion || ''}" placeholder="Calle, número, ciudad"/>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Clients.saveClient('${client?.id || ''}')">💾 Guardar</button>
      </div>
    `);
    },

    async saveClient(id) {
        const data = {
            nombre: document.getElementById('cf-nombre').value.trim(),
            cedula_ruc: document.getElementById('cf-cedula').value.trim(),
            telefono: document.getElementById('cf-telefono').value.trim(),
            email: document.getElementById('cf-email').value.trim(),
            direccion: document.getElementById('cf-direccion').value.trim(),
            activo: true,
        };
        if (!data.nombre) { Toast.show('El nombre es requerido', 'error'); return; }
        const res = id ? await API.clients.update(id, data) : await API.clients.create(data);
        if (res.ok) { Toast.show(id ? 'Cliente actualizado' : 'Cliente creado', 'success'); Modal.close(); await this.load(); }
        else Toast.show('Error: ' + res.error, 'error');
    },

    editClient(id) { const c = this.allClients.find(c => c.id === id); if (c) this.openModal(c); },
    async deleteClient(id) {
        if (!confirm('¿Eliminar este cliente?')) return;
        const res = await API.clients.delete(id);
        if (res.ok) { Toast.show('Cliente eliminado', 'success'); await this.load(); }
        else Toast.show('Error: ' + res.error, 'error');
    }
};
