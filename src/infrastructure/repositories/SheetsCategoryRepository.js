const sheetsClient = require('../google/GoogleSheetsClient');
const Category = require('../../domain/models/Category');

const SHEET = 'categorias';
const HEADERS = ['id', 'nombre'];

class SheetsCategoryRepository {
    async init() { await sheetsClient.ensureSheetExists(SHEET, HEADERS); }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Category(r));
    }

    async create(data) {
        const cat = new Category({ id: 'CAT-' + Date.now(), nombre: data.nombre });
        await sheetsClient.appendRow(SHEET, HEADERS, cat);
        return cat;
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

module.exports = SheetsCategoryRepository;
