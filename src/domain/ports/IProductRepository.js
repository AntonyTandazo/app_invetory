/**
 * PORT: IProductRepository
 */
class IProductRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getById(id) { throw new Error('Not implemented'); }
    async create(product) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async getLowStock() { throw new Error('Not implemented'); }
}
module.exports = IProductRepository;
