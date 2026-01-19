const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Expose specific methods here if needed
    // ping: () => ipcRenderer.invoke('ping'),
});
