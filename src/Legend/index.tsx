import React, { Component, CSSProperties } from 'react'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import Button from '../Button'
import Swatch from './swatch'

const formatCurrency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0
}).format

interface Range {
  color: string
  min: number
  max: number
}

interface Props {
  ranges: Range[]
  style?: CSSProperties,
  isMobile?: boolean
}

interface State {
  open: boolean
}

export default class Legend extends Component<Props, State> {
  static defaultProps = {
    style: {},
    isMobile: false
  }

  state = {
    open: false
  }

  render () {
    const { open } = this.state
    const { ranges, isMobile } = this.props

    return (
      <div style={{ position: 'relative' }}>
        <Button
          onClick={() => this.setState({ open: !open })}
          icon={open ? faChevronUp : faChevronDown}
          text={`${open ? 'Hide ' : 'Show '}Map Legend`}
          isMobile={isMobile}
        />
        {ranges && ranges.length > 0 && open && <div style={{ position: 'absolute', backgroundColor: 'white', left: -2, right: -2, border: '2px solid lightgray', borderRadius: '0 0 5px 5px' }}>
          {ranges.map(range => (
            <div style={{ padding: 13 }}>
              <Swatch color={range.color} style={{ marginRight: 8 }} />
              <span>
                {formatCurrency(Math.floor(range.min))}
                {' - '}
                {formatCurrency(Math.ceil(range.max))}
              </span>
            </div>
          ))}
        </div>}
      </div>
    )
  }
}
