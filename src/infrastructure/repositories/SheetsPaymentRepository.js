const sheetsClient = require('../google/GoogleSheetsClient');
const Payment = require('../../domain/models/Payment');

const SHEET = 'pagos';
const HEADERS = ['id', 'cliente_id', 'cliente_nombre', 'monto', 'fecha', 'metodo', 'referencia', 'saldo_restante'];

class SheetsPaymentRepository {
    async init() {
        await sheetsClient.ensureSheetExists(SHEET, HEADERS);
        await sheetsClient.ensureHeaders(SHEET, HEADERS);
    }

    async getAll() {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.map(r => new Payment(r)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    async getByClient(clientId) {
        const rows = await sheetsClient.getRows(SHEET);
        return rows.filter(r => r.cliente_id === clientId).map(r => new Payment(r));
    }

    async create(payment) {
        await sheetsClient.appendRow(SHEET, HEADERS, payment);
        return payment;
    }

    async getMonthlyTotal() {
        const payments = await this.getAll();
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthly = payments.filter(p => p.fecha && p.fecha.startsWith(monthStr));
        return monthly.reduce((sum, p) => sum + p.monto, 0);
    }
}

module.exports = SheetsPaymentRepository;
