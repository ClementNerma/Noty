import './panics'

import * as fs from 'fs'

import { List, eprintln, Some } from 'typescript-core'
import { appDom, languagesOverlay, createElement } from './dom'
import { dataInit, saveSettings } from './data/fs'
import { decodeSettings, defaultSettings } from './data/settings'
import { onTabClose, onTabUpdate, setCurrentTab, settings, tabs, currentTab } from './state'
import { invalidatedSettingsPath, settingsPath } from './data/paths'

import { Tab } from './tab'
import { actions } from './actions'
import { errorDialog } from './dialogs'
import { loadSession } from './data/session/load'
import { languages } from './enums'
import { initKeyboardShortcuts } from './keyboard'

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

// Set up listeners for keyboard shortcuts
initKeyboardShortcuts()

// Open a new tab when double-clicking on the empty window
appDom.addEventListener('dblclick', () => {
  if (tabs.empty()) {
    actions.createTab()
  }
})

// Finished loading
document.body.classList.remove('loading')
