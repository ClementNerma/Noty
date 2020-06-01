;(function () {
  const remote = require('electron').remote
  const loadingError = (errorMessage) => {
    remote.dialog.showMessageBoxSync({
      type: 'error',
      buttons: ['OK'],
      defaultId: 0,
      title: 'Noty error',
      message: 'Internal error: ' + errorMessage,
    })
    remote.app.exit(1)
    throw new Error(message)
  }

  if (typeof require !== 'function') {
    loadingError('Cannot load main script because "require" function is not available in this context')
  }

  const started = Date.now()

  const fs = require('fs')
  const path = require('path')
  const zlib = require('zlib')

  const aceBundlePath = path.join(__dirname, 'ace.js', 'ace-bundle.gz')

  if (!fs.existsSync(aceBundlePath)) {
    loadingError(`Ace.js bundle was not found at path "${aceBundlePath}"`)
  }

  let bundleContent
  try {
    bundleContent = fs.readFileSync(aceBundlePath)
  } catch (e) {
    loadingError(`Failed to read Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
  }

  let decompressedBundle
  try {
    decompressedBundle = zlib.inflateSync(bundleContent).toString('utf8')
  } catch (e) {
    loadingError(`Failed to decompress Ace.js bundle at path "${aceBundlePath}":\n${e.message}`)
  }

  console.debug(`Decompressed Ace.js bundle in ${Date.now() - started} milliseconds.`)

  try {
    window.eval(decompressedBundle)
  } catch (e) {
    loadingError(`A JavaScript error occurred while evaluating decompressed Ace.js bundle:\n${e.stack}`)
  }

  const mainPath = path.join(__dirname, '..', 'front', 'index.js')

  if (!fs.existsSync(mainPath)) {
    loadingError(`Application's main file was not found at path "${mainPath}"`)
  }

  try {
    require('../front/index.js')
  } catch (e) {
    loadingError(`An error occurred while evaluating the application's main file:\n${e.stack}`)
  }
})()
