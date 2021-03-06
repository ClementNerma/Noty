import { Either, FailableFuture, Left, List, None, O, Option, Result, Right, Some, With, assert, parallel } from 'typescript-core'

import { writeFileUtf8 } from './data/fs'
import { applySettings } from './data/settings/load'
import { Settings } from './data/settings/types'
import { errorDialog, optCancellableChoiceDialog, saveAsDialog } from './dialogs'
import { createElement, editorsDom, insertNthChild, statusBarDom, titlesDom } from './dom'
import { defaultLanguage, languages } from './enums'
import { simpleHash } from './hash'
import { handleKeyboardInput } from './keyboard'
import { setCurrentTab } from './state'

export interface TabParams {
  readonly id?: number
  readonly position?: number
  readonly settings: Settings
  readonly path: Option<string>
  readonly language: Option<string>
  readonly originalContent?: OriginalContent
  readonly cursorPosition?: CursorPosition
  readonly current?: boolean
  readonly content: string
  readonly onUpdate: (tab: Tab, content: string, cursor: CursorPosition) => void
  readonly onClose: (tab: Tab, content: string, cursor: CursorPosition) => void
}

export interface CursorPosition {
  readonly row: number
  readonly column: number
}

export interface OriginalContent {
  readonly length: number
  readonly hash: string
}

export class Tab {
  public readonly id: number
  private onUpdate: (tab: Tab, content: string, cursor: CursorPosition) => void
  private onClose: (tab: Tab, content: string, cursor: CursorPosition) => void
  private titleDom: HTMLElement
  private titleNameDom: HTMLElement
  private titleCloseDom: HTMLElement
  private editorDom: HTMLElement
  private statusDom: HTMLElement
  private originalContent: OriginalContent
  private path: Either<string, number>
  private language: With<Option<string>>
  private editor: AceAjax.Editor

  private previousContent: string
  private previousContentLength: number

  constructor(params: TabParams) {
    // Generate a simple unique identifier
    if (params.id !== undefined) {
      assert(!Tab.ids.includes(params.id), `Internal error: cannot create two tabs with the same ID (${params.id})`)

      if (params.id >= Tab.id) {
        Tab.id = params.id + 1
      }

      this.id = params.id
    } else {
      this.id = Tab.id++
    }

    Tab.ids.push(this.id)

    // If no content was provided, the reference content is the provided one
    this.originalContent = params.originalContent ?? {
      hash: simpleHash(params.content),
      length: params.content.length,
    }

    // Store update callback
    this.onUpdate = params.onUpdate
    this.onClose = params.onClose

    // Prepare the tab's title element
    this.titleDom = createElement('span', { ['data-id']: this.id })
    this.titleDom.addEventListener('click', () => setCurrentTab(this))

    this.titleNameDom = createElement('span', { class: 'title' }, 'Loading...')
    this.titleDom.appendChild(this.titleNameDom)

    this.titleCloseDom = createElement('span', { class: 'close', title: 'Close this tab' })
    this.titleDom.appendChild(this.titleCloseDom)

    insertNthChild(this.titleDom, titlesDom, params.position ?? -1)

    // Prepare the tab's editor element
    this.editorDom = createElement('div', { ['data-id']: this.id }, 'Loading...')
    insertNthChild(this.editorDom, editorsDom, params.position ?? -1)

    // Prepare the tab's status bar element
    this.statusDom = createElement('p', { ['data-id']: this.id }, 'Loading...')
    insertNthChild(this.statusDom, statusBarDom, params.position ?? -1)

    // Prepare the constrained language setter
    this.language = new With((lang) => lang.map((lang) => languages.includes(lang)).unwrapOr(true), None())

    // Prepare the tab's editor
    this.editor = ace.edit(this.editorDom)
    this.editor.session.setUseWorker(false)

    // Listen to global keyboard shortcuts
    this.editor.container.addEventListener('keydown', handleKeyboardInput, true)

    // Set path (will update the title DOM as well)
    this.setPath(params.path)

    // Use the provided language
    this.setLanguage(params.language)

    // Register previous content
    // -> also avoids triggering the 'onUpdate()' callback when setting the content during initialization
    this.previousContent = params.content
    this.previousContentLength = params.content.length
    this.setContent(params.content, false, true)

    // Set cursor position
    if (params.cursorPosition) {
      this.editor.gotoLine(params.cursorPosition.row + 1, params.cursorPosition.column)
    }

    // Indicate if there is any change compared to the original content
    this._updateTitleStatus()

    // Set an initial status
    this._setStatus(`/* TODO*/ Current tab: ${this.id}`)

    // Update the editor's settings
    this.updateSettings(params.settings)

    // Listen for inputs
    this.editor.addEventListener('input', () => {
      const content = this.editor.session.getValue()
      const len = content.length

      // Compare current and previous contents
      // Because Ace.js sometimes trigger the 'input' event multiple times at once, we need to ensure
      //  the content changed since the last time this callback was triggered
      // In order to avoid comparing the previous content with the current one all the time, which would be quite slow
      //  on large contents, we start by comparing their lengths, which changes in the vast majority of changes.
      if (len !== this.previousContentLength || content !== this.previousContent) {
        this.previousContent = content
        this.previousContentLength = len
        this._onUpdate(content)
      }
    })

    // Set the tab as current if asked to
    if (params.current) {
      setCurrentTab(this)
    }
  }

  /**
   * Handle editor's updates
   * @param content The new content
   */
  private _onUpdate(content: string) {
    // Update the title status
    // As this involves computing a checksum that can be quite large in some scenarios, we run it in parallel
    parallel(() => this._updateTitleStatus())

    // Trigger the custom update callback provided during the tab's initialization
    this.onUpdate(this, content, this.getCursorPosition())
  }

  /**
   * Update the title status (indicating if changes occurred compared to the original content) after a change in the editor
   * @param content The new content
   */
  private _updateTitleStatus(status?: boolean) {
    const classList = this.titleDom.classList

    if (status) {
      classList.add('changes')
    } else if (status === false) {
      classList.remove('changes')
    } else if (this.hasChanges()) {
      classList.add('changes')
    } else {
      classList.remove('changes')
    }
  }

  /**
   * Set the tab's status (appears in the status bar if the tab is active)
   * @param status The new status message
   */
  private _setStatus(status: string) {
    this.statusDom.innerText = status
  }

  /**
   * Get the path of the file opened in this tab (if any)
   */
  getPath(): Option<string> {
    return this.path.left()
  }

  /**
   * Indicate this tab is linked to a specific file (or not with None())
   * @param path
   */
  setPath(path: Option<string>) {
    // Update the title name
    this.titleNameDom.innerText = path.match({
      // This tab is not linked to any file
      None: () => {
        // ---------------------------------------------------- //
        // Should never be reached, but it's here just in case //
        if (this.path?.isRight()) {
          return 'Untitled-' + this.path.right().unwrap()
        }
        // ---------------------------------------------------- //

        // Indicate this tab is not linked to any file
        this.titleDom.setAttribute('title', '<not linked to any file>')

        // Get the highest "untitled" number (which is always the last pushed to the list)
        // So, let's say we have 3 tabs "Untitled-1", "Untitled-3" and "Untitled-8", this call will return "Some(8)"
        let prevMaxUntitled = Tab.untitled.last().unwrapOr(0)

        // We increase it to get the next untitled value
        const untitled = prevMaxUntitled + 1

        // This tab now has the highest "untitled" number
        // So we register it by pushing it at the end of the list
        Tab.untitled.push(untitled)

        // We remember this tab as an untitled number (used above and to cleanup in ".close()")
        this.path = Right(untitled)

        // Return the tab's name
        return 'Untitled-' + untitled.toString()
      },

      // This tab is linked to a file
      Some: (path) => {
        // Indicate this tab is linked to a file
        this.titleDom.setAttribute('title', path)

        // Get the part's last path (e.g. "/home/<username>/projects/file.txt" will give "file.txt")
        const parts = path.split(/[\/\\]/)
        const lastPart = parts[parts.length - 1]

        // Remove this tab's "untitled" number, if it had one
        this.path && this.path.withRight((untitled) => Tab.untitled.remove(untitled))
        this.path = Left(path)

        // Register this tab's file's last part (see below)
        Tab.openedPathsLastPart.push({ part: lastPart, tab: this })

        // Ensure there aren't two tabs with the same last part
        // If that's the case, we have to do something because the two tabs will have the same name
        // For instance, let's say we have a tab linked to "/a/file.txt" and another to "/b/file.txt"
        // We'll have two tabs with different files but with the same name "file.txt"
        // So, in order to avoid this, we show the full path in the tab
        return (
          Tab.openedPathsLastPart
            // Find any other tab with the same last part
            .find((item) => item.tab !== this && item.part === lastPart)
            .match({
              // One was found :(
              Some: ({ tab }) => {
                // We tell the other tab to use its full path
                tab._useFullPathTitle()
                // We set the file's full path as this tab's title
                return path
              },

              // None was found :)
              // We set the file's name as this tab's title
              None: () => lastPart,
            })
        )
      },
    })
  }

  /**
   * Only called by another tab to indicate this tab must use its file's full path as a title in order to avoid duplicate titles
   */
  private _useFullPathTitle() {
    this.titleNameDom.innerText = this.path
      .left()
      .expect('Internal error: tab was aked to use its full path as a title, but this tab is not linked to a file')
  }

  /**
   * Save changes when path is defined
   */
  private _save(): Result<void, Error> {
    const content = this.getContent()

    return writeFileUtf8(this.path.left().expect("Internal error: called Tab's ._save() method but no path is set"), content)
      .map(() => {
        this.originalContent = {
          hash: simpleHash(content),
          length: content.length,
        }
        this._updateTitleStatus()
      })
      .withErr((err) => errorDialog('Failed to save: ' + err.message))
  }

  /**
   * Get this tab's language
   */
  getLanguage(): Option<string> {
    return this.language.get().clone()
  }

  /**
   * Set this tab's language
   * Returns an Err() if the language is not supported
   * @param language
   */
  setLanguage(language: Option<string>): Result<void, void> {
    return this.language
      .set(language.clone())
      .map(() => {
        this.editor.session.setMode('ace/mode/' + language.unwrapOr(defaultLanguage))
      })
      .mapErr(() => {
        console.warn(`Cannot use unsupported language "${language.unwrapOr('<None>')}", falling back to "${defaultLanguage}".`)
        this.editor.session.setMode('ace/mode/' + defaultLanguage)
      })
  }

  /**
   * Check if the content of this tab changed compared to its original content
   */
  hasChanges(): boolean {
    // Get the current content
    const content = this.getContent()

    // If the length changed since the last time, there was a change
    // This covers the vast majority of cases
    if (content.length !== this.originalContent.length) {
      return true
    }

    // In the specific case where the user would have replaced a portion of the content by another of the exact same length,
    //  without removing the previous one first (e.g. selecting the content, and pasting the new one with the same length),
    //  we have to compare this content to the original one to check the differences
    // So we compute this content's hash and compare it to the original's one
    else if (simpleHash(content) != this.originalContent.hash) {
      return true
    }

    // If the hashes are equal, then there are no changes
    else {
      return false
    }
  }

  /**
   * Get this tab's original content's informations
   */
  getOriginalContentInfos(): OriginalContent {
    return O.cloneSoft(this.originalContent)
  }

  /**
   * Get this tab's content
   */
  getContent(): string {
    return this.editor.session.getValue()
  }

  /**
   * Set this tab's content
   * @param content
   * @param originalContent Set this content as the original one (default: false)
   * @param skipUpdateCallback Skip the update callback (default: false)
   */
  setContent(content: string, originalContent = false, skipUpdateCallback = false) {
    // If this content must be set as the (new) original one...
    if (originalContent) {
      // Remember its hash and length
      this.originalContent = {
        hash: simpleHash(content),
        length: content.length,
      }
    }

    // Set the new content
    this.editor.session.setValue(content)

    // Run the update callback (if not asked to skip it)
    if (!skipUpdateCallback) this._onUpdate(content)
  }

  /**
   * Get the cursor's position
   */
  getCursorPosition(): Readonly<{ row: number; column: number }> {
    return this.editor.getCursorPosition()
  }

  /**
   * Save the tab's content
   */
  save(): FailableFuture<boolean, Error> {
    return new FailableFuture((_, __, complete) => {
      this.path.match<void>({
        Left: () => complete(this._save().map(() => true)),
        Right: () => this.saveAs().then(complete),
      })
    })
  }

  /**
   * Save the tab's content under another name
   */
  saveAs(): FailableFuture<boolean, Error> {
    return new FailableFuture(async (resolve, __, complete) => {
      const target = await saveAsDialog()

      target.match({
        None: () => resolve(false),
        Some: (path) => {
          this.setPath(Some(path))
          complete(this._save().map(() => true))
        },
      })
    })
  }

  /**
   * Apply changes made to the global settings to this tab
   * @param settings
   */
  updateSettings(settings: Settings) {
    applySettings(this.editor, this.editorDom, settings)
  }

  /**
   * Set this tab active
   * This does *NOT* set it as the current one
   * @param active
   */
  setActive(active: boolean): this {
    if (active) {
      this.titleDom.classList.add('active')
      this.editorDom.classList.add('active')
      this.statusDom.classList.add('active')
      this.editor.focus()
    } else {
      this.titleDom.classList.remove('active')
      this.editorDom.classList.remove('active')
      this.statusDom.classList.remove('active')
    }

    return this
  }

  /**
   * Close the tab (asks to save if there are changes)
   */
  close(): FailableFuture<boolean, Error> {
    return new FailableFuture(async (resolve, reject) => {
      const close = () => {
        this.onClose(this, this.getContent(), this.getCursorPosition())
        this.destroy()
        resolve(true)
      }

      if (this.hasChanges()) {
        const choice = await optCancellableChoiceDialog(
          'You have unsaved changes, do you want to save them?',
          ['Save', "Don't save", 'Cancel'],
          'Cancel'
        )

        if (choice.isNone()) {
          return resolve(false)
        }

        choice.unwrap().match<void>({
          Save: () =>
            this.save()
              .success((saved) => saved && close())
              .catch(reject),

          "Don't save": () => close(),
        })
      } else {
        close()
      }
    })
  }

  /**
   * Destroy the tab (ignores changes)
   */
  destroy() {
    this.path.right().map((untitled) => Tab.untitled.remove(untitled))
    Tab.openedPathsLastPart.removeWith((value) => value.tab === this)

    this.editor.destroy()

    this.titleDom.remove()
    this.editorDom.remove()
    this.statusDom.remove()
  }

  /** Tabs ID counter */
  private static id = 0
  /** Tabs ID list (used to ensure there aren't two tabs with the same ID) */
  private static ids = new List<number>()

  /** Tabs' "untitled" numbers (see the "setPath" method) */
  private static untitled = new List<number>()
  /** Tabs' paths' last part (see the "setPath" method) */
  private static openedPathsLastPart = new List<{ part: string; tab: Tab }>()
}
