import React, { Component, CSSProperties } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import Swatch from './swatch'

interface Range {
  color: string
  min: number
  max: number
}

interface Props {
  ranges: Range[]
}

interface State {
   open: boolean 
}

const styles = {
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    border: '1px solid rgb(224, 224, 224)',
    borderRadius: 4,
    backgroundColor: 'white',
    opacity: .7
  } as CSSProperties,
  item: {
    padding: 10,
    cursor: 'pointer'
  } as CSSProperties,
  icon: {
    marginRight: 5
  } as CSSProperties
}

export default class Legend extends Component<Props, State> {
  state = {
    open: false
  }

  render() {
    const { open } = this.state
    const { ranges } = this.props

    return (
      <div style={styles.container}>
        <div style={styles.item} onClick={() => this.setState({ open: !open })}>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={styles.icon}/>
          <span>{open ? 'Hide' : 'Show'} Map Legend</span>
        </div>
        {ranges && open && ranges.map(range => (
          <div style={styles.item}>
            <Swatch color={range.color} style={styles.icon}/>
            <span>${Math.floor(range.min)} - ${Math.ceil(range.max)}</span>
          </div>
        ))}
      </div>
    )
  }
}
