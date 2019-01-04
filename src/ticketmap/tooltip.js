import classnames from 'classnames'
import c from './tooltip.scss'

const Tooltip = ({ isActive, name, ticketGroups, className }) => {
  const prices = ticketGroups
    .map(ticketGroup => parseFloat(ticketGroup.price))
    .sort((a, b) => a - b)

  return (
    <div className={classnames(c.tooltip, isActive && c.visible, className)}>
      <div>{name}</div>
      <div>
        {prices.length} listing{prices.length === 1 ? '' : 's'}
        {' ● '}
        Starting at <span className={c.price}>${prices[0]}</span>
      </div>
    </div>
  )
}

export default Tooltip
