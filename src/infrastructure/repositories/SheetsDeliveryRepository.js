const sheetsClient = require('../google/GoogleSheetsClient');
const Delivery = require('../../domain/models/Delivery');

const SHEET = 'entregas';
const HEADERS = ['id', 'pedido_id', 'cliente_nombre', 'repartidor', 'fecha_estimada', 'estado', 'direccion', 'total'];

class SheetsDeliveryRepository {
    async init() { await sheetsClient.ensureSheetExists(SHEET, HEADERS); }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Delivery(r));
    }

    async getById(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const r = rows.find(r => r.id === id);
        return r ? new Delivery(r) : null;
    }

    async create(delivery) {
        await sheetsClient.appendRow(SHEET, HEADERS, delivery);
        return delivery;
    }

    async updateStatus(id, estado) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        const updated = { ...row, estado };
        await sheetsClient.updateRow(SHEET, row._rowIndex, HEADERS, updated);
        return new Delivery(updated);
    }
}

module.exports = SheetsDeliveryRepository;
