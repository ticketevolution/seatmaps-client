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
  textAlign: 'center',
  opacity: 1,
  visibility: 'visible'
}

const discoveredStyle = {
  transition: 'opacity .4s 4s, visibility .4s 4s',
  opacity: 0,
  visibility: 'hidden'
}

const imageStyle = {
  width: '10vw',
  alignSelf: 'end'
}

interface State {
  discovered: boolean
}

export default class ZoomHelper extends React.Component {
  state: State = {
    discovered: false
  }

  container = React.createRef<HTMLElement>()

  handleViewportChange = () => {
    if (this.state.discovered) {
      return
    }

    if (!this.container.current) {
      return
    }

    const bounds = this.container.current.getBoundingClientRect()
    if (bounds.top < window.innerHeight && bounds.top + bounds.height > 0 && bounds.left <= window.innerWidth && bounds.left + bounds.width > 0) {
      this.setState({
        discovered: true
      })
    }
  }

  componentDidMount () {
    setTimeout(() => {
      window.addEventListener('wheel', this.handleViewportChange)
      window.addEventListener('resize', this.handleViewportChange)
      this.handleViewportChange()
    }, 500)
  }

  componentWillUnmount () {
    window.removeEventListener('wheel', this.handleViewportChange)
    window.removeEventListener('resize', this.handleViewportChange)
  }

  render () {
    const style = {
      ...containerStyle,
      ...(this.state.discovered ? discoveredStyle : {})
    }
    return (
      <div style={style} ref={this.container}>
        <link href='https://fonts.googleapis.com/css?family=Nunito+Sans&display=swap' rel='stylesheet' />
        <img style={imageStyle} src={PinchZoomInIcon} />
        <img style={imageStyle} src={TwoFingerSlideIcon} />
        <div>pinch to zoom in/out</div>
        <div>use two fingers to move map</div>
      </div>
    )
  }
}
