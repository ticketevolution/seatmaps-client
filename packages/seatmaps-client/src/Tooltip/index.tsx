import React, { Component, CSSProperties } from "react";
import { NormalizedTicketGroup } from "../types/TicketGroups";

export const defaultDirection = ["up", "right"];

export const formatCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
}).format;

export interface Props {
  x?: number;
  y?: number;
  color?: string;
  isActive?: boolean;
  ticketGroups?: NormalizedTicketGroup[];
  name?: string;
}

interface DefaultProps {
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  ticketGroups: NormalizedTicketGroup[];
  name: string;
}

interface Point {
  x: number;
  y: number;
}

export default class Tooltip extends Component<Props & DefaultProps> {
  container = React.createRef<HTMLDivElement>();

  static defaultProps: DefaultProps = {
    isActive: false,
    ticketGroups: [],
    name: "",
    x: 0,
    y: 0,
    color: "#000000",
  };

  direction(): string[] {
    const container = this.container.current;
    const { x, y } = this.props;
    const direction = [...defaultDirection];

    if (!container || !container.parentElement) {
      return direction;
    }

    // display to the left of the cursor when the right side of the tooltip is clipped
    if (x + container.clientWidth > container.parentElement.clientWidth) {
      direction[1] = "left";
    }

    // display beneath the cursor when the top of the tooltip is clipped
    if (y < container.clientHeight) {
      direction[0] = "down";
    }

    return direction;
  }

  position(): Point {
    const direction = this.direction();
    const point = {
      x: this.props.x,
      y: this.props.y,
    };

    const container = this.container.current;
    if (container) {
      if (direction[0] === "up") {
        point.y -= container.clientHeight;
      }

      if (direction[1] === "left") {
        point.x -= container.clientWidth;
      }
    }

    return point;
  }

  tipStyle(): CSSProperties {
    const direction = this.direction();

    const style: CSSProperties = {
      width: 0,
      height: 0,
      borderStyle: "solid",
    };

    if (direction[0] === "down") {
      if (direction[1] === "right") {
        style.borderWidth = "10px 0 0 10px";
        style.borderColor = "transparent transparent transparent white";
      } else {
        style.borderWidth = "0 0 10px 10px";
        style.borderColor = "transparent transparent white transparent";
      }
    } else {
      if (direction[1] === "right") {
        style.borderWidth = "10px 10px 0 0";
        style.borderColor = "white transparent transparent transparent";
      } else {
        style.borderWidth = "0 10px 10px 0";
        style.borderColor = "transparent white transparent transparent";
      }
    }

    return style;
  }

  containerStyle(): CSSProperties {
    const { isActive } = this.props;
    const direction = this.direction();
    const position = this.position();

    return {
      position: "fixed",
      zIndex: 1,
      transition: "top .1s, left .1s",
      opacity: isActive ? 1 : 0,
      padding: 5,
      display: "flex",
      flexDirection: direction[0] === "down" ? "column" : "column-reverse",
      alignItems: direction[1] === "right" ? "flex-start" : "flex-end",
      filter: "drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)",
      pointerEvents: "none",
      top: position.y,
      left: position.x,
    };
  }

  swatchStyle(): CSSProperties {
    return {
      width: 10,
      height: 10,
      backgroundColor: this.props.color,
      display: "inline-block",
      marginRight: 5,
    };
  }

  contentStyle(): CSSProperties {
    return {
      backgroundColor: "white",
      padding: 20,
    };
  }

  nameStyle(): CSSProperties {
    return {
      display: "flex",
      alignItems: "center",
    };
  }

  priceStyle(): CSSProperties {
    return {
      fontWeight: 700,
    };
  }

  render() {
    const prices = this.props.ticketGroups
      .map((ticketGroup) => ticketGroup.price)
      .sort((a, b) => a - b);

    return (
      <div ref={this.container} style={this.containerStyle()}>
        <div style={this.tipStyle()} />
        <div style={this.contentStyle()}>
          <div style={this.nameStyle()}>
            <div style={this.swatchStyle()} />
            {this.props.name}
          </div>
          <div>
            {this.props.ticketGroups.length} listing
            {prices.length !== 1 ? "s" : ""}
            {" ● "}
            Starting at{" "}
            <span style={this.priceStyle()}>{formatCurrency(prices[0])}</span>
          </div>
        </div>
      </div>
    );
  }
}
