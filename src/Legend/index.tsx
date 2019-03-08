import React, { Component, CSSProperties } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import Button from '../Button'
import Swatch from './swatch'

interface Range {
  color: string
  min: number
  max: number
}

interface Props {
  ranges: Range[]
  style?: CSSProperties
}

interface State {
  open: boolean
}

export default class Legend extends Component<Props, State> {
  static defaultProps = {
    style: {}
  }

  state = {
    open: false
  }

  render () {
    const { open } = this.state
    const { ranges } = this.props

    return (
      <div style={{ position: 'relative ' }}>
        <Button onClick={() => this.setState({ open: !open })}>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ marginRight: 8 }} />
          <span>{open ? 'Hide' : 'Show'} Map Legend</span>
        </Button>
        {ranges && ranges.length > 0 && open && <div style={{ position: 'absolute', backgroundColor: 'white', left: -2, right: -2, border: '2px solid lightgray', borderRadius: '0 0 5px 5px' }}>
          {ranges.map(range => (
            <div style={{ padding: 13 }}>
              <Swatch color={range.color} style={{ marginRight: 8 }} />
              <span>${Math.floor(range.min)} - ${Math.ceil(range.max)}</span>
            </div>
          ))}
        </div>}
      </div>
    )
  }
}
