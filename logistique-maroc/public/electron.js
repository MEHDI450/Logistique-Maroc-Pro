const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // Ligne suivante optionnelle si vous n'avez pas d'icone
    icon: path.join(__dirname, 'favicon.ico') 
  });

  // Charge l'application React une fois compilée
  win.loadFile(path.join(__dirname, '../build/index.html'));
  
  // Enlève la barre de menu grise (Fichier, Edition...)
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});