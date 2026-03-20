const { google } = require('googleapis');
const googleAuthAdapter = require('./GoogleAuthAdapter');

class GoogleSheetsClient {
    constructor() {
        this.spreadsheetId = null;
        this.sheets = null;
    }

    setSpreadsheetId(id) { this.spreadsheetId = id; }

    async getSheets() {
        if (!this.sheets) {
            const auth = googleAuthAdapter.getClient();
            this.sheets = google.sheets({ version: 'v4', auth });
        }
        return this.sheets;
    }

    async getRows(sheetName) {
        const sheets = await this.getSheets();
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`,
            });
            const rows = res.data.values || [];
            if (rows.length === 0) return [];
            const headers = rows[0];
            return rows.slice(1).map((row, idx) => {
                const obj = { _rowIndex: idx + 2 }; // 1-based, +1 for header
                headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
                return obj;
            }).filter(r => r.id && r.id !== ''); // only return rows that have an id
        } catch (e) {
            console.error(`Error reading sheet ${sheetName}:`, e.message);
            return [];
        }
    }

    async appendRow(sheetName, headers, values) {
        const sheets = await this.getSheets();
        const rowData = headers.map(h => values[h] !== undefined ? String(values[h]) : '');
        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });
    }

    async updateRow(sheetName, rowIndex, headers, values) {
        const sheets = await this.getSheets();
        const rowData = headers.map(h => values[h] !== undefined ? String(values[h]) : '');
        const colEnd = String.fromCharCode(64 + headers.length);
        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A${rowIndex}:${colEnd}${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });
    }

    async deleteRow(sheetName, rowIndex, sheetId) {
        const sheets = await this.getSheets();
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: { sheetId, dimension: 'ROWS', startIndex: rowIndex - 1, endIndex: rowIndex }
                    }
                }]
            }
        });
    }

    async ensureSheetExists(sheetName, headers) {
        const sheets = await this.getSheets();
        const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
        const existingSheets = meta.data.sheets.map(s => s.properties.title);
        if (!existingSheets.includes(sheetName)) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: [headers] }
            });
        }
    }

    async ensureHeaders(sheetName, headers) {
        try {
            const sheets = await this.getSheets();
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!1:1`,
            });
            const existing = (res.data.values?.[0] || []).join(',');
            const desired = headers.join(',');
            if (existing !== desired) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [headers] }
                });
                console.log(`✅ Headers updated for sheet: ${sheetName}`);
            }
        } catch (e) {
            console.error(`Error ensuring headers for ${sheetName}:`, e.message);
        }
    }

    async getSheetIdByName(sheetName) {
        const sheets = await this.getSheets();
        const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
        const s = meta.data.sheets.find(s => s.properties.title === sheetName);
        return s ? s.properties.sheetId : null;
    }
}

module.exports = new GoogleSheetsClient();
