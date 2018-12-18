import { h, Component } from 'preact'
import classnames from 'classnames'
import c from './Legend.scss'

const Swatch = ({ color, name, ...props }) => (
  <div class={c.swatch} style={{ backgroundColor: color }} />
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
    open: false
  }

  render() {
    const { open } = this.state
    const { options, className } = this.props

    return (
      <div className={classnames(c.legend, open && c.open, className)}>
        <div className={c.toggle} onClick={() => this.setState({ open: !open })}>
          <span>{open ? 'Hide' : 'Show'} Legend</span>
        </div>
        <div className={c.options}>
          {options.map(option => (
            <div>
              <Swatch color={option.color} />
              <span>{option.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
}