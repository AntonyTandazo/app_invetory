// Domain Model: Delivery
class Delivery {
    constructor({ id, pedido_id, cliente_nombre = '', repartidor = '', fecha_estimada = '', estado = 'pendiente', direccion = '', total = 0 }) {
        this.id = id;
        this.pedido_id = pedido_id;
        this.cliente_nombre = cliente_nombre;
        this.repartidor = repartidor;
        this.fecha_estimada = fecha_estimada;
        this.estado = estado; // pendiente | en_camino | entregado
        this.direccion = direccion;
        this.total = Number(total) || 0;
    }
}
module.exports = Delivery;
