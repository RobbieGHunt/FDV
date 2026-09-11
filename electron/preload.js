const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  runPythonScript: (payload) => ipcRenderer.invoke('python:runScript', payload),
  getPathForFile: (file) => (file && webUtils ? webUtils.getPathForFile(file) : (file?.path || '')),
  isElectron: true
});


