const { GetDeliveries, UpdateDeliveryStatus } = require('../../domain/use-cases/deliveries/DeliveryUseCases');

function registerDeliveriesIpc(ipcMain, repos) {
    const { deliveries } = repos;

    ipcMain.handle('deliveries:getAll', async (e, filters) => {
        try {
            const uc = new GetDeliveries(deliveries);
            return { ok: true, data: await uc.execute(filters || {}) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('deliveries:updateStatus', async (e, id, estado) => {
        try {
            const uc = new UpdateDeliveryStatus(deliveries);
            return { ok: true, data: await uc.execute(id, estado) };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerDeliveriesIpc };
