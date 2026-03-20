const { google } = require('googleapis');
const { shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(app.getPath('userData'), 'token.json');

class GoogleAuthAdapter {
    constructor() {
        this.oAuth2Client = null;
        this.credentials = null;
    }

    setCredentials(credentials) {
        this.credentials = credentials;
        const { client_id, client_secret } = credentials.installed || credentials.web;
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000/oauth2callback');
    }

    isAuthenticated() {
        if (!this.oAuth2Client) return false;
        try {
            if (fs.existsSync(TOKEN_PATH)) {
                const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
                this.oAuth2Client.setCredentials(token);
                return true;
            }
        } catch (e) { }
        return false;
    }

    async getAuthUrl() {
        return this.oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
    }

    async exchangeCodeForToken(code) {
        const { tokens } = await this.oAuth2Client.getToken(code);
        this.oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        return tokens;
    }

    async startLocalServerAndGetCode() {
        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                const url = new URL(req.url, 'http://localhost:3000');
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');

                if (code) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h2>Autenticación exitosa. Puedes cerrar esta ventana.</h2></body></html>');
                    server.close();
                    resolve(code);
                } else if (error) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end(`<html><body><h2>Error de autenticación: ${error}</h2><p>Por favor, inténtalo de nuevo.</p></body></html>`);
                    server.close();
                    reject(new Error(`Authentication failed: ${error}`));
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h2>Error de autenticación</h2><p>No se recibió el código de autorización. Por favor, inténtalo de nuevo.</p></body></html>');
                    server.close();
                    reject(new Error('No code or error received'));
                }
            });
            server.listen(3000, '127.0.0.1', () => console.log('[OAuth] Callback server listening on http://127.0.0.1:3000'));
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    reject(new Error('El puerto 3000 está ocupado. Cierra otras aplicaciones y vuelve a intentarlo.'));
                } else {
                    reject(err);
                }
            });
        });
    }

    async authenticate() {
        if (this.isAuthenticated()) return this.oAuth2Client;
        // Start the local callback server FIRST, then open the browser
        // This avoids any race condition where Google redirects before the server is ready
        const codePromise = this.startLocalServerAndGetCode();
        const authUrl = await this.getAuthUrl();
        shell.openExternal(authUrl);
        const code = await codePromise;
        await this.exchangeCodeForToken(code);
        return this.oAuth2Client;
    }

    getClient() { return this.oAuth2Client; }

    clearToken() {
        if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
        if (this.oAuth2Client) this.oAuth2Client.setCredentials(null);
    }
}

module.exports = new GoogleAuthAdapter();
