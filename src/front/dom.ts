import { Collection, O, Option } from 'typescript-core'

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

// Get important DOM elements
export const appDom = q('#app').expect('Failed to get element "#app"')
export const titlesDom = q('#titles').expect('Failed to get element "#titles"')
export const editorsDom = q('#editors').expect('Failed to get element "#editors"')
export const statusBarDom = q('#statusbar').expect('Failed to get element "#statusbar"')
export const dragOverlay = q('#drag-overlay').expect("Could not get element '#drag-overlay'")
