import { Dictionary, List, NativeJsonValueType, Option } from 'typescript-core'

import { Session } from './decode'

type _ToNative<T> = T extends NativeJsonValueType
  ? T
  : T extends Option<infer U>
  ? U | null
  : T extends Array<infer U>
  ? Array<_ToNative<U>>
  : T extends List<infer U>
  ? Array<_ToNative<U>>
  : T extends Dictionary<infer K, infer V>
  ? K extends string
    ? { [Key in K]: _ToNative<V> }
    : never
  : { [Key in keyof T]: _ToNative<T[Key]> }

export function encodeSession(session: Session): string {
  let stringifyable: _ToNative<Session>

  stringifyable = {
    activeTab: session.activeTab.toNullable(),

    tabs: session.tabs
      .map((tab) => ({
        id: tab.id,
        path: tab.path.toNullable(),
        language: tab.language.toNullable(),
        originalContent: tab.originalContent,
        cursorPosition: tab.cursorPosition,
      }))
      .toArray(),
  }

  return JSON.stringify(stringifyable, null, 2)
}
