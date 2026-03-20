const Product = require('../../models/Product');

class GetProducts {
    constructor(productRepository, categoryRepository) {
        this.repo = productRepository;
        this.catRepo = categoryRepository;
    }
    async execute(filters = {}) {
        let products = await this.repo.getAll();
        if (filters.search) {
            const s = filters.search.toLowerCase();
            products = products.filter(p => p.nombre.toLowerCase().includes(s) || p.codigo?.toLowerCase().includes(s));
        }
        if (filters.status === 'bajo') products = products.filter(p => p.isLowStock());
        if (filters.status === 'critico') products = products.filter(p => p.isCriticalStock());
        if (filters.status === 'disponible') products = products.filter(p => !p.isLowStock() && !p.isCriticalStock());
        return products;
    }
}

class GetLowStockProducts {
    constructor(productRepository) { this.repo = productRepository; }
    async execute() {
        const products = await this.repo.getAll();
        return products.filter(p => p.isLowStock() || p.isCriticalStock());
    }
}

class CreateProduct {
    constructor(productRepository) { this.repo = productRepository; }
    async execute(data) {
        const id = 'PROD-' + Date.now();
        const product = new Product({ ...data, id });
        return await this.repo.create(product);
    }
}

class UpdateProduct {
    constructor(productRepository) { this.repo = productRepository; }
    async execute(id, data) { return await this.repo.update(id, data); }
}

class DeleteProduct {
    constructor(productRepository) { this.repo = productRepository; }
    async execute(id) { return await this.repo.delete(id); }
}

class GetInventoryStats {
    constructor(productRepository) { this.repo = productRepository; }
    async execute() {
        const products = await this.repo.getAll();
        const total = products.length;
        const valorTotal = products.reduce((a, p) => a + p.getValue(), 0);
        const bajoStock = products.filter(p => p.isLowStock()).length;
        const critico = products.filter(p => p.isCriticalStock()).length;
        return { total, valorTotal, bajoStock, critico };
    }
}

module.exports = { GetProducts, GetLowStockProducts, CreateProduct, UpdateProduct, DeleteProduct, GetInventoryStats };
