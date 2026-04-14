const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// ─── Configuration ───
const NEXT_DIR = path.resolve(__dirname, '..', 'nureli');
const PORT = 3000;
const ADMIN_URL = `http://localhost:${PORT}/admin`;

let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverProcess = null;
let serverReady = false;

// ─── Check if server is already running ───
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/admin/auth`, (res) => {
      resolve(true);
      req.destroy();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

// ─── Start Next.js Server ───
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('[NorlaAdmin] Starting Next.js server...');

    // Use npm run dev
    const isWin = process.platform === 'win32';
    serverProcess = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: NEXT_DIR,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let resolved = false;

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[Server]', msg.trim());

      // Detect when server is ready
      if (!resolved && (msg.includes('Ready in') || msg.includes('started server'))) {
        resolved = true;
        serverReady = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('[Server] Failed to start:', err);
      if (!resolved) reject(err);
    });

    serverProcess.on('exit', (code) => {
      serverReady = false;
      console.log('[Server] Exited with code:', code);
    });

    // Timeout fallback — check if server is reachable after 15s
    setTimeout(async () => {
      if (!resolved) {
        const running = await checkServer();
        if (running) {
          resolved = true;
          serverReady = true;
          resolve();
        }
      }
    }, 15000);

    // Hard timeout — 30s
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(); // Resolve anyway, we'll show error in UI if needed
      }
    }, 30000);
  });
}

// ─── Create Splash Screen ───
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

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
    if (splashWindow) {
      splashWindow.destroy();
      splashWindow = null;
    }
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
    tray.setToolTip('Norla Admin — Server Running');

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Admin Panel', click: () => { if (mainWindow) mainWindow.show(); else createMainWindow(); } },
      { type: 'separator' },
      { label: `Server: http://localhost:${PORT}`, enabled: false },
      { label: 'Open in Browser', click: () => shell.openExternal(ADMIN_URL) },
      { type: 'separator' },
      { label: 'Quit', click: () => { stopServer(); app.quit(); } },
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

// ─── Stop Server ───
function stopServer() {
  if (serverProcess) {
    console.log('[NorlaAdmin] Stopping server...');
    try {
      // On Windows, kill the process tree
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t'], { shell: true });
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch { /* ignore */ }
    serverProcess = null;
    serverReady = false;
  }
}

// ─── App Lifecycle ───
app.whenReady().then(async () => {
  // Show splash screen
  createSplash();

  // Check if server is already running
  const alreadyRunning = await checkServer();

  if (!alreadyRunning) {
    try {
      await startServer();
    } catch (err) {
      console.error('[NorlaAdmin] Server start failed:', err);
      dialog.showErrorBox('Server Error', 'Failed to start the Norla server. Make sure dependencies are installed:\n\ncd nureli && npm install');
    }
  } else {
    console.log('[NorlaAdmin] Server already running');
    serverReady = true;
  }

  // Wait a bit for server to fully initialize
  await new Promise(r => setTimeout(r, 2000));

  // Create main window and tray
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
  if (process.platform !== 'darwin') {
    // Don't quit — keep server running
  }
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
});

app.on('before-quit', () => {
  stopServer();
});
