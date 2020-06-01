if (typeof require !== 'function') {
  throw new Error('Cannot load main script because "require" function is not available in this context')
}

require('../../dist/index.js')
