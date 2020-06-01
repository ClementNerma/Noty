import * as fs from 'fs'
import { assert } from 'typescript-core'

const aceFiles = fs.readdirSync('src/acejs-min')

export const languages = aceFiles.filter((name) => name.startsWith('mode-')).map((name) => name.substr(5).replace(/\.js$/, ''))
export const themes = aceFiles.filter((name) => name.startsWith('theme-')).map((name) => name.substr(6).replace(/\.js$/, ''))

export const defaultLanguage = 'plain_text'

assert(languages.includes(defaultLanguage), `Internal error: default language "${defaultLanguage}" was not found`)
