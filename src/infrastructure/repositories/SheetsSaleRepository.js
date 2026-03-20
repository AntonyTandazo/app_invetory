const sheetsClient = require('../google/GoogleSheetsClient');
const Sale = require('../../domain/models/Sale');

const SHEET = 'ventas';
const HEADERS = [
    'id', 'pedido_id', 'cliente_id', 'cliente_nombre', 'fecha',
    'total', 'monto_pagado', 'metodo_pago', 'estado',
    'items', 'descuento_pct', 'descuento_monto', 'iva_pct', 'iva_monto'
];

class SheetsSaleRepository {
    async init() {
        await sheetsClient.ensureSheetExists(SHEET, HEADERS);
        // Ensure headers are up to date even if sheet already existed
        await sheetsClient.ensureHeaders(SHEET, HEADERS);
    }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Sale(r)).sort((a, b) => {
            const da = new Date(a.fecha), db = new Date(b.fecha);
            const va = !isNaN(da.getTime()), vb = !isNaN(db.getTime());
            if (!va && !vb) return 0;
            if (!va) return 1;   // invalid dates go to the bottom
            if (!vb) return -1;
            return db - da;      // newest first
        });
    }

    async getByDate(date) {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.filter(r => r.fecha && r.fecha.startsWith(date)).map(r => new Sale(r));
    }

    async create(sale) {
        // Serialize items array to JSON string for storage
        const row = { ...sale };
        if (Array.isArray(row.items)) {
            row.items = JSON.stringify(row.items);
        }
        try {
            console.log('[SheetsSaleRepository.create] Writing sale:', row.id, '| total:', row.total, '| iva_pct:', row.iva_pct, '| items_len:', row.items?.length);
            await sheetsClient.appendRow(SHEET, HEADERS, row);
            console.log('[SheetsSaleRepository.create] ✅ Success:', row.id);
        } catch (err) {
            console.error('[SheetsSaleRepository.create] ❌ FAILED for sale:', row.id, '| Error:', err.message);
            throw err;
        }
        return sale;
    }

    async update(id, data) {
        const rows = await sheetsClient.getRows(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        const updated = { ...row, ...data };
        if (Array.isArray(updated.items)) {
            updated.items = JSON.stringify(updated.items);
        }
        await sheetsClient.updateRow(SHEET, row._rowIndex, HEADERS, updated);
        return new Sale(updated);
    }
}

module.exports = SheetsSaleRepository;
