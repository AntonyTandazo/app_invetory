/**
 * PORT: IClientRepository
 * Defines the contract that any client repository adapter must implement.
 */
class IClientRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getById(id) { throw new Error('Not implemented'); }
    async create(client) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
}
module.exports = IClientRepository;
