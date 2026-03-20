const Client = require('../../models/Client');

class GetClients {
    constructor(clientRepository) { this.repo = clientRepository; }
    async execute(filters = {}) {
        const clients = await this.repo.getAll();
        let result = clients;
        if (filters.activo !== undefined) result = result.filter(c => c.isActive() === filters.activo);
        if (filters.deuda) result = result.filter(c => c.hasDebt());
        if (filters.search) {
            const s = filters.search.toLowerCase();
            result = result.filter(c => c.nombre.toLowerCase().includes(s) || c.cedula_ruc?.includes(s));
        }
        return result;
    }
}

class CreateClient {
    constructor(clientRepository) { this.repo = clientRepository; }
    async execute(data) {
        const id = 'CLI-' + Date.now();
        const client = new Client({ ...data, id });
        return await this.repo.create(client);
    }
}

class UpdateClient {
    constructor(clientRepository) { this.repo = clientRepository; }
    async execute(id, data) { return await this.repo.update(id, data); }
}

class DeleteClient {
    constructor(clientRepository) { this.repo = clientRepository; }
    async execute(id) { return await this.repo.delete(id); }
}

module.exports = { GetClients, CreateClient, UpdateClient, DeleteClient };
