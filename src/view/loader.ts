import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { remote } from 'electron'
import { MaybeUninit } from 'typescript-core'

/**
 * Raise an error during loading
 * @param errorMessage
 */
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

// Ensure we can require() modules
if (typeof require !== 'function') {
  loadingError('Cannot load main script because "require" function is not available in this context')
}

// Get the current timestamp to measure startup time
const started = Date.now()

// Ensure the Ace.js bundle exists
const aceBundlePath = path.join(__dirname, 'ace.js', 'ace-bundle.gz')

if (!fs.existsSync(aceBundlePath)) {
  loadingError(`Ace.js bundle was not found at path "${aceBundlePath}"`)
}

// Read the Ace.js bundle
let bundleContent = new MaybeUninit<Buffer>()
try {
  bundleContent.init(fs.readFileSync(aceBundlePath))
} catch (e) {
  loadingError(`Failed to read Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
}

// Decompress the Ace.js bundle
let decompressedBundle = new MaybeUninit<string>()
try {
  decompressedBundle.init(zlib.inflateSync(bundleContent.unwrap()).toString('utf8'))
} catch (e) {
  loadingError(`Failed to decompress Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
}

console.debug(`Decompressed Ace.js bundle in ${Date.now() - started} milliseconds.`)

// Run Ace.js initialization and declaration scripts
try {
  window.eval(decompressedBundle.unwrap())
} catch (e) {
  loadingError(`A JavaScript error occurred while evaluating decompressed Ace.js bundle:\n${e.stack}`)
}

// Ensure the application's main file exists
const mainPath = path.join(__dirname, '..', 'front', 'index.js')

if (!fs.existsSync(mainPath)) {
  loadingError(`Application's main file was not found at path "${mainPath}"`)
}

// Load it (raw import is used to trigger side effects without actually importing anything)
import '../front/index'
