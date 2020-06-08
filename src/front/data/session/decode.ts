import { Decoder, List, Option, Decoders as d, JsonDecoders as j } from 'typescript-core'

import { CursorPosition } from '../../tab'

interface _SessionTab {
  readonly id: number
  readonly path: Option<string>
  readonly language: Option<string>
  readonly originalContent: {
    readonly hash: string
    readonly length: number
  }
  readonly cursorPosition: CursorPosition
}

export interface Session {
  activeTab: Option<number>
  tabs: List<_SessionTab>
}

export const decodeSession: Decoder<string, Session> = d.then(
  j.parse,
  j.mapped2([
    ['activeTab', j.optional(j.number)],

    [
      'tabs',
      j.arrayOf(
        j.mapped5([
          ['id', j.number],
          ['path', j.optional(j.string)],
          ['language', j.optional(j.string)],
          [
            'originalContent',
            j.mapped2([
              ['hash', j.string],
              ['length', j.number],
            ]),
          ],
          [
            'cursorPosition',
            j.mapped2([
              ['row', j.number],
              ['column', j.number],
            ]),
          ],
        ])
      ),
    ],
  ])
)
