const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),

    // Auth
    auth: {
        loadCredentials: (creds) => ipcRenderer.invoke('auth:loadCredentials', creds),
        authenticate: () => ipcRenderer.invoke('auth:authenticate'),
        setSpreadsheet: (id) => ipcRenderer.invoke('auth:setSpreadsheet', id),
        getSpreadsheetId: () => ipcRenderer.invoke('auth:getSpreadsheetId'),
        logout: () => ipcRenderer.invoke('auth:logout'),
        success: () => ipcRenderer.send('auth:success'),
    },

    // Clients
    clients: {
        getAll: (filters) => ipcRenderer.invoke('clients:getAll', filters),
        create: (data) => ipcRenderer.invoke('clients:create', data),
        update: (id, data) => ipcRenderer.invoke('clients:update', id, data),
        delete: (id) => ipcRenderer.invoke('clients:delete', id),
    },

    // Products
    products: {
        getAll: (filters) => ipcRenderer.invoke('products:getAll', filters),
        create: (data) => ipcRenderer.invoke('products:create', data),
        update: (id, data) => ipcRenderer.invoke('products:update', id, data),
        delete: (id) => ipcRenderer.invoke('products:delete', id),
        getStats: () => ipcRenderer.invoke('products:getStats'),
        getLowStock: () => ipcRenderer.invoke('products:getLowStock'),
        // Categories
        categories: {
            getAll: () => ipcRenderer.invoke('categories:getAll'),
            create: (data) => ipcRenderer.invoke('categories:create', data),
            delete: (id) => ipcRenderer.invoke('categories:delete', id),
        }
    },

    // Sales & Orders
    sales: {
        register: (data) => ipcRenderer.invoke('sales:register', data),
        getAll: (filters) => ipcRenderer.invoke('sales:getAll', filters),
        getRecent: (n) => ipcRenderer.invoke('sales:getRecent', n),
        getDashboardStats: () => ipcRenderer.invoke('sales:getDashboardStats'),
        getOrders: (filters) => ipcRenderer.invoke('orders:getAll', filters),
    },

    // Deliveries
    deliveries: {
        getAll: (filters) => ipcRenderer.invoke('deliveries:getAll', filters),
        updateStatus: (id, estado) => ipcRenderer.invoke('deliveries:updateStatus', id, estado),
    },

    // Payments & Cobranza
    payments: {
        register: (data) => ipcRenderer.invoke('payments:register', data),
        getAll: () => ipcRenderer.invoke('payments:getAll'),
        getDebts: (search) => ipcRenderer.invoke('payments:getDebts', search),
        getMonthlyTotal: () => ipcRenderer.invoke('payments:getMonthlyTotal'),
    },

    // Reports
    reports: {
        getSalesReport: (period) => ipcRenderer.invoke('reports:getSalesReport', period),
        getTopProducts: (period) => ipcRenderer.invoke('reports:getTopProducts', period),
        getTopClients: (period) => ipcRenderer.invoke('reports:getTopClients', period),
        getTopCategories: (period) => ipcRenderer.invoke('reports:getTopCategories', period),
    }
});
