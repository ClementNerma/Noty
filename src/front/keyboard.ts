import { dragOverlay } from './dom'
import { settings, fail } from './state'
import { actions } from './actions'

/**
 * Set up event listener for the keyboard shortcuts
 */
export function initKeyboardShortcuts() {
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
  window.addEventListener('keydown', handleKeyboardInput, true)
}

/**
 * Handle a keyboard input to trigger actions if a keyboard shortcut has been used
 * @param event An input event (should be from a 'keydown' event)
 */
export function handleKeyboardInput(event: KeyboardEvent): void {
  for (const mapping of settings.expect('Cannot read keymaps as settings have not been initialized').keymaps) {
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
      event.stopPropagation()
    }
  }
}
