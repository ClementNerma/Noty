import * as crypto from 'crypto'

// Cryptographically not secure, of course
export function simpleHash(content: string): string {
  return crypto.createHash('sha1').update(content).digest('hex')
}
