import { Decoder, List, Option, Decoders as d, JsonDecoders as j } from 'typescript-core'

interface _SessionTab {
  readonly id: number
  readonly language: Option<string>
  readonly originalContentHash: string
  readonly originalContentLength: number
  readonly path: Option<string>
}

export interface Session {
  tabs: List<_SessionTab>
  activeTab: number
}

export const decodeSession: Decoder<string, Session> = d.then(
  j.parse,
  j.mapped2([
    [
      'tabs',
      j.arrayOf(
        j.mapped5([
          ['id', j.number],
          ['path', j.optional(j.string)],
          ['language', j.optional(j.string)],
          ['originalContentHash', j.string],
          ['originalContentLength', j.number],
        ])
      ),
    ],

    ['activeTab', j.number],
  ])
)
