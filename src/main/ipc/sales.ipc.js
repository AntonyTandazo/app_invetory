const { RegisterSale, GetSales, GetDashboardStats } = require('../../domain/use-cases/sales/SaleUseCases');
const { CreateDelivery } = require('../../domain/use-cases/deliveries/DeliveryUseCases');

function registerSalesIpc(ipcMain, repos) {
    const { clients, products, orders, sales, deliveries } = repos;

    ipcMain.handle('sales:register', async (e, data) => {
        try {
            console.log('[sales:register] Received data:', {
                cliente_nombre: data.cliente_nombre,
                tipo: data.tipo,
                total_final: data.total_final,
                iva_pct: data.iva_pct,
                iva_monto: data.iva_monto,
                items_count: data.items?.length,
                monto_pagado: data.monto_pagado
            });
            const uc = new RegisterSale(orders, sales, products, clients);
            const result = await uc.execute(data);
            console.log('[sales:register] Success. Sale ID:', result.sale?.id, '| Total:', result.sale?.total);
            // Auto-create delivery entry
            const deliveryUc = new CreateDelivery(deliveries);
            await deliveryUc.execute({
                pedido_id: result.order.id,
                cliente_nombre: data.cliente_nombre || '',
                repartidor: data.repartidor || '',
                fecha_estimada: data.fecha_estimada || '',
                estado: 'pendiente',
                direccion: data.direccion || '',
                total: result.sale.total,
            });
            return { ok: true, data: result };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('sales:getAll', async (e, filters) => {
        try {
            const uc = new GetSales(sales);
            return { ok: true, data: await uc.execute(filters || {}) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('sales:getRecent', async (e, n) => {
        try {
            const uc = new GetSales(sales);
            const all = await uc.execute({});
            return { ok: true, data: all.slice(0, n || 4) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('sales:getDashboardStats', async () => {
        try {
            const uc = new GetDashboardStats(clients, products, sales);
            return { ok: true, data: await uc.execute() };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('orders:getAll', async (e, filters) => {
        try {
            let all = await orders.getAll();
            if (filters?.tipo) all = all.filter(o => o.tipo === filters.tipo);
            return { ok: true, data: all };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerSalesIpc };
