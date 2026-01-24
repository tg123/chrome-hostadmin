const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const resolveHostsPath = () => {
  if (process.platform === 'win32') {
    return path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');
  }
  return '/etc/hosts';
};

const hostsPath = resolveHostsPath();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
};

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

const safeResult = (fn) => {
  try {
    return fn();
  } catch (error) {
    return { error: error.message };
  }
};

ipcMain.on('hostadmin-get', (event) => {
  event.returnValue = safeResult(() => fs.readFileSync(hostsPath, 'utf8'));
});

ipcMain.on('hostadmin-set', (event, data) => {
  event.returnValue = safeResult(() => {
    fs.writeFileSync(hostsPath, data, 'utf8');
    return true;
  });
});

ipcMain.on('hostadmin-time', (event) => {
  event.returnValue = safeResult(() => {
    const stat = fs.statSync(hostsPath);
    return stat.mtimeMs;
  });
});
