import './panics'

import { List, eprintln } from 'typescript-core'

import { actions } from './actions'
import { loadSession } from './data/session/load'
import { appDom } from './dom'
import { initKeyboardShortcuts } from './keyboard'
import { onTabClose, onTabUpdate, setCurrentTab, settings, tabs } from './state'
import { Tab } from './tab'

// Restore previous session
loadSession().map(([session, saved]) => {
  const newTabs = new List<Tab>()

  for (const tab of session.tabs) {
    newTabs.push(new Tab({ settings, ...tab, content: saved.get(tab.id).unwrapOr(''), onUpdate: onTabUpdate, onClose: onTabClose }))
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
