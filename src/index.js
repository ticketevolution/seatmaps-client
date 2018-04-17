/* @flow */

import { h, render } from 'preact' /** @jsx h */
import TicketMap from './ticketmap'
import TicketEvolutionWindow from 'window'

if (process.env.NODE_ENV === 'development') {
  // Enable preact devtools
  // eslint-disable-next-line import/no-unassigned-import
  require('preact/devtools')
}

const root = document.getElementById(TicketEvolutionWindow.containerId)

if (root) {
  // we don't want pointer events on text elements
  // also include css for tooltips
  const cssContent =
    '#rootElement text{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none} .message-enter{opacity:.01}.message-enter-active{opacity:1;transition:all .3s ease-out}.message-exit{opacity:1}.message-exit-active{opacity:.01;transition:all .3s ease-out}'
  const head = document.head
  let styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.appendChild(document.createTextNode(cssContent))
  head.appendChild(styleSheet)

  // $FlowFixMe
  render(<TicketMap />, root, root.lastChild)
}

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
