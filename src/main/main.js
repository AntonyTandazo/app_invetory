const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Infrastructure
const googleAuth = require('../infrastructure/google/GoogleAuthAdapter');
const sheetsClient = require('../infrastructure/google/GoogleSheetsClient');

// Repositories
const SheetsClientRepository = require('../infrastructure/repositories/SheetsClientRepository');
const SheetsProductRepository = require('../infrastructure/repositories/SheetsProductRepository');
const SheetsCategoryRepository = require('../infrastructure/repositories/SheetsCategoryRepository');
const SheetsOrderRepository = require('../infrastructure/repositories/SheetsOrderRepository');
const SheetsSaleRepository = require('../infrastructure/repositories/SheetsSaleRepository');
const SheetsDeliveryRepository = require('../infrastructure/repositories/SheetsDeliveryRepository');
const SheetsPaymentRepository = require('../infrastructure/repositories/SheetsPaymentRepository');

// IPC handlers
const { registerAuthIpc } = require('./ipc/auth.ipc');
const { registerClientsIpc } = require('./ipc/clients.ipc');
const { registerProductsIpc } = require('./ipc/products.ipc');
const { registerSalesIpc } = require('./ipc/sales.ipc');
const { registerDeliveriesIpc } = require('./ipc/deliveries.ipc');
const { registerPaymentsIpc } = require('./ipc/payments.ipc');
const { registerReportsIpc } = require('./ipc/reports.ipc');

let mainWindow;
const iconPath = path.join(__dirname, '../../IconoInventory.ico');

// Global repository instances
const repos = {
    clients: new SheetsClientRepository(),
    products: new SheetsProductRepository(),
    categories: new SheetsCategoryRepository(),
    orders: new SheetsOrderRepository(),
    sales: new SheetsSaleRepository(),
    deliveries: new SheetsDeliveryRepository(),
    payments: new SheetsPaymentRepository(),
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function loadConfig() {
    const cfgPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(cfgPath)) {
        try { return JSON.parse(fs.readFileSync(cfgPath, 'utf-8')); } catch (e) { }
    }
    return {};
}

function createAuthWindow() {
    const win = new BrowserWindow({
        width: 480, height: 620,
        resizable: false,
        frame: false,
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.loadFile(path.join(__dirname, '../renderer/pages/auth.html'));
    return win;
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280, height: 800,
        minWidth: 1024, minHeight: 600,
        frame: false,
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
    return mainWindow;
}

async function initRepositories() {
    try {
        await Promise.all(Object.values(repos).map(r => r.init()));
        console.log('✅ All sheet repositories initialized');
    } catch (e) {
        console.error('❌ Error initializing repositories:', e.message);
    }
}

// ──────────────────────────────────────────────────────────────
// App startup
// ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {

    // ── 1. REGISTER ALL IPC HANDLERS FIRST (before any window opens) ──
    //    This prevents the "No handler registered" race condition where
    //    the renderer fires IPC calls before handlers are ready.
    registerAuthIpc(ipcMain, googleAuth, app, sheetsClient, repos);
    registerClientsIpc(ipcMain, repos);
    registerProductsIpc(ipcMain, repos);
    registerSalesIpc(ipcMain, repos);
    registerDeliveriesIpc(ipcMain, repos);
    registerPaymentsIpc(ipcMain, repos);
    registerReportsIpc(ipcMain, repos);

    // Window controls
    ipcMain.on('window:minimize', () => mainWindow?.minimize());
    ipcMain.on('window:maximize', () => {
        if (mainWindow?.isMaximized()) mainWindow.restore();
        else mainWindow?.maximize();
    });
    ipcMain.on('window:close', () => mainWindow?.close());

    // ── AUTO-UPDATER SETUP ──
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'AntonyTandazo',
        repo: 'app_invetory'
    });
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    const sendUpdateStatus = (status, data = {}) => {
        console.log('[updater]', status, data);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater:status', { status, ...data });
        }
    };

    autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
    autoUpdater.on('update-available', (info) => sendUpdateStatus('available', { version: info.version }));
    autoUpdater.on('update-not-available', () => sendUpdateStatus('up-to-date'));
    autoUpdater.on('download-progress', (prog) => sendUpdateStatus('downloading', { percent: Math.round(prog.percent) }));
    autoUpdater.on('update-downloaded', (info) => sendUpdateStatus('downloaded', { version: info.version }));
    autoUpdater.on('error', (err) => {
        console.error('[updater] Error:', err);
        sendUpdateStatus('error', { message: err?.message || 'Error desconocido' });
    });

    ipcMain.handle('update:check', async () => {
        try { const r = await autoUpdater.checkForUpdates(); console.log('[updater] check result:', r?.updateInfo?.version); return { ok: true }; }
        catch (e) { console.error('[updater] check error:', e); return { ok: false, error: e.message }; }
    });
    ipcMain.handle('update:download', async () => {
        try { console.log('[updater] Starting download...'); await autoUpdater.downloadUpdate(); return { ok: true }; }
        catch (e) { console.error('[updater] download error:', e); sendUpdateStatus('error', { message: e.message }); return { ok: false, error: e.message }; }
    });
    ipcMain.handle('update:install', () => {
        autoUpdater.quitAndInstall(false, true);
    });
    ipcMain.handle('update:getVersion', () => app.getVersion());

    // ── 2. LOAD PERSISTED CREDENTIALS ──
    const credPath = path.join(app.getPath('userData'), 'credentials.json');
    const legacyCredPath = path.join(__dirname, '../../credentials.json');
    let credFile = null;
    if (fs.existsSync(credPath)) credFile = credPath;
    else if (fs.existsSync(legacyCredPath)) credFile = legacyCredPath;

    if (credFile) {
        try {
            const creds = JSON.parse(fs.readFileSync(credFile, 'utf-8'));
            googleAuth.setCredentials(creds);
        } catch (e) {
            console.error('Failed to load credentials:', e.message);
        }
    }

    // ── 3. LOAD PERSISTED SPREADSHEET ID ──
    const cfg = loadConfig();
    if (cfg.spreadsheetId) {
        sheetsClient.setSpreadsheetId(cfg.spreadsheetId);
        console.log('📄 Loaded spreadsheet ID from config:', cfg.spreadsheetId);
    }

    // ── 4. DECIDE WINDOW: auth or main ──
    if (credFile && googleAuth.isAuthenticated() && cfg.spreadsheetId) {
        // Fully configured — go straight to main window
        createMainWindow();
        // Init repos in background (non-blocking — IPC handlers respond gracefully if data not ready)
        initRepositories().catch(console.error);
    } else {
        // Need auth setup
        const authWin = createAuthWindow();
        ipcMain.once('auth:success', async () => {
            authWin.close();
            createMainWindow();
            initRepositories().catch(console.error);
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
