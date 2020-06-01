import { proxies } from 'typescript-core'
import { fail } from './state'

// Handle panics
proxies.panicWatcher = (message) => fail(message)
