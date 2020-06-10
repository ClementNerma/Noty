import * as path from 'path'
import { Result } from 'typescript-core'

import { removeFile, writeFileUtf8 } from '../fs'
import { savedPath, sessionPath } from '../paths'
import { Session } from './decode'
import { encodeSession } from './encode'

export function saveSession(session: Session): Result<void, Error> {
  return writeFileUtf8(sessionPath, encodeSession(session))
}

export function saveUnsaved(id: number, content: string): Result<void, Error> {
  return writeFileUtf8(path.join(savedPath, id.toString()), content)
}

export function removeSaved(id: number): Result<void, Error> {
  return removeFile(path.join(savedPath, id.toString()))
}
