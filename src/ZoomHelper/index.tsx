import React from 'react'
import PinchZoomInIcon from './pinch-zoom-in.svg'
import TwoFingerSlideIcon from './two-finger-slide.svg'

const containerStyle = {
  position: 'absolute',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  width: '100%',
  height: '100%',
  padding: '20% 30%',
  boxSizing: 'border-box',
  display: 'grid',
  gridTemplateColumns: '50% 50%',
  justifyItems: 'center',
  alignItems: 'top',
  color: 'white',
  fontFamily: 'Nunito Sans',
  fontSize: '2vw',
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'center'
}

const imageStyle = {
  width: '10vw',
  alignSelf: 'end'
}

export default class ZoomHelper extends React.Component {
  render () {
    return (
      <div style={containerStyle}>
        <link href='https://fonts.googleapis.com/css?family=Nunito+Sans&display=swap' rel='stylesheet' />
        <img style={imageStyle} src={PinchZoomInIcon} />
        <img style={imageStyle} src={TwoFingerSlideIcon} />
        <div>pinch to zoom in/out</div>
        <div>use two fingers to move map</div>
      </div>
    )
  }
}
