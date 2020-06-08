import { currentTab, exit, onTabClose, onTabUpdate, setCurrentTab, settings, tabs } from './state'

import { None } from 'typescript-core'
import { Tab } from './tab'
import { remote } from 'electron'

export const actions = {
  previousTab() {
    currentTab.read().some((currentTab) => {
      const currentTabId = tabs.indexOf(currentTab)
      tabs.get(currentTabId === 0 ? tabs.length - 1 : currentTabId - 1).some((tab) => setCurrentTab(tab))
    })
  },

  nextTab() {
    currentTab.read().some((currentTab) => {
      const currentTabId = tabs.indexOf(currentTab)
      tabs.get(currentTabId === tabs.length - 1 ? 0 : currentTabId + 1).some((tab) => setCurrentTab(tab))
    })
  },

  closeTab() {
    currentTab.read().match({
      Some: (tab) => {
        // TODO: Check if there are any unsaved changes before
        const currentTabId = tabs.indexOf(tab)
        tab.close()

        if (currentTabId < tabs.length - 1) {
          setCurrentTab(tabs.getUnwrap(currentTabId + 1))
        } else if (currentTabId > 0) {
          setCurrentTab(tabs.getUnwrap(currentTabId - 1))
        } else {
          currentTab.write(None())
        }

        tabs.remove(tab)
      },

      None: () => exit(),
    })
  },

  closeAllTabs() {
    // TODO: Check if there are any unsaved changes before
    tabs.out((tab) => tab.close())
    currentTab.write(None())
  },

  createTab() {
    const position = currentTab
      .read()
      .map((tab) => tabs.indexOf(tab) + 1)
      .unwrapOr(0)

    tabs.insert(
      position,
      new Tab({
        settings: settings.expect('Could not create a tab before settings were loaded'),
        position,
        path: None(),
        language: None(),
        content: '',
        onUpdate: onTabUpdate,
        current: true,
      })
    )
  },

  reload() {
    // TODO: Save session before reloading
    remote.getCurrentWindow().reload()
  },

  toggleDevTools() {
    remote.getCurrentWebContents().toggleDevTools()
  },
}
