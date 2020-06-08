import { List, MaybeUninit, None, Ok, Option, Ref, Result, Some } from 'typescript-core'
import { removeSaved, saveSession, saveUnsaved } from './data/session/save'

import { Settings } from './data/settings'
import { Tab } from './tab'
import { errorDialog } from './dialogs'
import { remote } from 'electron'

export function fail(errorMessage: string, internal = false): never {
  errorDialog(errorMessage, internal)
  remote.app.exit(1)
  throw new Error(errorMessage)
}

export function exit() {
  remote.app.exit()
}

// Settings
export const settings = new MaybeUninit<Settings>()

// Opened tabs
export const tabs = new List<Tab>()

// Current tab
export const currentTab: Ref<Option<Tab>> = Ref.wrap(None())

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

  currentTab.write(Some(tab))
}

export function saveUpdatedSession(): Result<void, Error> {
  return saveSession({
    activeTab: currentTab.read().map((currentTab) => tabs.indexOf(currentTab)),
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
      }, settings.expect('Internal error: received tab update before settings are initialized').autoSaveDelay)
    )
}

// Handle tab closing
export function onTabClose(tab: Tab) {
  saveUpdatedSession()
    .andThen(() => removeSaved(tab.id))
    .withErr((err) => console.error('Failed to remove saved file for tab with ID ' + tab.id, err))
}
