const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { startServer } = require('./proxy-server.cjs')

const isDev = !app.isPackaged

let proxyServer = null

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: '내주식보기',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  // HTML <title> 태그로 덮어씌워지는 것 방지
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault()
  })

  // Firebase Auth 팝업(Google 로그인) 허용
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Google OAuth 및 Firebase Auth 팝업은 새 창으로 허용
    if (
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('googleapis.com')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      }
    }
    // 그 외 외부 링크는 기본 브라우저로 열기
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    const distPath = path.join(__dirname, '../dist')
    const { server, port } = await startServer(distPath)
    proxyServer = server
    mainWindow.loadURL(`http://localhost:${port}`)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (proxyServer) proxyServer.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
