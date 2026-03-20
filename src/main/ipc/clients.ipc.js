const { GetClients, CreateClient, UpdateClient, DeleteClient } = require('../../domain/use-cases/clients/ClientUseCases');

function registerClientsIpc(ipcMain, repos) {
    const { clients: clientRepo } = repos;

    ipcMain.handle('clients:getAll', async (e, filters) => {
        try {
            const uc = new GetClients(clientRepo);
            return { ok: true, data: await uc.execute(filters || {}) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('clients:create', async (e, data) => {
        try {
            const uc = new CreateClient(clientRepo);
            return { ok: true, data: await uc.execute(data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('clients:update', async (e, id, data) => {
        try {
            const uc = new UpdateClient(clientRepo);
            return { ok: true, data: await uc.execute(id, data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('clients:delete', async (e, id) => {
        try {
            const uc = new DeleteClient(clientRepo);
            return { ok: true, data: await uc.execute(id) };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerClientsIpc };
