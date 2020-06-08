import { Decoder, JsonDecoder, JsonValue, List, O, Option, Decoders as d, JsonDecoders as j, proxies } from 'typescript-core'

import { actions } from '../actions'
import { themes } from '../enums'

export interface Settings {
  editor: EditorSettings
  keymaps: List<KeyMapsEntry>
}

export interface EditorSettings {
  fontFamily: string
  fontSize: number
  tabSize: number
  theme: string
}

export type KeyMapsEntry = {
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  key: string
  action: keyof typeof actions
}

export function defaultSettings(): Settings {
  return {
    editor: {
      fontFamily: '"Fira Code"',
      fontSize: 16,
      tabSize: 4,
      theme: 'one_dark',
    },
    keymaps: List.raw<KeyMapsEntry>([
      { ctrl: true, shift: true, alt: false, key: 'Tab', action: 'previousTab' },
      { ctrl: true, shift: false, alt: false, key: 'Tab', action: 'nextTab' },
      { ctrl: true, shift: false, alt: false, key: 'w', action: 'closeTab' },
      { ctrl: true, shift: true, alt: false, key: 'w', action: 'closeAllTabs' },
      { ctrl: true, shift: false, alt: false, key: 'n', action: 'createTab' },
      { ctrl: true, shift: false, alt: true, key: 'r', action: 'reload' },
      { ctrl: false, shift: false, alt: false, key: 'F12', action: 'toggleDevTools' },
    ]),
  }
}

export function applySettings(editor: AceAjax.Editor, editorDom: HTMLElement, settings: Settings) {
  editor.setTheme('ace/theme/' + (settings.editor.theme in themes ? settings.editor.theme : 'one_dark'))
  editorDom.style.fontFamily = settings.editor.fontFamily
  editorDom.style.fontSize = settings.editor.fontSize.toString() + 'px'
  editorDom.style.tabSize = settings.editor.tabSize.toString()
}

export function encodeSettings(settings: Settings): string {
  return new JsonValue(settings as any).stringify(4)
}

const _editorSettingsDecoder: JsonDecoder<EditorSettings> = j.mapped4([
  ['theme', j.string],
  ['fontFamily', j.string],
  ['fontSize', j.number],
  ['tabSize', j.number],
])

const _keyMapsEntryDecoder: JsonDecoder<KeyMapsEntry> = j.mapped5([
  ['ctrl', j.maybe(j.boolean)],
  ['shift', j.maybe(j.boolean)],
  ['alt', j.maybe(j.boolean)],
  ['key', j.string],
  ['action', d.then(j.string, d.oneOf(O.keys(actions)))],
])

export const decodeSettings: Decoder<string, Settings> = d.then(
  j.parse,
  j.mapped2([
    ['editor', _editorSettingsDecoder],
    ['keymaps', j.arrayOf(_keyMapsEntryDecoder)],
  ])
)
