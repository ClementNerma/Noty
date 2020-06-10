import { remote } from 'electron'
import { Enum, List, None, Option, Some, assert, enumStr, forceType } from 'typescript-core'

export function errorDialog(message: string, internal = false): void {
  remote.dialog.showMessageBoxSync({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Noty error',
    message: (internal ? 'Internal error: ' : '') + message,
  })
}

export async function choiceDialog<K extends string>(message: string, choices: K[]): Promise<Option<Enum<K>>> {
  const ret = await remote.dialog.showMessageBox({
    type: 'question',
    buttons: choices,
    title: 'Noty',
    cancelId: choices.length,
    message,
  })

  return List.raw(choices)
    .get(ret.response)
    .map((choice) => enumStr(choice))
}

export function cancellableChoiceDialog<K extends string>(message: string, choices: K[], cancelChoice: K): Enum<K> {
  assert(choices.includes(cancelChoice), 'Provided cancel choice in cancellableChoiceDialog() is not in the available choices')

  const res = remote.dialog.showMessageBoxSync({
    type: 'question',
    buttons: choices,
    title: 'Noty',
    cancelId: choices.indexOf(cancelChoice),
    message,
  })

  return enumStr(List.raw(choices).get(res).unwrap())
}

export async function optCancellableChoiceDialog<K extends string, C extends K>(
  message: string,
  choices: K[],
  cancelChoice: C
): Promise<Option<Enum<Exclude<K, C>>>> {
  assert(choices.includes(cancelChoice), 'Provided cancel choice in cancellableChoiceDialog() is not in the available choices')

  const ret = await remote.dialog.showMessageBox({
    type: 'question',
    buttons: choices,
    title: 'Noty',
    cancelId: choices.indexOf(cancelChoice),
    message,
  })

  const chosen = List.raw(choices).get(ret.response).unwrap()

  return chosen === cancelChoice ? None() : forceType(Some(enumStr(List.raw(choices).get(ret.response).unwrap())))
}

export async function saveAsDialog(defaultPath?: string): Promise<Option<string>> {
  const ret = await remote.dialog.showSaveDialog({
    title: 'Save as...',
    defaultPath,
  })

  return Option.cond(
    !ret.canceled,
    Option.undefinable(ret.filePath).expect(
      "Internal error: Electron's dialog indicated the 'save as...' dialog was not cancelled, but no file path was provided."
    )
  )
}
