import { List, Decoder, Decoders as d, JsonDecoders as j, JsonValue, JsonValueType, Option } from 'typescript-core'

export interface Session {
  tabs: List<{
    readonly path: Option<string>
    readonly language: Option<string>
    readonly originalContentHash: string
    readonly originalContentLength: number
    readonly content: string
  }>

  activeTab: number
}

export const decodeSession: Decoder<string, Session> = d.then(
  j.parse,
  j.mapped2([
    [
      'tabs',
      j.arrayOf(
        j.mapped5([
          ['path', j.optional(j.string)],
          ['language', j.optional(j.string)],
          ['originalContentHash', j.string],
          ['originalContentLength', j.number],
          ['content', j.string],
        ])
      ),
    ],

    ['activeTab', j.number],
  ])
)

export function encodeSession(session: Session): string {
  return new JsonValue(session as Session & { [key: string]: JsonValueType }).stringify()
}
