import { currentTab, onTabClose, onTabUpdate, saveCompleteState, setCurrentTab, settings, tabs } from './state'

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

  saveTab() {
    currentTab.read().some((currentTab) => currentTab.save())
  },

  saveTabAs() {
    currentTab.read().some((currentTab) => currentTab.saveAs())
  },

  closeTab() {
    currentTab.read().match({
      Some: async (tab) => {
        const currentTabId = tabs.indexOf(tab)

        if (!(await tab.close().promise()).unwrapOr(false)) {
          return
        }

        if (currentTabId < tabs.length - 1) {
          setCurrentTab(tabs.getUnwrap(currentTabId + 1))
        } else if (currentTabId > 0) {
          setCurrentTab(tabs.getUnwrap(currentTabId - 1))
        } else {
          for (const tab of tabs) {
            tab.setActive(false)
          }

          currentTab.write(None())
        }

        tabs.remove(tab)
      },

      None: () => actions.exit(),
    })
  },

  async closeAllTabs(): Promise<boolean> {
    const oldCurrentTab = currentTab.read()

    for (const tab of tabs) {
      setCurrentTab(tab)

      if (!(await tab.close().promise()).unwrapOr(false)) {
        oldCurrentTab.some(setCurrentTab)
        return false
      }
    }

    tabs.clear()
    currentTab.write(None())
    return true
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
        onClose: onTabClose,
        current: true,
      })
    )
  },

  exit() {
    saveCompleteState().withOk(() => remote.getCurrentWindow().close())
  },

  exitCompletely() {
    saveCompleteState().withOk(() => remote.app.exit(0))
  },

  reload() {
    saveCompleteState().withOk(() => remote.getCurrentWindow().reload())
  },

  toggleDevTools() {
    remote.getCurrentWebContents().toggleDevTools()
  },
}
