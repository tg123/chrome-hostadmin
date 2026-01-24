const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hostadminElectron', {
  get: () => ipcRenderer.sendSync('hostadmin-get'),
  set: (data) => ipcRenderer.sendSync('hostadmin-set', data),
  time: () => ipcRenderer.sendSync('hostadmin-time')
});
