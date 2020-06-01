import * as fs from 'fs'
import * as path from 'path'
import { appDataPath, settingsPath, sessionPath, invalidatedSessionPath } from './paths'
import { encodeSettings, defaultSettings, Settings } from './settings'
import { Option, None, Some } from 'typescript-core'
import { decodeSession, Session } from './session'
import { error } from '../state'

export function dataInit() {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath)
  }

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, encodeSettings(defaultSettings()))
  }
}

export function saveSettings(settings: Settings) {
  fs.writeFileSync(settingsPath, encodeSettings(settings))
}

export function loadSession(): Option<Session> {
  if (!fs.existsSync(sessionPath)) {
    return None()
  }

  return decodeSession(fs.readFileSync(sessionPath, 'utf8'))
    .map((session) => Some(session))
    .unwrapOrElse((err) => {
      error('Cannot recover invalid session, creating empty session instead.\nReason:\n' + err.render())
      fs.renameSync(sessionPath, invalidatedSessionPath)
      return None()
    })
}
