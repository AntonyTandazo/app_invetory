const { RegisterPayment, GetDebts, GetPayments } = require('../../domain/use-cases/payments/PaymentUseCases');

function registerPaymentsIpc(ipcMain, repos) {
    const { payments, clients } = repos;

    ipcMain.handle('payments:register', async (e, data) => {
        try {
            const uc = new RegisterPayment(payments, clients);
            return { ok: true, data: await uc.execute(data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('payments:getAll', async () => {
        try {
            const uc = new GetPayments(payments);
            return { ok: true, data: await uc.execute() };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('payments:getDebts', async (e, search) => {
        try {
            const uc = new GetDebts(clients);
            return { ok: true, data: await uc.execute(search || '') };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('payments:getMonthlyTotal', async () => {
        try {
            const total = await payments.getMonthlyTotal();
            return { ok: true, data: total };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerPaymentsIpc };
