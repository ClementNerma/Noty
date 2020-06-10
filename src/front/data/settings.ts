import { Decoder, Decoders as d, JsonDecoder, JsonDecoders as j, JsonValue, List, O } from 'typescript-core'

import { actions } from '../actions'
import { themes } from '../enums'

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

export function defaultSettings(): Settings {
  return {
    autoSaveDelay: 500,
    editor: {
      fontFamily: '"Fira Code"',
      fontSize: 16,
      tabSize: 4,
      theme: 'one_dark',
      showPrintMargin: false,
    },
    keymaps: List.raw<KeyMapsEntry>([
      { ctrl: true, shift: true, alt: false, key: 'Tab', action: 'previousTab' },
      { ctrl: true, shift: false, alt: false, key: 'Tab', action: 'nextTab' },
      { ctrl: true, shift: false, alt: false, key: 's', action: 'saveTab' },
      { ctrl: true, shift: true, alt: false, key: 's', action: 'saveTabAs' },
      { ctrl: true, shift: false, alt: false, key: 'w', action: 'closeTab' },
      { ctrl: true, shift: true, alt: false, key: 'w', action: 'closeAllTabs' },
      { ctrl: true, shift: false, alt: false, key: 'n', action: 'createTab' },
      { ctrl: true, shift: false, alt: true, key: 'r', action: 'reload' },
      { ctrl: true, shift: false, alt: false, key: 'q', action: 'exit' },
      { ctrl: true, shift: true, alt: false, key: 'Q', action: 'exitCompletely' },
      { ctrl: false, shift: false, alt: false, key: 'F12', action: 'toggleDevTools' },
    ]),
  }
}

export function applySettings(editor: AceAjax.Editor, editorDom: HTMLElement, settings: Settings) {
  editor.setTheme('ace/theme/' + (settings.editor.theme in themes ? settings.editor.theme : 'one_dark'))
  editor.setShowPrintMargin(settings.editor.showPrintMargin)
  editorDom.style.fontFamily = settings.editor.fontFamily
  editorDom.style.fontSize = settings.editor.fontSize.toString() + 'px'
  editorDom.style.tabSize = settings.editor.tabSize.toString()
}

export function encodeSettings(settings: Settings): string {
  return new JsonValue(settings as any).stringify(4)
}

const _editorSettingsDecoder: JsonDecoder<EditorSettings> = j.mapped5([
  ['theme', j.string],
  ['fontFamily', j.string],
  ['fontSize', j.number],
  ['tabSize', j.number],
  ['showPrintMargin', j.boolean],
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
  j.mapped3([
    ['autoSaveDelay', j.number],
    ['editor', _editorSettingsDecoder],
    ['keymaps', j.arrayOf(_keyMapsEntryDecoder)],
  ])
)
