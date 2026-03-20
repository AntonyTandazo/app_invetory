// ============================================================
// APP.JS — Router, navigation, window controls
// ============================================================

const API = window.electronAPI;
const pages = ['dashboard', 'products', 'sales', 'clients', 'cobranza', 'deliveries', 'reports', 'settings'];
const pageTitles = {
    dashboard: 'Dashboard',
    products: 'Productos',
    sales: 'Gestión de Ventas',
    clients: 'Gestión de Clientes',
    cobranza: 'Cobranza',
    deliveries: 'Entregas',
    reports: 'Reportes',
    settings: 'Configuración',
};

const pageLoaders = {
    dashboard: () => Dashboard.load(),
    products: () => Products.load(),
    sales: () => Sales.load(),
    clients: () => Clients.load(),
    cobranza: () => Cobranza.load(),
    deliveries: () => Deliveries.load(),
    reports: () => Reports.load(),
    settings: () => Settings.load(),
};

let currentPage = 'dashboard';

function navigate(page) {
    if (!pages.includes(page)) return;

    // Update nav items
    pages.forEach(p => {
        const btn = document.getElementById('nav-' + p);
        if (btn) btn.classList.toggle('active', p === page);
    });

    // Show correct page div
    pages.forEach(p => {
        const el = document.getElementById('page-' + p);
        if (el) el.classList.toggle('active', p === page);
    });

    // Update titlebar
    document.getElementById('titlebar-title').textContent = pageTitles[page] || page;

    currentPage = page;

    // Load page data
    const loading = document.getElementById('page-loading');
    loading.style.display = 'flex';
    Promise.resolve(pageLoaders[page] && pageLoaders[page]())
        .catch(console.error)
        .finally(() => { loading.style.display = 'none'; });
}

// Nav click handlers
pages.forEach(p => {
    const btn = document.getElementById('nav-' + p);
    if (btn) btn.addEventListener('click', () => navigate(p));
});

document.getElementById('nav-logout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión y salir?')) {
        API.auth.logout().then(() => API.close());
    }
});

// Hamburger toggle
const sidebar = document.getElementById('sidebar');
document.getElementById('hamburger').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Window controls
document.getElementById('win-min').addEventListener('click', () => API.minimize());
document.getElementById('win-max').addEventListener('click', () => API.maximize());
document.getElementById('win-close').addEventListener('click', () => API.close());

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('page-loading');
    loading.style.display = 'flex';
    Promise.resolve(Dashboard.load()).finally(() => { loading.style.display = 'none'; });
});
