import { Collection, O, Option } from 'typescript-core'

export function q(selector: string): Option<Element> {
  return Option.nullable(document.querySelector(selector))
}

export function createElement(
  tag: string,
  attributes: Collection<string | number | boolean>,
  innerText = '',
  events: Collection<(event: Event) => void> = {}
): HTMLElement {
  const el = document.createElement(tag)

  for (const [attr, value] of O.entries(attributes)) {
    el.setAttribute(attr, value.toString())
  }

  for (const [eventName, callback] of O.entries(events)) {
    el.addEventListener(eventName, callback)
  }

  el.innerText = innerText

  return el
}

export function insertNthChild(child: Element, parent: Element, nth: number) {
  if (nth >= parent.children.length || nth === -1) {
    parent.appendChild(child)
  } else {
    parent.insertBefore(child, parent.children[nth])
  }
}

const _expectDOM = (id: string) => q('#' + id).expect(`Failed to get DOM element with ID "${id}"`)

// Get important DOM elements
export const appDom = _expectDOM('app')
export const titlesDom = _expectDOM('titles')
export const editorsDom = _expectDOM('editors')
export const statusBarDom = _expectDOM('statusbar')
export const dragOverlay = _expectDOM('drag-overlay')
export const languagesOverlay = _expectDOM('languages-overlay')
