import * as fs from 'fs'
import { List } from 'typescript-core'

import { errorDialog } from '../../dialogs'
import { themes } from '../../enums'
import { saveSettings } from '../fs'
import { invalidatedSettingsPath, settingsPath } from '../paths'
import { decodeSettings } from './decode'
import { KeyMapsEntry, Settings } from './types'

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
      { ctrl: true, shift: false, alt: false, key: 'L', action: 'toggleLanguagesSelector' },
      { ctrl: true, shift: false, alt: true, key: 'r', action: 'reload' },
      { ctrl: true, shift: false, alt: false, key: 'q', action: 'exit' },
      { ctrl: true, shift: true, alt: false, key: 'Q', action: 'exitCompletely' },
      { ctrl: false, shift: false, alt: false, key: 'F12', action: 'toggleDevTools' },
    ]),
  }
}

export function loadSettings(): Settings {
  return decodeSettings(fs.readFileSync(settingsPath, 'utf8')).unwrapOrElse((err) => {
    errorDialog('Failed to decode settings file, falling back to default settings instead.\nReason:\n' + err.render())
    fs.renameSync(settingsPath, invalidatedSettingsPath)

    const settings = defaultSettings()
    saveSettings(defaultSettings())
    return settings
  })
}

export function applySettings(editor: AceAjax.Editor, editorDom: HTMLElement, settings: Settings) {
  editor.setTheme('ace/theme/' + (settings.editor.theme in themes ? settings.editor.theme : 'one_dark'))
  editor.setShowPrintMargin(settings.editor.showPrintMargin)
  editorDom.style.fontFamily = settings.editor.fontFamily
  editorDom.style.fontSize = settings.editor.fontSize.toString() + 'px'
  editorDom.style.tabSize = settings.editor.tabSize.toString()
}
