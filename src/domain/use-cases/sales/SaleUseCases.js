const Order = require('../../models/Order');
const Sale = require('../../models/Sale');

class RegisterSale {
    constructor(orderRepository, saleRepository, productRepository, clientRepository) {
        this.orderRepo = orderRepository;
        this.saleRepo = saleRepository;
        this.productRepo = productRepository;
        this.clientRepo = clientRepository;
    }

    async execute({ cliente_id, cliente_nombre = '', items, metodo_pago, monto_pagado, notas = '', tipo = 'venta', direccion = '', repartidor = '', fecha_estimada = '',
        descuento_pct = 0, descuento_monto = 0, iva_pct = 0, iva_monto = 0, total_final }) {
        // Use total_final from frontend (which includes IVA & descuento) if provided
        const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const total = total_final != null ? Number(total_final) : subtotal;
        const montoPagado = Number(monto_pagado) || 0;
        const deudaGenerada = Math.max(0, total - montoPagado);
        const estadoPago = deudaGenerada <= 0 ? 'pagado' : montoPagado > 0 ? 'parcial' : 'pendiente';

        // Create order
        const orderId = 'ORD-' + Date.now();
        const order = new Order({
            id: orderId, cliente_id, cliente_nombre, total,
            notas, tipo, estado: 'completado', items,
            direccion, repartidor, fecha_estimada
        });
        await this.orderRepo.create(order);

        // Sequential sale ID: read existing sales to find max sequence
        const prefix = tipo === 'servicio' ? 'SVC' : 'VTA';
        const allSales = await this.saleRepo.getAll();
        const maxSeq = allSales
            .filter(s => s.id && s.id.startsWith(prefix + '-'))
            .reduce((max, s) => {
                const num = parseInt(s.id.replace(prefix + '-', ''), 10);
                // Ignore old timestamp-based IDs (> 10 digits)
                return (isNaN(num) || num > 9999999999) ? max : Math.max(max, num);
            }, 0);
        const saleId = prefix + '-' + String(maxSeq + 1).padStart(10, '0');
        const sale = new Sale({
            id: saleId,
            pedido_id: orderId,
            cliente_id,
            cliente_nombre,
            total,
            monto_pagado: montoPagado,
            metodo_pago,
            estado: estadoPago,
            items,               // ← stored as JSON in sheet
            descuento_pct,
            descuento_monto,
            iva_pct,
            iva_monto,
        });
        await this.saleRepo.create(sale);

        // Update product stock (skip service items with no producto_id)
        for (const item of items) {
            if (item.producto_id) {
                const product = await this.productRepo.getById(item.producto_id);
                if (product) {
                    await this.productRepo.update(item.producto_id, {
                        stock_actual: Math.max(0, Number(product.stock_actual) - Number(item.cantidad))
                    });
                }
            }
        }

        // Update client stats and accumulated debt
        if (cliente_id) {
            const client = await this.clientRepo.getById(cliente_id);
            if (client) {
                await this.clientRepo.update(cliente_id, {
                    deuda: Math.max(0, (Number(client.deuda) || 0) + deudaGenerada),
                    total_compras: (Number(client.total_compras) || 0) + 1
                });
            }
        }

        return { order, sale, deudaGenerada, estadoPago };
    }
}

class GetSales {
    constructor(saleRepository) { this.repo = saleRepository; }
    async execute(filters = {}) {
        const sales = await this.repo.getAll();
        let result = sales;
        if (filters.fecha) result = result.filter(s => s.fecha && s.fecha.startsWith(filters.fecha));
        return result;
    }
}

class GetDashboardStats {
    constructor(clientRepository, productRepository, saleRepository) {
        this.clientRepo = clientRepository;
        this.productRepo = productRepository;
        this.saleRepo = saleRepository;
    }

    async execute() {
        const [clients, products, sales] = await Promise.all([
            this.clientRepo.getAll(),
            this.productRepo.getAll(),
            this.saleRepo.getAll()
        ]);

        const today = new Date().toISOString().split('T')[0];
        const ventasHoy = sales
            .filter(s => s.fecha && s.fecha.startsWith(today))
            .reduce((sum, s) => sum + s.total, 0);

        const totalClientes = clients.length;
        const stockTotal = products.reduce((sum, p) => sum + p.stock_actual, 0);
        const lowStock = products.filter(p => p.isLowStock() || p.isCriticalStock());

        return { totalClientes, stockTotal, ventasHoy, lowStock };
    }
}

module.exports = { RegisterSale, GetSales, GetDashboardStats };
