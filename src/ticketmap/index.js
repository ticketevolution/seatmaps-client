/* @flow */
/** @jsx h */

import { h, Component } from 'preact'
import fetch from 'unfetch'

type State = {
  mapSvg: string
}

type Props = {
  goTo: Function
}

export default class TicketMap extends Component<Props, State> {
  state: State

  constructor (props: any) {
    super(props)
    this.state = {
      mapSvg: ''
    }
  }

  componentDidMount () {
    fetch(
      'https://storage.googleapis.com/ticketevolution/maps/110_8888881.svg'
    ).then(response =>
      response.text().then(text => {
        if (response.ok) {
          this.setState({
            mapSvg: text
          })
        }
      })
    )
  }

  render () {
    console.log('log:', this.state.mapSvg)
    return (
      <div>
        <div>testin!</div>
        <div dangerouslySetInnerHTML={{ __html: this.state.mapSvg }} />
      </div>
    )
  }
}
