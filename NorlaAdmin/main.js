const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron');
const path = require('path');

// ─── Configuration ───
// Point directly to your newly deployed production backend!
const ADMIN_URL = 'https://norla-server.onrender.com/admin';

let mainWindow = null;
let tray = null;

// ─── Create Main Window ───
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Norla Admin',
    icon: path.join(__dirname, '..', 'LOGO', 'Norla_with_bg_logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(ADMIN_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

// ─── System Tray ───
function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'LOGO', 'Norla_with_bg_logo.png');
    tray = new Tray(iconPath);
    tray.setToolTip('Norla Admin');

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Admin Panel', click: () => { if (mainWindow) mainWindow.show(); else createMainWindow(); } },
      { type: 'separator' },
      { label: `Connected to Production Server`, enabled: false },
      { label: 'Open in Browser', click: () => shell.openExternal(ADMIN_URL) },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.quit(); } },
    ]);
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) mainWindow.show();
      else createMainWindow();
    });
  } catch (err) {
    console.error('[Tray] Failed:', err);
  }
}

// ─── App Lifecycle ───
app.whenReady().then(async () => {
  // Create main window and tray
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
  if (process.platform !== 'darwin') {
    // Keep app alive in tray
  }
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
});
