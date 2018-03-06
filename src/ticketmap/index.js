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

  constructor(props: any) {
    super(props)
    this.state = {
      mapSvg: ''
    }
  }

  componentDidMount() {
    fetch(
      'https://storage.googleapis.com/ticketevolution/maps/' +
        window._ticketEvolution.ticketMapId +
        '.svg'
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

  render() {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: this.state.mapSvg }} />
      </div>
    )
  }
}
