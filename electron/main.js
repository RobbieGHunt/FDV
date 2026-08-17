const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#121316',
    title: 'Flexible Data Viewer (FDV)',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    frame: true,
    autoHideMenuBar: true
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler for file dialog
ipcMain.handle('dialog:openFiles', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Data Files (*.csv, *.tsv, *.txt, *.xy, *.dat)', extensions: ['csv', 'tsv', 'txt', 'xy', 'dat', 'asc'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const filesData = [];
  for (const filePath of result.filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const name = path.basename(filePath);
      filesData.push({ path: filePath, name, content });
    } catch (err) {
      console.error('Failed to read file:', filePath, err);
    }
  }
  return filesData;
});

// IPC handler for executing Python bridge script
ipcMain.handle('python:runScript', async (event, { scriptPath, args, stdinData }) => {
  return new Promise((resolve, reject) => {
    const pythonExe = process.env.PYTHON_PATH || 'python';
    const pyProcess = spawn(pythonExe, [scriptPath, ...(args || [])]);

    let stdoutData = '';
    let stderrData = '';

    if (stdinData) {
      pyProcess.stdin.write(stdinData);
      pyProcess.stdin.end();
    }

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdoutData);
          resolve({ success: true, data: parsed });
        } catch (e) {
          resolve({ success: true, raw: stdoutData });
        }
      } else {
        resolve({ success: false, error: stderrData || `Exited with code ${code}` });
      }
    });

    pyProcess.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});
