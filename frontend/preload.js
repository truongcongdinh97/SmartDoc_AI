/**
 * Frontend: Preload Script — Expose safe APIs to renderer process.
 *
 * Provides IPC bridge for sidecar management, file dialogs.
 *
 * Wing: smartdoc_frontend
 * Topic: electron_security
 * Last Updated: 2026-05-06
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    hardwareCheck: () => ipcRenderer.invoke('hardware-check'),
    getSidecarStatus: () => ipcRenderer.invoke('sidecar-status'),
    sidecarHealth: (name) => ipcRenderer.invoke('sidecar-health', name),
    sidecarStop: (name) => ipcRenderer.invoke('sidecar-stop', name),
    onHardwareCheckResult: (callback) => {
        ipcRenderer.on('hardware-check-result', (_event, data) => callback(data));
    },
});
