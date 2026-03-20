// ============================================================
// REPORTS.JS — Uses Chart.js (loaded via CDN)
// ============================================================
const Reports = {
    charts: {},
    period: 'mes',

    async load() {
        const page = document.getElementById('page-reports');
        page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Reportes</h1><p class="page-subtitle">Análisis de ventas y rendimiento</p></div>
        <div class="page-actions">
          <select id="period-select" class="form-select">
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="anual">Este Año</option>
          </select>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="cards-grid" id="report-cards" style="margin-bottom:var(--sp-5)">
        <div class="stat-card blue"><div class="stat-icon">📈</div><div class="stat-value" id="rpt-total">—</div><div class="stat-label">Total Ventas</div></div>
        <div class="stat-card green"><div class="stat-icon">🛒</div><div class="stat-value" id="rpt-pedidos">—</div><div class="stat-label">Pedidos</div></div>
        <div class="stat-card yellow"><div class="stat-icon">💵</div><div class="stat-value" id="rpt-pagado">—</div><div class="stat-label">Cobrado</div></div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header"><h3>Ventas por Día</h3></div>
          <div class="chart-body"><canvas id="chart-sales"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header"><h3>Mejores Clientes</h3></div>
          <div class="chart-body"><canvas id="chart-clients"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header"><h3>Categorías (Valor en Stock)</h3></div>
          <div class="chart-body"><canvas id="chart-cats"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header"><h3>Top Productos</h3></div>
          <div class="chart-body"><canvas id="chart-products"></canvas></div>
        </div>
      </div>
    `;

        await this.loadCharts('mes');

        document.getElementById('period-select').addEventListener('change', async e => {
            this.period = e.target.value;
            await this.loadCharts(this.period);
        });
    },

    async loadCharts(period) {
        // Destroy existing charts
        Object.values(this.charts).forEach(c => { try { c.destroy(); } catch (e) { } });
        this.charts = {};

        const [salesRes, clientsRes, catsRes, topRes] = await Promise.all([
            API.reports.getSalesReport(period),
            API.reports.getTopClients(period),
            API.reports.getTopCategories(period),
            API.reports.getTopProducts(period),
        ]);

        if (salesRes.ok) {
            const data = salesRes.data;
            document.getElementById('rpt-total').textContent = fmt(data.totalVentas);
            document.getElementById('rpt-pedidos').textContent = data.totalPedidos;
            document.getElementById('rpt-pagado').textContent = fmt(data.pagado);

            const days = Object.keys(data.byDay || {}).sort();
            this.charts.sales = new Chart(document.getElementById('chart-sales'), {
                type: 'line',
                data: {
                    labels: days.map(d => new Date(d).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })),
                    datasets: [{ label: 'Ventas', data: days.map(d => data.byDay[d]), borderColor: '#4f6ef7', backgroundColor: 'rgba(79,110,247,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#4f6ef7' }]
                },
                options: this.chartOptionsLine()
            });
        }

        if (clientsRes.ok) {
            const entries = Object.entries(clientsRes.data || {}).slice(0, 7);
            this.charts.clients = new Chart(document.getElementById('chart-clients'), {
                type: 'bar',
                data: {
                    labels: entries.map(([k]) => k),
                    datasets: [{ label: 'Compras', data: entries.map(([, v]) => v), backgroundColor: ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316'] }]
                },
                options: this.chartOptionsBar()
            });
        }

        if (catsRes.ok) {
            const entries = Object.entries(catsRes.data || {});
            this.charts.cats = new Chart(document.getElementById('chart-cats'), {
                type: 'doughnut',
                data: {
                    labels: entries.map(([k]) => k),
                    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'], borderColor: '#1c2030', borderWidth: 2 }]
                },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } } } }
            });
        }

        if (topRes.ok) {
            const entries = Object.entries(topRes.data || {}).slice(0, 7);
            this.charts.products = new Chart(document.getElementById('chart-products'), {
                type: 'bar',
                data: {
                    labels: entries.map(([k]) => k.length > 20 ? k.slice(0, 20) + '…' : k),
                    datasets: [{ label: 'Pedidos', data: entries.map(([, v]) => v), backgroundColor: '#22c55e' }]
                },
                options: this.chartOptionsBar()
            });
        }
    },

    chartOptionsLine() {
        return {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 } }, grid: { color: '#1e2235' } },
                y: { ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 }, callback: v => fmt(v) }, grid: { color: '#1e2235' } }
            }
        };
    },

    chartOptionsBar() {
        return {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8892a4', font: { family: 'Inter', size: 10 } }, grid: { display: false } },
                y: { ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 } }, grid: { color: '#1e2235' } }
            }
        };
    }
};
