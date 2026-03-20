// Domain Model: Sale
class Sale {
    constructor({ id, pedido_id, fecha, total, metodo_pago = 'efectivo', estado = 'pagado',
        cliente_nombre = '', monto_pagado, items,
        descuento_pct, descuento_monto, iva_pct, iva_monto, cliente_id }) {
        this.id = id;
        this.pedido_id = pedido_id;
        this.fecha = fecha || new Date().toISOString();
        this.total = Number(total) || 0;
        this.monto_pagado = Number(monto_pagado ?? total) || 0;
        this.metodo_pago = metodo_pago;
        this.estado = estado;
        this.cliente_nombre = cliente_nombre;
        this.cliente_id = cliente_id || '';
        // items stored as JSON string in sheets, parsed back here
        if (typeof items === 'string') {
            try { this.items = JSON.parse(items); } catch { this.items = []; }
        } else {
            this.items = Array.isArray(items) ? items : [];
        }
        this.descuento_pct = Number(descuento_pct) || 0;
        this.descuento_monto = Number(descuento_monto) || 0;
        this.iva_pct = Number(iva_pct) || 0;
        this.iva_monto = Number(iva_monto) || 0;
    }
}
module.exports = Sale;
