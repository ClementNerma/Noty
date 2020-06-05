import { fail } from './state'
import { Option, O, Collection } from 'typescript-core'

export function q(selector: string): Option<Element> {
  return Option.nullable(document.querySelector(selector))
}

export function createElement(tag: string, attributes: Collection<string | number | boolean>, innerHTML = ''): HTMLElement {
  const el = document.createElement(tag)

  for (const [attr, value] of O.entries(attributes)) {
    el.setAttribute(attr, value.toString())
  }

  el.innerHTML = innerHTML

  return el
}

export function insertNthChild(child: Element, parent: Element, nth: number) {
  if (nth >= parent.children.length || nth === -1) {
    parent.appendChild(child)
  } else {
    parent.insertBefore(child, parent.children[nth])
  }
}

// Get contains
export const titlesDom = document.getElementById('titles') ?? fail('Failed to get element "#titles"')
export const editorsDom = document.getElementById('editors') ?? fail('Failed to get element "#editors"')
export const statusBarDom = document.getElementById('statusbar') ?? fail('Failed to get element "#statusbar"')
export const dragOverlay = q('#drag-overlay').expect("Could not get element '#drag-overlay'")
