import { Component } from 'preact'
import classnames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import c from './Legend.scss'

const Swatch = ({ color, name }) => (
  <div className={c.swatch} style={{ backgroundColor: color }} />
)

export default class Legend extends Component {
  state = {
    open: true
  }

  render () {
    const { open } = this.state
    const { costRanges, className } = this.props

    return (
      <div className={classnames(c.legend, open && c.open, className)}>
        <div className={c.toggle} onClick={() => this.setState({ open: !open })}>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
          <span>{open ? 'Hide' : 'Show'} Map Legend</span>
        </div>
        {costRanges.map(costRange => (
          <div className={c.option}>
            <Swatch color={costRange.color} />
            <span>${Math.floor(costRange.min)} - ${Math.ceil(costRange.max)}</span>
          </div>
        ))}
      </div>
    )
  }
}
