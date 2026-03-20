// ============================================================
// UTILS.JS — Shared utilities used by all page controllers
// ============================================================

// --- Toast notifications ---
const Toast = {
    show(msg, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, duration);
    }
};

// --- Modal ---
const Modal = {
    open(title, html, options = {}) {
        const overlay = document.getElementById('modal-overlay');
        const box = document.getElementById('modal-box');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = html;
        if (options.lg) box.classList.add('modal-lg'); else box.classList.remove('modal-lg');
        overlay.classList.add('open');
    },
    close() { document.getElementById('modal-overlay').classList.remove('open'); },
    setTitle(t) { document.getElementById('modal-title').textContent = t; }
};
document.getElementById('modal-close').addEventListener('click', () => Modal.close());
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') Modal.close(); });

// --- Currency ---
const fmt = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-EC') : '-';

// --- Status badge helper ---
function statusBadge(estado) {
    const map = {
        'pendiente': 'badge-yellow',
        'en_camino': 'badge-blue',
        'entregado': 'badge-green',
        'pagado': 'badge-green',
        'parcial': 'badge-yellow',
        'procesando': 'badge-blue',
        'completado': 'badge-green',
        'cancelado': 'badge-red',
        'disponible': 'badge-green',
        'bajo': 'badge-yellow',
        'critico': 'badge-red',
        'activo': 'badge-green',
        'inactivo': 'badge-gray',
    };
    const labels = {
        'pendiente': 'Pendiente',
        'en_camino': 'En camino',
        'entregado': 'Entregado',
        'pagado': 'Pagado',
        'parcial': 'Parcial',
        'procesando': 'Procesando',
        'completado': 'Completado',
        'cancelado': 'Cancelado',
        'disponible': 'Disponible',
        'bajo': 'Bajo stock',
        'critico': 'Crítico',
        'activo': 'Activo',
        'inactivo': 'Inactivo',
    };
    const cls = map[estado] || 'badge-gray';
    const lbl = labels[estado] || estado;
    return `<span class="badge ${cls}">${lbl}</span>`;
}

// --- Safe IPC call wrapper ---
async function ipc(fn, ...args) {
    try { return await fn(...args); } catch (e) { console.error(e); return { ok: false, error: e.message }; }
}
