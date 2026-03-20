class IPaymentRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getByClient(clientId) { throw new Error('Not implemented'); }
    async create(payment) { throw new Error('Not implemented'); }
    async getMonthlyTotal() { throw new Error('Not implemented'); }
}
module.exports = IPaymentRepository;
