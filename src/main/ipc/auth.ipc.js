const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function registerAuthIpc(ipcMain, googleAuth, app, sheetsClient, repos) {
    ipcMain.handle('auth:loadCredentials', async (e, credsJson) => {
        try {
            const creds = typeof credsJson === 'string' ? JSON.parse(credsJson) : credsJson;
            googleAuth.setCredentials(creds);
            // Save to userData
            const credPath = path.join(app.getPath('userData'), 'credentials.json');
            fs.writeFileSync(credPath, JSON.stringify(creds));
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    });

    ipcMain.handle('auth:authenticate', async () => {
        try {
            await googleAuth.authenticate();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    });

    ipcMain.handle('auth:setSpreadsheet', async (e, spreadsheetId) => {
        try {
            sheetsClient.setSpreadsheetId(spreadsheetId);
            // Persist spreadsheet ID
            const cfgPath = path.join(app.getPath('userData'), 'config.json');
            let cfg = {};
            if (fs.existsSync(cfgPath)) cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
            cfg.spreadsheetId = spreadsheetId;
            fs.writeFileSync(cfgPath, JSON.stringify(cfg));
            // Init sheets
            await Promise.all(Object.values(repos).map(r => r.init()));
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    });

    ipcMain.handle('auth:getSpreadsheetId', async () => {
        const cfgPath = path.join(app.getPath('userData'), 'config.json');
        if (fs.existsSync(cfgPath)) {
            const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
            return cfg.spreadsheetId || null;
        }
        return null;
    });

    ipcMain.handle('auth:logout', async () => {
        googleAuth.clearToken();
        return { ok: true };
    });
}

module.exports = { registerAuthIpc };
