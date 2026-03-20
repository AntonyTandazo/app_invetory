// Domain Model: Product
class Product {
    constructor({ id, codigo, nombre, categoria_id, categoria_nombre = '', precio, stock_actual, stock_minimo, activo = true }) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.categoria_id = categoria_id;
        this.categoria_nombre = categoria_nombre;
        this.precio = Number(precio) || 0;
        this.stock_actual = Number(stock_actual) || 0;
        this.stock_minimo = Number(stock_minimo) || 0;
        this.activo = activo;
    }

    isLowStock() { return this.stock_actual <= this.stock_minimo && this.stock_actual > 0; }
    isCriticalStock() { return this.stock_actual === 0; }
    getStockStatus() {
        if (this.isCriticalStock()) return 'critico';
        if (this.isLowStock()) return 'bajo';
        return 'disponible';
    }
    getValue() { return this.precio * this.stock_actual; }
}

module.exports = Product;
