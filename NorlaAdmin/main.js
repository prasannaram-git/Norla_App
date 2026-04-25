const { app, BrowserWindow, Tray, Menu, shell, dialog, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');

// ─── Configuration ───
const ADMIN_URL = 'https://norla-server.onrender.com/admin';
const LOCAL_URL = 'http://localhost:3000/admin';
const APP_NAME = 'Norla Admin';

let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverUrl = ADMIN_URL;

// ─── Utility: Check if a URL is reachable ───
function checkUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// ─── Splash Screen ───
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 340,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: getIcon(),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ─── Main Window ───
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: APP_NAME,
    icon: getIcon(),
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load the admin panel
  mainWindow.loadURL(serverUrl);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Load Failed] ${errorCode}: ${errorDescription}`);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    if (tray && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── System Tray ───
function createTray() {
  try {
    const icon = getIcon();
    if (!icon) return;
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip(APP_NAME);

    const updateMenu = () => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Admin Panel', click: showWindow },
        { type: 'separator' },
        { label: `Server: ${serverUrl === LOCAL_URL ? 'Local' : 'Production'}`, enabled: false },
        { label: 'Open in Browser', click: () => shell.openExternal(serverUrl) },
        { type: 'separator' },
        { label: 'Reload', click: () => { if (mainWindow) mainWindow.reload(); } },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
      ]);
      tray.setContextMenu(contextMenu);
    };
    updateMenu();

    tray.on('double-click', showWindow);
  } catch (err) {
    console.error('[Tray] Failed:', err);
  }
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

function getIcon() {
  const iconPaths = [
    path.join(__dirname, '..', 'LOGO', 'Norla_with_bg_logo.png'),
    path.join(__dirname, 'icon.png'),
  ];
  for (const p of iconPaths) {
    try {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    } catch { /* try next */ }
  }
  return null;
}

// ─── App Lifecycle ───
app.whenReady().then(async () => {
  // Show splash
  createSplash();

  // Try local server first (for development), then production
  const localAvailable = await checkUrl(LOCAL_URL, 3000);
  if (localAvailable) {
    serverUrl = LOCAL_URL;
    console.log('[Norla Admin] Using local server:', LOCAL_URL);
  } else {
    serverUrl = ADMIN_URL;
    console.log('[Norla Admin] Using production server:', ADMIN_URL);
  }

  // Create main window + tray
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep alive in tray on Windows
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
});

// Handle certificate errors for self-signed local certs
app.on('certificate-error', (event, webContents, url, error, cert, callback) => {
  if (url.startsWith('https://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
