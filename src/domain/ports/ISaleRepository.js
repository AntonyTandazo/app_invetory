class ISaleRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getByDate(date) { throw new Error('Not implemented'); }
    async create(sale) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
}
module.exports = ISaleRepository;
