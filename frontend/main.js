/**
 * Frontend: Electron Main Process — Entry point for Electron app.
 *
 * Creates main window, manages sidecar processes.
 *
 * Wing: smartdoc_frontend
 * Topic: electron_main
 * Last Updated: 2026-05-06
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SidecarManager = require('./src/main/sidecar-manager');

let mainWindow = null;
let sidecar = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        show: false,
        backgroundColor: '#0f172a',
    });

    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function setupSidecar() {
    sidecar = new SidecarManager();

    // IPC: Check hardware
    ipcMain.handle('hardware-check', async () => {
        try {
            await sidecar.start('hardware-check', 'hardware_check.py', {
                onMessage: (data) => {
                    try {
                        const result = JSON.parse(data);
                        if (mainWindow && result.gpu) {
                            mainWindow.webContents.send('hardware-check-result', result);
                        }
                    } catch {}
                },
            });

            const result = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
                const handler = (_event, data) => {
                    clearTimeout(timeout);
                    resolve(data);
                };
                const entry = sidecar.processes.get('hardware-check');
                if (entry) {
                    const origHandler = entry.process.stdout.listeners('data').slice(-1)[0];
                    // Already handled via onMessage
                }
                ipcMain.once('hardware-check-result-internal', handler);
                setTimeout(() => {
                    cleanup();
                    resolve({ status: 'ok', gpu: { gpu_detected: false, recommended_mode: 'hybrid' } });
                }, 5000);

                function cleanup() {
                    clearTimeout(timeout);
                    ipcMain.removeListener('hardware-check-result-internal', handler);
                }
            });

            return result;
        } catch (error) {
            return { status: 'error', error: error.message, gpu: { gpu_detected: false, recommended_mode: 'hybrid' } };
        }
    });

    ipcMain.handle('sidecar-status', async () => {
        return sidecar ? sidecar.getStatus() : {};
    });

    ipcMain.handle('sidecar-health', async (_event, name) => {
        return sidecar ? sidecar.healthCheck(name) : false;
    });

    ipcMain.handle('sidecar-stop', async (_event, name) => {
        if (sidecar) {
            return sidecar.stop(name);
        }
        return false;
    });
}

app.whenReady().then(() => {
    setupSidecar();
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

app.on('before-quit', () => {
    if (sidecar) {
        sidecar.stopAll();
    }
});

ipcMain.handle('open-file-dialog', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths;
    }
    return [];
});
