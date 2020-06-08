'use strict'

import * as fs from 'fs'
import * as minimist from 'minimist'
import * as npath from 'path'

import { BrowserWindow, Event, Menu, Tray, app, dialog, globalShortcut, screen } from 'electron'
import { MaybeUninit, proxies } from 'typescript-core'

function fail(errorMessage: string, details?: string): never {
  dialog.showMessageBoxSync({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Nox - Internal Error',
    message: errorMessage,
    detail: details,
  })

  console.error('ERROR: ' + errorMessage)

  if (details !== undefined) {
    console.error(
      details
        .split('\n')
        .map((line) => '> ' + line)
        .join('\n')
    )
  }

  process.exit(1)
}

function validateResource(title: string, pathParts: string[]): string {
  const path = npath.join(__dirname, '..', ...pathParts)

  if (!fs.existsSync(path)) {
    fail(`Resource "${title}" was not found`, `Path "${path}" was not found`)
  }

  return path
}

proxies.panicWatcher = (message) => fail(message)

const APP_ICON_PATH = new MaybeUninit<string>()
const HTML_VIEW_PATH = new MaybeUninit<string>()

const cmdArgs = minimist(process.argv.slice(2))

let mainWindow: BrowserWindow | null = null
let appIcon: Tray | null = null
let isQuiting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      // TODO: Find a better alternative to this deprecated module
      enableRemoteModule: true,
    },
    useContentSize: true,
    show: false,
    icon: APP_ICON_PATH.expect("App icon's path was not initialized"),

    // NOTE: Must be the same as the color defined in the main page's loading overlay
    backgroundColor: '#282c34',
  })

  mainWindow.loadFile(HTML_VIEW_PATH.expect("HTML view's path was not initialized"))
  mainWindow.removeMenu()
  mainWindow.setFullScreen(false)

  if (cmdArgs['dev-tools']) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('close', (event: Event) => {
    if (!isQuiting && !cmdArgs['disable-background']) {
      event.preventDefault()
      mainWindow?.hide()
    }

    return false
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    appIcon = null
  })

  mainWindow.setMenuBarVisibility(false)

  appIcon = new Tray(APP_ICON_PATH.expect("App icon's path was not initialized"))

  appIcon.on('click', () => showWindow())

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => showWindow(),
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true
        app.quit()
      },
    },
  ])

  appIcon.setContextMenu(contextMenu)

  if (cmdArgs['keyboard-shortcut']) {
    globalShortcut.register('CommandOrControl+Alt+M', () => {
      if (!mainWindow) return

      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        showWindow()
      }
    })
  }

  if (!cmdArgs['start-hidden']) {
    showWindow()
  }
}

function showWindow() {
  if (mainWindow) {
    const dims = screen.getPrimaryDisplay().workAreaSize
    mainWindow.setSize(Math.floor(dims.width / 2), Math.floor(dims.height / 2))
    mainWindow.center()
    mainWindow.show()
    mainWindow.focus()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  APP_ICON_PATH.init(validateResource('icon', ['assets', 'icon.png']))
  HTML_VIEW_PATH.init(validateResource('view', ['view', 'index.html']))

  createWindow()
})

app.on('before-quit', () => (isQuiting = true))

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Prevent from opening two instances
app.requestSingleInstanceLock()

// Handle opening of a second instance
app.on('second-instance', (_, commandLine) => {
  if (!mainWindow) {
    throw new Error('Main application is still opened with a main window!')
  }

  const scndArgs = minimist(commandLine)

  // By default, running the program while another instance is running will show the window
  // But if the '--toggle' flag is provided, it will simply toggle the window's visibility
  if (scndArgs.toggle) {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      showWindow()
    }
  } else {
    showWindow()
  }
})
