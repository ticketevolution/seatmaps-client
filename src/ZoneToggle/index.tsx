import React, { Component } from 'react'
import Toggle from 'react-toggled'

interface Props {
  isZoneToggled: boolean
  onToggle(): void
}

const toggleTextStyle: React.CSSProperties = {
  padding: '0 5px',
  fontFamily: 'sans-serif',
  fontSize: '14px'
}

export default class ZoneToggle extends Component<Props> {
  render () {
    const { isZoneToggled, onToggle } = this.props

    return (
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            ...toggleTextStyle,
            color: isZoneToggled ? '#181514' : '#3D5A80'
          }}
        >
          Section
        </div>

        <Toggle defaultOn={isZoneToggled} onToggle={onToggle}>
          {({ on, getTogglerProps }) => (
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '60px',
                height: '36px'
              }}
            >
              <input
                type='checkbox'
                style={{
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  cursor: 'pointer'
                }}
                {...getTogglerProps({ id: 'sectionZone' })}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '10px',
                    background: '#9A9A9A',
                    cursor: 'pointer'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    width: '26px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'white',
                    transition: 'transform 0.5s',
                    transform: on ? 'translateX(32px)' : 'translateX(2px)'
                  }}
                />
              </span>
            </span>
          )}
        </Toggle>
        <div
          style={{
            ...toggleTextStyle,
            color: isZoneToggled ? '#3D5A80' : '#181514'
          }}
        >
          Zone
        </div>
      </div>
    )
  }
}
