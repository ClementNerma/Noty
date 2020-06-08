import { fail } from './state'
import { proxies } from 'typescript-core'

// Handle panics
proxies.panicWatcher = (message) => fail(message)
