// Domain Model: Payment
class Payment {
    constructor({ id, cliente_id, cliente_nombre = '', monto, fecha, metodo = 'efectivo', referencia = '', saldo_restante = 0 }) {
        this.id = id;
        this.cliente_id = cliente_id;
        this.cliente_nombre = cliente_nombre;
        this.monto = Number(monto) || 0;
        this.fecha = fecha || new Date().toISOString();
        this.metodo = metodo;
        this.referencia = referencia;
        this.saldo_restante = Number(saldo_restante) || 0;
    }
}
module.exports = Payment;
