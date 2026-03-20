const { GetProducts, CreateProduct, UpdateProduct, DeleteProduct, GetInventoryStats, GetLowStockProducts } = require('../../domain/use-cases/products/ProductUseCases');

function registerProductsIpc(ipcMain, repos) {
    const { products: productRepo, categories: catRepo } = repos;

    ipcMain.handle('products:getAll', async (e, filters) => {
        try {
            const uc = new GetProducts(productRepo, catRepo);
            return { ok: true, data: await uc.execute(filters || {}) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('products:create', async (e, data) => {
        try {
            const uc = new CreateProduct(productRepo);
            return { ok: true, data: await uc.execute(data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('products:update', async (e, id, data) => {
        try {
            const uc = new UpdateProduct(productRepo);
            return { ok: true, data: await uc.execute(id, data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('products:delete', async (e, id) => {
        try {
            const uc = new DeleteProduct(productRepo);
            return { ok: true, data: await uc.execute(id) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('products:getStats', async () => {
        try {
            const uc = new GetInventoryStats(productRepo);
            return { ok: true, data: await uc.execute() };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('products:getLowStock', async () => {
        try {
            const uc = new GetLowStockProducts(productRepo);
            return { ok: true, data: await uc.execute() };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    // Categories
    ipcMain.handle('categories:getAll', async () => {
        try {
            return { ok: true, data: await catRepo.getAll() };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('categories:create', async (e, data) => {
        try {
            return { ok: true, data: await catRepo.create(data) };
        } catch (err) { return { ok: false, error: err.message }; }
    });

    ipcMain.handle('categories:delete', async (e, id) => {
        try {
            return { ok: true, data: await catRepo.delete(id) };
        } catch (err) { return { ok: false, error: err.message }; }
    });
}

module.exports = { registerProductsIpc };
