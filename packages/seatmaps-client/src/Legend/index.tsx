import React, { Component } from "react";
import Button from "../Button";
import Swatch from "./swatch";
import { IconChevronDown } from "../icons/ChevronDown";
import { IconChevronUp } from "../icons/ChevronUp";

const formatCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
}).format;

export interface Range {
  color: string;
  min: number;
  max: number;
}

export interface Props {
  ranges: Range[];
  isMobile?: boolean;
}

interface State {
  isOpen: boolean;
}

export default class Legend extends Component<Props, State> {
  static defaultProps = {
    isMobile: false,
  };

  state = {
    isOpen: false,
  };

  render() {
    const { isOpen } = this.state;
    const { ranges, isMobile } = this.props;

    return (
      <div style={{ position: "relative" }}>
        <Button
          onClick={() => this.setState({ isOpen: !isOpen })}
          icon={isOpen ? <IconChevronUp /> : <IconChevronDown />}
          text={`${isOpen ? "Hide " : "Show "}Map Legend`}
          isMobile={isMobile}
        />
        {ranges.length > 0 && isOpen && (
          <div
            style={{
              position: "absolute",
              backgroundColor: "white",
              right: -2,
              border: "2px solid lightgray",
              borderRadius: "0 0 5px 5px",
            }}
          >
            {ranges.map((range) => (
              <div key={range.color} style={{ padding: 8, textAlign: "left" }}>
                <Swatch color={range.color} style={{ marginRight: 8 }} />
                <span>
                  {formatCurrency(Math.floor(range.min))}
                  {" - "}
                  {formatCurrency(Math.ceil(range.max))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
