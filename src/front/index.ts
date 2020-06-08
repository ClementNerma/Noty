import './panics'

import * as fs from 'fs'

import { List, eprintln } from 'typescript-core'
import { appDom, dragOverlay } from './dom'
import { dataInit, saveSettings } from './data/fs'
import { decodeSettings, defaultSettings } from './data/settings'
import { fail, onTabClose, onTabUpdate, setCurrentTab, settings, tabs } from './state'
import { invalidatedSettingsPath, settingsPath } from './data/paths'

import { Tab } from './tab'
import { actions } from './actions'
import { errorDialog } from './dialogs'
import { loadSession } from './data/session/load'

// Must be run at startup
dataInit()

// Load settings
settings.init(
  decodeSettings(fs.readFileSync(settingsPath, 'utf8')).unwrapOrElse((err) => {
    errorDialog('Failed to decode settings file, falling back to default settings instead.\nReason:\n' + err.render())
    fs.renameSync(settingsPath, invalidatedSettingsPath)

    const settings = defaultSettings()
    saveSettings(defaultSettings())
    return settings
  })
)

// Restore previous session
loadSession().map(([session, saved]) => {
  const newTabs = new List<Tab>()

  for (const tab of session.tabs) {
    newTabs.push(
      new Tab({ settings: settings.unwrap(), ...tab, content: saved.get(tab.id).unwrapOr(''), onUpdate: onTabUpdate, onClose: onTabClose })
    )
  }

  const activeTab = session.activeTab.andThen((activeTabIndex) =>
    newTabs.get(activeTabIndex).none(() => {
      eprintln('Loaded session contains {} tabs but active tab index is {}.', newTabs.length, activeTabIndex)
    })
  )

  activeTab.some(setCurrentTab).none(() => newTabs.first().some(setCurrentTab))

  tabs.push(...newTabs)
})

// Make the frameless window draggable
window.addEventListener('keydown', (event) => {
  if (!event.ctrlKey && !event.shiftKey && event.altKey) {
    dragOverlay.classList.add('draggable')
  }
})

window.addEventListener('keyup', (event) => {
  if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
    dragOverlay.classList.remove('draggable')
  }
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

// Open a new tab when double-clicking on the empty window
appDom.addEventListener('dblclick', () => {
  if (tabs.empty()) {
    actions.createTab()
  }
})

// Finished loading
document.body.classList.remove('loading')
