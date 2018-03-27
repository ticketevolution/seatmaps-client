/* @flow */
/** @jsx h */

import { h, render } from 'preact'
import TicketMap from './ticketmap'
import TicketEvolutionWindow from 'window'

if (process.env.NODE_ENV === 'development') {
  // Enable preact devtools
  // eslint-disable-next-line import/no-unassigned-import
  require('preact/devtools')
}

const root = document.getElementById(TicketEvolutionWindow.containerId)

if (root) {
  // $FlowFixMe
  render(<TicketMap />, root, root.lastChild)
}

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
