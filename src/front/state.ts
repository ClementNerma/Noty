import { remote } from 'electron'
import { List, None, Ok, Option, Result, assert } from 'typescript-core'

import { dataInit } from './data/fs'
import { removeSaved, saveSession, saveUnsaved } from './data/session/save'
import { loadSettings } from './data/settings/load'
import { errorDialog } from './dialogs'
import { Tab } from './tab'

export function fail(errorMessage: string, internal = false): never {
  errorDialog(errorMessage, internal)
  remote.app.exit(1)
  throw new Error(errorMessage)
}

// Singleton to ensure this module isn't run twice
const _initProp = '___appStateModuleAlreadyInit'
assert(!(window as any)[_initProp], 'State module was run twice!')
;(window as any)[_initProp] = true
assert!((window as any)[_initProp], 'Failed to save state module initialization indicator')

// Must be run at startup
dataInit()

// Settings
export const settings = loadSettings()

// Opened tabs
export const tabs = new List<Tab>()

// Current tab
export const currentTab: Option<Tab> = None()

// Save timeout
const saveTimeout = None<NodeJS.Timeout>()

// Set the current editor
export function setCurrentTab(tab: Tab) {
  for (const otherEditor of tabs) {
    if (otherEditor.id !== tab.id) {
      otherEditor.setActive(false)
    }
  }

  tab.setActive(true)

  currentTab.replace(tab)
}

export function saveUpdatedSession(): Result<void, Error> {
  return saveSession({
    activeTab: currentTab.map((currentTab) => tabs.indexOf(currentTab)),
    tabs: tabs.map((tab) => ({
      id: tab.id,
      path: tab.getPath(),
      language: tab.getLanguage(),
      originalContent: tab.getOriginalContentInfos(),
      cursorPosition: tab.getCursorPosition(),
    })),
  }).withErr((err) => errorDialog('Failed to save session to disk:\n>' + err.message))
}

export function saveTabData(tab: Tab): Result<void, Error> {
  return saveUnsaved(tab.id, tab.getContent())
    .andThen(() => saveUpdatedSession())
    .withErr((err) => errorDialog('Failed to save tab to disk:\n> ' + err.message))
}

// Perform a complete save of the current state
export function saveCompleteState(): Result<void, Error> {
  return saveUpdatedSession().andThen(() => {
    for (const tab of tabs) {
      const saved = saveTabData(tab)
      if (saved.isErr()) return saved
    }

    return Ok(undefined)
  })
}

// Handle tab update
export function onTabUpdate(tab: Tab) {
  saveTimeout
    .some((timeout) => clearTimeout(timeout))
    .replace(
      setTimeout(() => {
        saveTabData(tab)
      }, settings.autoSaveDelay)
    )
}

// Handle tab closing
export function onTabClose(tab: Tab) {
  saveUpdatedSession()
    .andThen(() => removeSaved(tab.id))
    .withErr((err) => console.error('Failed to remove saved file for tab with ID ' + tab.id, err))
}
