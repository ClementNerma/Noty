import { remote } from 'electron'
import { None } from 'typescript-core'

import { saveUnsaved } from './data/session/save'
import { languagesOverlay } from './dom'
import { currentTab, onTabClose, onTabUpdate, saveCompleteState, saveUpdatedSession, setCurrentTab, settings, tabs } from './state'
import { Tab } from './tab'

export const actions = {
  previousTab() {
    currentTab.some((currentTab) => {
      const currentTabId = tabs.indexOf(currentTab)
      tabs.get(currentTabId === 0 ? tabs.length - 1 : currentTabId - 1).some((tab) => setCurrentTab(tab))
    })
  },

  nextTab() {
    currentTab.some((currentTab) => {
      const currentTabId = tabs.indexOf(currentTab)
      tabs.get(currentTabId === tabs.length - 1 ? 0 : currentTabId + 1).some((tab) => setCurrentTab(tab))
    })
  },

  saveTab() {
    currentTab.some((currentTab) => currentTab.save())
  },

  saveTabAs() {
    currentTab.some((currentTab) => currentTab.saveAs())
  },

  closeTab() {
    currentTab.match({
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

          currentTab.take()
        }

        tabs.remove(tab)
      },

      None: () => actions.exit(),
    })
  },

  async closeAllTabs(): Promise<boolean> {
    const oldCurrentTab = currentTab.clone()

    for (const tab of tabs) {
      setCurrentTab(tab)

      if (!(await tab.close().promise()).unwrapOr(false)) {
        oldCurrentTab.some(setCurrentTab)
        return false
      }
    }

    tabs.clear()
    currentTab.take()
    return true
  },

  createTab() {
    const position = currentTab.map((tab) => tabs.indexOf(tab) + 1).unwrapOr(0)

    const tab = new Tab({
      settings: settings.expect('Could not create a tab before settings were loaded'),
      position,
      path: None(),
      language: None(),
      content: '',
      onUpdate: onTabUpdate,
      onClose: onTabClose,
      current: true,
    })

    tabs.insert(position, tab)

    saveUpdatedSession()
    saveUnsaved(tab.id, '')
  },

  toggleLanguagesSelector() {
    currentTab.some(() => languagesOverlay.classList.toggle('visible'))
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
