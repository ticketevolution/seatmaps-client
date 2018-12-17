import CSSTransition from 'react-transition-group/CSSTransition'
import { mainContainerStyle } from './styles'

const SCREEN_BUFFER = 100
const TOOLTIP_BUFFER = 250

export const getTooltipX = (clientX) =>
  clientX - SCREEN_BUFFER < 0
    ? clientX
    : document.body.clientWidth - TOOLTIP_BUFFER < clientX
      ? clientX - TOOLTIP_BUFFER
      : clientX - 10

export const getTooltipY = (clientY) => clientY - SCREEN_BUFFER < 0 ? clientY + 50 : clientY - SCREEN_BUFFER

const Tooltip = ({ isActive, clientX, clientY, name, ticketGroups }) => {
  const prices = ticketGroups
    .map(ticketGroup => parseFloat(ticketGroup.price))
    .sort((a, b) => a - b)
  return (
    <CSSTransition in={isActive} timeout={300} classNames='message' unmountOnExit>
      <div
        style={Object.assign({}, mainContainerStyle, { left: getTooltipX(clientX), top: getTooltipY(clientY) })}
        className={'tooltip'}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '4px',
            display: 'inlineBlock',
            filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
            fontFamily: 'Open Sans, sans-serif',
            padding: '20px',
            position: 'relative'
          }}
        >
          <div style={{ color: '#181514', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'row', fontSize: '0.75em', padding: '0px' }}>
              <div>
                <div style={{ fontWeight: '400' }}>{name}</div>
                <div style={{ fontWeight: '400' }}>
                  <span>
                    {prices.length} listing{prices.length > 1 ? 's' : ''}
                  </span>{' '}&#9679;{' '}
                  <span>Starting at <span style={{ fontWeight: '700' }}>{prices[0]}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  )
}

export default Tooltip
