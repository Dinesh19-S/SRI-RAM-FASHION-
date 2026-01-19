const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // In production, load the local index.html.
    // In development, you might want to load 'http://localhost:5173' if you prefer HMR,
    // but simpler to point to the build output or check env vars.
    // For this setup, we'll try to load the dev server if we can detect it, or fallback to file.

    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:5173');
        // Open the DevTools.
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
