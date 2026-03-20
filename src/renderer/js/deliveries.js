// ============================================================
// DELIVERIES.JS
// ============================================================
const Deliveries = {
    all: [],

    async load() {
        const page = document.getElementById('page-deliveries');
        const res = await API.deliveries.getAll();
        this.all = res.ok ? res.data : [];

        const pendientes = this.all.filter(d => d.estado !== 'entregado').length;
        const entregados = this.all.filter(d => d.estado === 'entregado').length;

        page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Entregas</h1><p class="page-subtitle">Control de domicilios y servicios</p></div>
      </div>

      <div class="cards-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:var(--sp-5)">
        <div class="stat-card yellow"><div class="stat-icon">📦</div><div class="stat-value">${pendientes}</div><div class="stat-label">Pendientes por Entregar</div></div>
        <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${entregados}</div><div class="stat-label">Entregados</div></div>
      </div>

      <div class="search-bar">
        <div class="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="del-search" class="search-input" placeholder="Buscar por pedido o cliente..."/>
        </div>
        <button class="filter-btn active" data-filter="all">Todos</button>
        <button class="filter-btn" data-filter="pendiente">Pendientes</button>
        <button class="filter-btn" data-filter="en_camino">En Camino</button>
        <button class="filter-btn" data-filter="entregado">Entregados</button>
      </div>

      <div class="table-card">
        <div class="table-header"><span class="table-title">Lista de Entregas</span><span id="del-count" class="text-muted">${this.all.length} entregas</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>N° Pedido</th><th>Cliente</th><th>Repartidor</th><th>Fecha Estimada</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody id="del-body"></tbody>
          </table>
        </div>
      </div>
    `;

        this.renderTable(this.all);

        let search = '', statusFilter = 'all';
        document.getElementById('del-search').addEventListener('input', e => { search = e.target.value; this.applyFilters(search, statusFilter); });
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active'); statusFilter = btn.dataset.filter; this.applyFilters(search, statusFilter);
            });
        });
    },

    applyFilters(search, status) {
        let filtered = this.all;
        if (search) { const s = search.toLowerCase(); filtered = filtered.filter(d => (d.cliente_nombre || '').toLowerCase().includes(s) || (d.pedido_id || '').toLowerCase().includes(s)); }
        if (status !== 'all') filtered = filtered.filter(d => d.estado === status);
        this.renderTable(filtered);
    },

    renderTable(items) {
        const body = document.getElementById('del-body');
        const count = document.getElementById('del-count');
        if (!body) return;
        count && (count.textContent = items.length + ' entregas');
        if (items.length === 0) { body.innerHTML = `<tr><td colspan="7" class="table-empty"><span class="empty-icon">📦</span>Sin entregas</td></tr>`; return; }
        body.innerHTML = items.map(d => `<tr>
      <td class="text-accent fw-600">${d.pedido_id || d.id}</td>
      <td>${d.cliente_nombre || '—'}</td>
      <td>${d.repartidor || '—'}</td>
      <td>${d.fecha_estimada ? fmtDate(d.fecha_estimada) : '—'}</td>
      <td>${fmt(d.total)}</td>
      <td>${statusBadge(d.estado)}</td>
      <td>
        <select class="status-select" onchange="Deliveries.changeStatus('${d.id}', this.value)">
          <option value="pendiente" ${d.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
          <option value="en_camino" ${d.estado === 'en_camino' ? 'selected' : ''}>🚗 En camino</option>
          <option value="entregado" ${d.estado === 'entregado' ? 'selected' : ''}>✅ Entregado</option>
        </select>
      </td>
    </tr>`).join('');
    },

    async changeStatus(id, estado) {
        const res = await API.deliveries.updateStatus(id, estado);
        if (res.ok) {
            const item = this.all.find(d => d.id === id);
            if (item) item.estado = estado;
            Toast.show('Estado actualizado', 'success');
            await this.load();
        } else Toast.show('Error: ' + res.error, 'error');
    }
};
