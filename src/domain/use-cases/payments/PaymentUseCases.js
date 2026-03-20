const Payment = require('../../models/Payment');

class RegisterPayment {
    constructor(paymentRepository, clientRepository) {
        this.paymentRepo = paymentRepository;
        this.clientRepo = clientRepository;
    }
    async execute({ cliente_id, cliente_nombre = '', monto, metodo, referencia = '' }) {
        // Sequential payment ID
        const allPayments = await this.paymentRepo.getAll();
        const maxSeq = allPayments
            .filter(p => p.id && p.id.startsWith('PAG-'))
            .reduce((max, p) => {
                const num = parseInt(p.id.replace('PAG-', ''), 10);
                // Ignore old timestamp-based IDs (> 10 digits)
                return (isNaN(num) || num > 9999999999) ? max : Math.max(max, num);
            }, 0);
        const id = 'PAG-' + String(maxSeq + 1).padStart(10, '0');

        // Reduce client debt first so we can compute saldo_restante
        let saldo_restante = 0;
        const client = await this.clientRepo.getById(cliente_id);
        if (client) {
            const nuevaDeuda = Math.max(0, (Number(client.deuda) || 0) - monto);
            saldo_restante = nuevaDeuda;
            await this.clientRepo.update(cliente_id, { deuda: nuevaDeuda });
            // Use stored client name if not passed
            if (!cliente_nombre) cliente_nombre = client.nombre || '';
        }

        const payment = new Payment({ id, cliente_id, cliente_nombre, monto, metodo, referencia, saldo_restante });
        await this.paymentRepo.create(payment);
        return payment;
    }
}

class GetDebts {
    constructor(clientRepository) { this.repo = clientRepository; }
    async execute(search = '') {
        const clients = await this.repo.getAll();
        let deudores = clients.filter(c => c.hasDebt());
        if (search) {
            const s = search.toLowerCase();
            deudores = deudores.filter(c => c.nombre.toLowerCase().includes(s) || c.cedula_ruc?.includes(s));
        }
        return deudores;
    }
}

class GetPayments {
    constructor(paymentRepository) { this.repo = paymentRepository; }
    async execute() { return await this.repo.getAll(); }
}

module.exports = { RegisterPayment, GetDebts, GetPayments };
