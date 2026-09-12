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
      contextIsolation: true
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

  // Prevent navigation when files are dropped onto the window
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isDev = !app.isPackaged && navigationUrl.startsWith('http://localhost:3000');
    if (!isDev) {
      event.preventDefault();
    }
  });

  // Prevent unwanted popup or external window creation
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));


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
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const name = path.basename(filePath);
      filesData.push({ path: filePath, name, content });
    } catch (err) {
      console.error('Failed to read file:', filePath, err);
    }
  }
  return filesData;
});

function getPythonExecutable() {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const condaWin = 'C:\\Users\\robhu413\\AppData\\Local\\anaconda3\\python.exe';
  if (process.platform === 'win32' && fs.existsSync(condaWin)) {
    return condaWin;
  }
  return 'python';
}

// IPC handler for executing Python bridge script or custom script code
ipcMain.handle('python:runScript', async (event, { scriptPath, args, stdinData, action, scriptCode, params }) => {
  return new Promise((resolve) => {
    const pythonExe = getPythonExecutable();
    const bridgePath = path.join(__dirname, '../core/bridge.py');

    let execArgs = [];
    let tempScriptPath = null;

    if (action) {
      // Bridge invocation mode
      execArgs = [bridgePath, '--action', action];

      if (scriptCode) {
        tempScriptPath = path.join(
          app.getPath('temp'),
          `fdv_script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.py`
        );
        fs.writeFileSync(tempScriptPath, scriptCode, 'utf-8');
        execArgs.push('--script', tempScriptPath);
      } else if (scriptPath) {
        execArgs.push('--script', scriptPath);
      }

      if (params) {
        execArgs.push('--params', typeof params === 'string' ? params : JSON.stringify(params));
      }
      if (args && Array.isArray(args)) {
        execArgs.push(...args);
      }
    } else {
      // Direct script invocation mode
      execArgs = [scriptPath || bridgePath, ...(args || [])];
    }

    const pyProcess = spawn(pythonExe, execArgs);
    let stdoutData = '';
    let stderrData = '';
    let hasTimedOut = false;

    const timeoutTimer = setTimeout(() => {
      hasTimedOut = true;
      try { pyProcess.kill(); } catch (_) {}
      resolve({ success: false, error: 'Python execution timed out after 30 seconds.' });
    }, 30000);

    if (stdinData) {
      try {
        pyProcess.stdin.write(stdinData);
        pyProcess.stdin.end();
      } catch (err) {
        console.error('Failed writing to python stdin:', err);
      }
    }

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      clearTimeout(timeoutTimer);
      if (tempScriptPath && fs.existsSync(tempScriptPath)) {
        try { fs.unlinkSync(tempScriptPath); } catch (_) {}
      }
      if (hasTimedOut) return;

      if (code === 0) {
        try {
          const parsed = JSON.parse(stdoutData);
          resolve({ success: true, data: parsed });
        } catch (e) {
          resolve({ success: true, raw: stdoutData });
        }
      } else {
        let errMsg = stderrData || `Exited with code ${code}`;
        try {
          const errJson = JSON.parse(stderrData);
          if (errJson.error) errMsg = errJson.error;
        } catch (_) {}
        resolve({ success: false, error: errMsg });
      }
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timeoutTimer);
      if (tempScriptPath && fs.existsSync(tempScriptPath)) {
        try { fs.unlinkSync(tempScriptPath); } catch (_) {}
      }
      resolve({ success: false, error: err.message });
    });
  });
});
