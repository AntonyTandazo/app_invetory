// ============================================================
// DASHBOARD.JS
// ============================================================
const Dashboard = {
    async load() {
        const page = document.getElementById('page-dashboard');
        page.innerHTML = `<div class="loading"><div class="spinner"></div> Cargando dashboard...</div>`;

        const [statsRes, recentRes, lowStockRes] = await Promise.all([
            API.sales.getDashboardStats(),
            API.sales.getRecent(4),
            API.products.getLowStock(),
        ]);

        const stats = statsRes.ok ? statsRes.data : {};
        const recent = recentRes.ok ? recentRes.data : [];
        const lowStock = lowStockRes.ok ? lowStockRes.data : [];

        page.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Resumen del día — ${new Date().toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div class="cards-grid">
        <div class="stat-card blue">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${stats.totalClientes || 0}</div>
          <div class="stat-label">Total Clientes</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">📦</div>
          <div class="stat-value">${stats.stockTotal || 0}</div>
          <div class="stat-label">Unidades en Stock</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${fmt(stats.ventasHoy || 0)}</div>
          <div class="stat-label">Ventas del Día</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value">${(stats.lowStock || []).length}</div>
          <div class="stat-label">Alertas de Stock</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4);">
        <!-- Recent orders table -->
        <div class="table-card">
          <div class="table-header">
            <span class="table-title">🧾 Pedidos Recientes</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('sales')">Ver todos →</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody id="dash-recent-body">
                ${recent.length === 0 ? `<tr><td colspan="4" class="table-empty"><span class="empty-icon">📋</span>Sin pedidos aún</td></tr>` :
                recent.map(s => `<tr>
                    <td><span class="text-accent fw-600">${s.id}</span></td>
                    <td>${s.cliente_nombre || '—'}</td>
                    <td><strong>${fmt(s.total)}</strong></td>
                    <td>${statusBadge(s.estado)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low stock alerts -->
        <div class="table-card">
          <div class="table-header">
            <span class="table-title">🔔 Alertas de Stock</span>
            <button class="btn btn-ghost btn-sm" onclick="navigate('products')">Ver todos →</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Actual</th><th>Mínimo</th><th>Estado</th></tr></thead>
              <tbody>
                ${(lowStock || []).slice(0, 4).length === 0 ? `<tr><td colspan="4" class="table-empty"><span class="empty-icon">✅</span>Sin alertas</td></tr>` :
                (lowStock || []).slice(0, 4).map(p => `<tr>
                    <td>${p.nombre}</td>
                    <td class="text-red fw-600">${p.stock_actual}</td>
                    <td>${p.stock_minimo}</td>
                    <td>${statusBadge(p.getStockStatus ? p.getStockStatus() : (p.stock_actual == 0 ? 'critico' : 'bajo'))}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    }
};
