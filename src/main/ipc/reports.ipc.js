function registerReportsIpc(ipcMain, repos) {
    const { sales, orders, clients, products, categories } = repos;

    const filterByPeriod = (items, period, dateField = 'fecha') => {
        const now = new Date();
        return items.filter(item => {
            if (!item[dateField]) return false;
            const d = new Date(item[dateField]);
            if (period === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (period === 'trimestre') {
                const q = Math.floor(now.getMonth() / 3);
                return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
            }
            if (period === 'anual') return d.getFullYear() === now.getFullYear();
            return true;
        });
    };

    ipcMain.handle('reports:getSalesReport', async (e, period) => {
        try {
            const all = await sales.getAll();
            const filtered = filterByPeriod(all, period);
            const totalVentas = filtered.reduce((s, v) => s + v.total, 0);
            const totalPedidos = filtered.length;
            const pagado = filtered.filter(v => v.estado === 'pagado').reduce((s, v) => s + v.total, 0);
            // Group by day for chart
            const byDay = {};
            filtered.forEach(v => {
                const day = v.fecha ? v.fecha.split('T')[0] : '?';
                byDay[day] = (byDay[day] || 0) + v.total;
            });
            return { ok: true, data: { totalVentas, totalPedidos, pagado, byDay } };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('reports:getTopProducts', async (e, period) => {
        try {
            const allOrders = await orders.getAll();
            const filtered = filterByPeriod(allOrders, period);
            // count by cliente_nombre as proxy (real items need items sheet)
            const counts = {};
            filtered.forEach(o => {
                if (o.notas) {
                    counts[o.notas] = (counts[o.notas] || 0) + 1;
                }
            });
            return { ok: true, data: counts };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('reports:getTopClients', async (e, period) => {
        try {
            const allOrders = await orders.getAll();
            const filtered = filterByPeriod(allOrders, period);
            const counts = {};
            filtered.forEach(o => {
                const key = o.cliente_nombre || o.cliente_id || 'Desconocido';
                counts[key] = (counts[key] || 0) + o.total;
            });
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
            return { ok: true, data: Object.fromEntries(sorted) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('reports:getTopCategories', async (e, period) => {
        try {
            const allProducts = await products.getAll();
            const cats = {};
            allProducts.forEach(p => {
                const cat = p.categoria_nombre || 'Sin categoría';
                cats[cat] = (cats[cat] || 0) + p.stock_actual * p.precio;
            });
            return { ok: true, data: cats };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerReportsIpc };
