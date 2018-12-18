import { Component } from 'preact'
import classnames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import c from './Legend.scss'

const Swatch = ({ color, name }) => (
  <div className={c.swatch} style={{ backgroundColor: color }} />
)

export default class Legend extends Component {
  static defaultProps = {
    options: [
      { color: '#000000', name: 'foo' },
      { color: '#000000', name: 'foo' },
      { color: '#000000', name: 'foo' },
      { color: '#000000', name: 'foo' },
      { color: '#000000', name: 'foo' }
    ]
  }

  state = {
    open: true
  }

  render() {
    const { open } = this.state
    const { options, className } = this.props

    return (
      <div className={classnames(c.legend, open && c.open, className)}>
        <div className={c.toggle} onClick={() => this.setState({ open: !open })}>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
          <span>{open ? 'Hide' : 'Show'} Map Legend</span>
        </div>
        {options.map(option => (
          <div className={c.option}>
            <Swatch color={option.color} />
            <span>{option.name}</span>
          </div>
        ))}
      </div>
    )
  }
}
