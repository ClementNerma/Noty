import { remote } from 'electron'
import * as path from 'path'

export const appDataPath = path.join(remote.app.getPath('home'), '.noty')

export const settingsPath = path.join(appDataPath, 'settings.json')
export const invalidatedSettingsPath = path.join(appDataPath, '_INVALIDATED_.settings.json')

export const sessionPath = path.join(appDataPath, 'session.json')
export const invalidatedSessionPath = path.join(appDataPath, '_INVALIDATED_.session.json')

export const savedPath = path.join(appDataPath, 'saved')
