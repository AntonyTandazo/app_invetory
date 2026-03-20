const sheetsClient = require('../google/GoogleSheetsClient');
const Client = require('../../domain/models/Client');

const SHEET = 'clientes';
const HEADERS = ['id', 'nombre', 'cedula_ruc', 'telefono', 'email', 'direccion', 'activo', 'fecha_registro', 'total_compras', 'deuda'];

class SheetsClientRepository {
    async init() { await sheetsClient.ensureSheetExists(SHEET, HEADERS); }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Client(r));
    }

    async getById(id) {
        const rows = await sheetsClient.getRows(SHEET);
        const r = rows.find(r => r.id === id);
        return r ? new Client(r) : null;
    }

    async create(client) {
        await sheetsClient.appendRow(SHEET, HEADERS, client);
        return client;
    }

    async update(id, data) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        const updated = { ...row, ...data };
        await sheetsClient.updateRow(SHEET, row._rowIndex, HEADERS, updated);
        return new Client(updated);
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

module.exports = SheetsClientRepository;
