import { assert, List } from 'typescript-core'
import { aceBundleModes } from './libs/ace.js/ace-bundle-languages'

export const languages = new List(aceBundleModes)
export const themes = new List(['one_dark'])

export const defaultLanguage = 'plain_text'

assert(languages.includes(defaultLanguage), `Internal error: default language "${defaultLanguage}" was not found`)
