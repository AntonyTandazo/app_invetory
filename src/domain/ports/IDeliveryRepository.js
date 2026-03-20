class IDeliveryRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getById(id) { throw new Error('Not implemented'); }
    async create(delivery) { throw new Error('Not implemented'); }
    async updateStatus(id, estado) { throw new Error('Not implemented'); }
}
module.exports = IDeliveryRepository;
