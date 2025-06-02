import { setupListeners } from '@reduxjs/toolkit/query'
import { store } from './store'

// Enable listener middleware for RTK Query
setupListeners(store.dispatch)
