// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom/client'
import { Provider } from 'react-redux'

import { ConnectedRouter } from 'connected-react-router'

import { ApiClientProvider } from '@opentrons/react-api-client'

import { createLogger } from './logger'

import { uiInitialized } from './redux/shell'
import { history } from './redux/reducer'
import { store } from './redux/store'

import '../src/atoms/SoftwareKeyboard/AlphanumericKeyboard'
import '../src/atoms/SoftwareKeyboard/FullKeyboard/index.css'
import '../src/atoms/SoftwareKeyboard/IndividualKey/index.css'
import '../src/atoms/SoftwareKeyboard/NumericalKeyboard/index.css'

// component tree
import { App } from './App'

const log = createLogger(new URL('', import.meta.url).pathname)

// kickoff app-shell initializations
store.dispatch(uiInitialized())

log.info('Rendering app UI')

const container = document.getElementById('root')
if (container == null) throw new Error('Failed to find the root element')

const root = ReactDom.createRoot(container)
root.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ApiClientProvider>
        <App />
      </ApiClientProvider>
    </ConnectedRouter>
  </Provider>
)
