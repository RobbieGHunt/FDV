const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  runPythonScript: (payload) => ipcRenderer.invoke('python:runScript', payload),
  isElectron: true
});
