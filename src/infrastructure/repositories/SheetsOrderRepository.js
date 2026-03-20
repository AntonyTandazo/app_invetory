const sheetsClient = require('../google/GoogleSheetsClient');
const Order = require('../../domain/models/Order');

const SHEET = 'pedidos';
const HEADERS = ['id', 'cliente_id', 'cliente_nombre', 'fecha', 'estado', 'total', 'notas', 'tipo'];

class SheetsOrderRepository {
    async init() { await sheetsClient.ensureSheetExists(SHEET, HEADERS); }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Order(r)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    async getById(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const r = rows.find(r => r.id === id);
        return r ? new Order(r) : null;
    }

    async create(order) {
        const data = { ...order };
        delete data.items; // items stored separately
        await sheetsClient.appendRow(SHEET, HEADERS, data);
        return order;
    }

    async update(id, data) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        const updated = { ...row, ...data };
        await sheetsClient.updateRow(SHEET, row._rowIndex, HEADERS, updated);
        return new Order(updated);
    }

    async delete(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return false;
        const sheetId = await sheetsClient.getSheetIdByName(SHEET);
        await sheetsClient.deleteRow(SHEET, row._rowIndex, sheetId);
        return true;
    }
}

module.exports = SheetsOrderRepository;
