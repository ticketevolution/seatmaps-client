import React, { CSSProperties } from "react";
import { IconPinchZoomIn } from "../icons/PinchZoomIn";
import { IconTwoFingerSlide } from "../icons/TwoFingerSlide";

const containerStyle: CSSProperties = {
  position: "absolute",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  width: "100%",
  height: "100%",
  padding: "20% 30%",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: "50% 50%",
  justifyItems: "center",
  alignItems: "top",
  color: "white",
  fontFamily: "Nunito Sans",
  fontSize: "2vw",
  fontWeight: 700,
  textTransform: "uppercase",
  textAlign: "center",
  opacity: 1,
  visibility: "visible",
  lineHeight: "initial",
};

const discoveredStyle: CSSProperties = {
  transition: "opacity .4s, visibility .4s",
  opacity: 0,
  visibility: "hidden",
};

const imageStyle = {
  width: "10vw",
  alignSelf: "end",
};

interface State {
  discovered: boolean;
}

export default class ZoomHelper extends React.Component {
  state: State = {
    discovered: false,
  };

  container = React.createRef<HTMLDivElement>();

  hide = () => {
    this.setState({
      discovered: true,
    });
  };

  getCurrentContainer = () => {
    return this.container.current;
  };

  shouldHide = (bounds: DOMRect) => {
    return (
      bounds.top < window.innerHeight &&
      bounds.top + bounds.height > 0 &&
      bounds.left <= window.innerWidth &&
      bounds.left + bounds.width > 0
    );
  };

  handleViewportChange = () => {
    if (this.state.discovered) {
      return;
    }

    const currentContainer = this.getCurrentContainer();
    if (!currentContainer) {
      return;
    }

    const bounds = currentContainer.getBoundingClientRect();
    if (this.shouldHide(bounds)) {
      setTimeout(this.hide, 4000);
    }
  };

  componentDidMount() {
    setTimeout(() => {
      window.addEventListener("wheel", this.handleViewportChange);
      window.addEventListener("resize", this.handleViewportChange);
      this.handleViewportChange();
    }, 500);
  }

  componentWillUnmount() {
    window.removeEventListener("wheel", this.handleViewportChange);
    window.removeEventListener("resize", this.handleViewportChange);
  }

  render() {
    const style = {
      ...containerStyle,
      ...(this.state.discovered ? discoveredStyle : {}),
    };

    return (
      <div style={style} ref={this.container} onClick={this.hide}>
        <link
          href="https://fonts.googleapis.com/css?family=Nunito+Sans&display=swap"
          rel="stylesheet"
        />
        <IconPinchZoomIn className="zoom-in-icon" style={imageStyle} />
        <IconTwoFingerSlide className="slide-icon" style={imageStyle} />
        <div>pinch to zoom in/out</div>
        <div>use two fingers to move map</div>
      </div>
    );
  }
}
