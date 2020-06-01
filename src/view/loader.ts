import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { remote } from 'electron'
import { MaybeUninit } from 'typescript-core'

const loadingError = (errorMessage: string) => {
  remote.dialog.showMessageBoxSync({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Noty error',
    message: 'Internal error: ' + errorMessage,
  })
  remote.app.exit(1)
  throw new Error(errorMessage)
}

if (typeof require !== 'function') {
  loadingError('Cannot load main script because "require" function is not available in this context')
}

const started = Date.now()

const aceBundlePath = path.join(__dirname, 'ace.js', 'ace-bundle.gz')

if (!fs.existsSync(aceBundlePath)) {
  loadingError(`Ace.js bundle was not found at path "${aceBundlePath}"`)
}

let bundleContent = new MaybeUninit<Buffer>()
try {
  bundleContent.init(fs.readFileSync(aceBundlePath))
} catch (e) {
  loadingError(`Failed to read Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
}

let decompressedBundle = new MaybeUninit<string>()
try {
  decompressedBundle.init(zlib.inflateSync(bundleContent.unwrap()).toString('utf8'))
} catch (e) {
  loadingError(`Failed to decompress Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
}

console.debug(`Decompressed Ace.js bundle in ${Date.now() - started} milliseconds.`)

try {
  window.eval(decompressedBundle.unwrap())
} catch (e) {
  loadingError(`A JavaScript error occurred while evaluating decompressed Ace.js bundle:\n${e.stack}`)
}

const mainPath = path.join(__dirname, '..', 'front', 'index.js')

if (!fs.existsSync(mainPath)) {
  loadingError(`Application's main file was not found at path "${mainPath}"`)
}

import '../front/index'
