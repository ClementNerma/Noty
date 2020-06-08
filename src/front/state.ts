import { List, MaybeUninit, None, Option, Ref, Some } from 'typescript-core'

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

// Handle tab update
export function onTabUpdate(tab: Tab, content: string) {
  // TODO: Save after a delay
  console.log('update', { id: tab.id, content })
}
