import { Decoder, Decoders as d, JsonDecoder, JsonDecoders as j, O } from 'typescript-core'

import { actions } from '../../actions'
import { EditorSettings, KeyMapsEntry, Settings } from './types'

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
