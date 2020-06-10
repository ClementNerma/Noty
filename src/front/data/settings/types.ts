import { JsonValue, List } from 'typescript-core'

import { actions } from '../../actions'

export interface Settings {
  autoSaveDelay: number
  editor: EditorSettings
  keymaps: List<KeyMapsEntry>
}

export interface EditorSettings {
  fontFamily: string
  fontSize: number
  tabSize: number
  theme: string
  showPrintMargin: boolean
}

export type KeyMapsEntry = {
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  key: string
  action: keyof typeof actions
}

export function encodeSettings(settings: Settings): string {
  return new JsonValue(settings as any).stringify(4)
}
