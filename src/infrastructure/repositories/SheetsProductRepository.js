const sheetsClient = require('../google/GoogleSheetsClient');
const Product = require('../../domain/models/Product');

const SHEET = 'productos';
const HEADERS = ['id', 'codigo', 'nombre', 'categoria_id', 'categoria_nombre', 'precio', 'stock_actual', 'stock_minimo', 'activo'];

class SheetsProductRepository {
    async init() { await sheetsClient.ensureSheetExists(SHEET, HEADERS); }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Product(r));
    }

    async getById(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const r = rows.find(r => r.id === id);
        return r ? new Product(r) : null;
    }

    async create(product) {
        await sheetsClient.appendRow(SHEET, HEADERS, product);
        return product;
    }

    async update(id, data) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        const updated = { ...row, ...data };
        await sheetsClient.updateRow(SHEET, row._rowIndex, HEADERS, updated);
        return new Product(updated);
    }

    async delete(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return false;
        const sheetId = await sheetsClient.getSheetIdByName(SHEET);
        await sheetsClient.deleteRow(SHEET, row._rowIndex, sheetId);
        return true;
    }

    async getLowStock() {
        const products = await this.getAll();
        return products.filter(p => p.isLowStock() || p.isCriticalStock());
    }
}

module.exports = SheetsProductRepository;
