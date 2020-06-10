import * as fs from 'fs'
import { Err, Ok, Result } from 'typescript-core'

import { appDataPath, savedPath, settingsPath } from './paths'
import { defaultSettings } from './settings/load'
import { Settings, encodeSettings } from './settings/types'

export function dataInit() {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath)
  }

  if (!fs.existsSync(savedPath)) {
    fs.mkdirSync(savedPath)
  }

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, encodeSettings(defaultSettings()))
  }
}

export function saveSettings(settings: Settings) {
  fs.writeFileSync(settingsPath, encodeSettings(settings))
}

export function writeFileUtf8(path: string, content: string): Result<void, Error> {
  try {
    fs.writeFileSync(path, content, 'utf8')
  } catch (e) {
    return Err(e)
  }

  return Ok(undefined)
}

export function removeFile(path: string): Result<void, Error> {
  try {
    fs.unlinkSync(path)
  } catch (e) {
    return Err(e)
  }

  return Ok(undefined)
}
