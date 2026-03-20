const Delivery = require('../../models/Delivery');

class GetDeliveries {
    constructor(deliveryRepository) { this.repo = deliveryRepository; }
    async execute(filters = {}) {
        let deliveries = await this.repo.getAll();
        if (filters.estado) deliveries = deliveries.filter(d => d.estado === filters.estado);
        if (filters.search) {
            const s = filters.search.toLowerCase();
            deliveries = deliveries.filter(d => d.cliente_nombre.toLowerCase().includes(s) || String(d.pedido_id).includes(s));
        }
        return deliveries;
    }
}

class UpdateDeliveryStatus {
    constructor(deliveryRepository) { this.repo = deliveryRepository; }
    async execute(id, estado) { return await this.repo.updateStatus(id, estado); }
}

class CreateDelivery {
    constructor(deliveryRepository) { this.repo = deliveryRepository; }
    async execute(data) {
        const id = 'ENT-' + Date.now();
        const delivery = new Delivery({ ...data, id });
        return await this.repo.create(delivery);
    }
}

module.exports = { GetDeliveries, UpdateDeliveryStatus, CreateDelivery };
