import * as fs from 'fs'
import * as path from 'path'
import { Dictionary, None, Option, Some } from 'typescript-core'

import { errorDialog } from '../../dialogs'
import { invalidatedSessionPath, savedPath, sessionPath } from '../paths'
import { Session, decodeSession } from './decode'

export function loadSession(): Option<[Session, Dictionary<number, string>]> {
  if (!fs.existsSync(sessionPath)) {
    return None()
  }

  const session = decodeSession(fs.readFileSync(sessionPath, 'utf8'))
    .map((session) => Some(session))
    .unwrapOrElse((err) => {
      errorDialog('Cannot recover invalid session, creating empty session instead.\nReason:\n' + err.render())
      fs.renameSync(sessionPath, invalidatedSessionPath)
      return None()
    })

  return session.map((session) => {
    const saved = new Dictionary<number, string>()

    for (const tab of session.tabs) {
      const filePath = path.join(savedPath, tab.id.toString())

      if (!fs.existsSync(filePath)) {
        errorDialog(`A tab's data is missing from the previous session.\nRemoving this tab instead.`)
        session.tabs.remove(tab)
        continue
      }

      saved.set(tab.id, fs.readFileSync(filePath, 'utf8'))
    }

    return [session, saved]
  })
}
