import './handle_panics'
import * as fs from 'fs'
import { List, eprintln } from 'typescript-core'
import { dataInit, loadSession, saveSettings } from './data/fs'
import { decodeSettings, defaultSettings } from './data/settings'
import { settingsPath, invalidatedSettingsPath } from './data/paths'
import { Tab } from './tab'
import { actions } from './actions'
import { fail, error, onTabUpdate, setCurrentTab, tabs, settings } from './state'

// Must be run at startup
dataInit()

// Load settings
settings.init(
  decodeSettings(fs.readFileSync(settingsPath, 'utf8')).unwrapOrElse((err) => {
    error('Failed to decode settings file, falling back to default settings instead.\nReason:\n' + err.render())
    fs.renameSync(settingsPath, invalidatedSettingsPath)

    const settings = defaultSettings()
    saveSettings(defaultSettings())
    return settings
  })
)

// Restore previous session
loadSession().map((session) => {
  const newTabs = new List<Tab>()

  for (const editor of session.tabs) {
    newTabs.push(new Tab({ settings: settings.unwrap(), ...editor, onUpdate: onTabUpdate }))
  }

  newTabs
    .get(session.activeTab)
    .some(setCurrentTab)
    .none(() => {
      eprintln('Loaded session contains {} tabs but active tab index is {}.', newTabs.length, session.activeTab)
      newTabs.first().some(setCurrentTab)
    })

  tabs.push(...newTabs)
})

// Set up keyboard shortcuts
window.addEventListener('keydown', (event) => {
  for (const mapping of settings.unwrap().keymaps) {
    if (
      (mapping.ctrl === undefined || mapping.ctrl === event.ctrlKey) &&
      (mapping.shift === undefined || mapping.shift === event.shiftKey) &&
      (mapping.alt === undefined || mapping.alt === event.altKey) &&
      mapping.key.toLocaleLowerCase() === event.key.toLocaleLowerCase()
    ) {
      console.debug('Detected keyboard shortcut: ' + mapping.action)

      if (!actions.hasOwnProperty(mapping.action)) {
        fail(`Validated mapping action "${mapping.action}" was not found`, true)
      }

      actions[mapping.action]()

      event.preventDefault()
      return false
    }
  }
  return
})
