// Domain Model: Order
class Order {
    constructor({ id, cliente_id, cliente_nombre = '', fecha, estado = 'pendiente', total, notas = '', tipo = 'venta', items = [] }) {
        this.id = id;
        this.cliente_id = cliente_id;
        this.cliente_nombre = cliente_nombre;
        this.fecha = fecha || new Date().toISOString();
        this.estado = estado; // pendiente | procesando | completado | cancelado
        this.total = Number(total) || 0;
        this.notas = notas;
        this.tipo = tipo; // venta | servicio
        this.items = items;
    }
}
module.exports = Order;
