import React from "react";
import Legend from "../Legend";
import Button from "../Button";
import ActionGroup from "./ActionGroup";
import type { CostRange } from "../TicketMap";
import { IconPlus } from "../icons/Plus";
import { IconMinus } from "../icons/Minus";
import { IconUndo } from "../icons/Undo";
import { IconClose } from "../icons/Close";

export interface Props {
  onClearSelection?: () => void;
  showLegend?: boolean;
  showControls?: boolean;
  ranges: CostRange[];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

interface DefaultProps {
  showLegend: boolean;
  showLegendOpenAlwaysForDesktop: boolean;
  openLegendInitially: boolean;
  showControls: boolean;
  onClearSelection(): void;
}

interface State {
  isMobile: boolean;
}

export default class Actions extends React.Component<
  Props & DefaultProps,
  State
> {
  container = React.createRef<HTMLDivElement>();
  timer?: number;

  state: State = {
    // initial value, would correct itself after first render
    // TODO: we should refactor this to an FC component and some variant of useMediaQuery
    isMobile: false,
  };

  static defaultProps: DefaultProps = {
    showLegend: true,
    showLegendOpenAlwaysForDesktop: false,
    showControls: true,
    openLegendInitially: false,
    onClearSelection: () => {},
  };

  get styles(): { [key: string]: React.CSSProperties } {
    return {
      container: {
        position: "absolute",
        top: this.state.isMobile ? 0 : 10,
        left: this.state.isMobile ? 0 : 10,
        right: this.state.isMobile ? 0 : 10,
        bottom: this.state.isMobile ? 0 : 10,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        opacity: 0.9,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        fontSize: "0.75em",
      },
      icon: {
        display: "inline-block",
        fontSize: "inherit",
        height: "1.333333333em",
        overflow: "visible",
        verticalAlign: "-0.125em",
      },
    };
  }

  componentDidMount() {
    this.timer = window.setInterval(this.updateIsMobile, 200);
  }

  componentWillUnmount() {
    window.clearInterval(this.timer);
  }

  updateIsMobile = () => {
    const currentContainer = this.getCurrentContainer();
    if (!currentContainer) {
      return;
    }

    const isMobile =
      window.innerWidth < 520 || currentContainer.clientWidth < 400;

    if (this.state.isMobile !== isMobile) {
      this.setState({ isMobile });
    }
  };

  getCurrentContainer = () => {
    return this.container.current;
  };

  render() {
    const { isMobile } = this.state;
    const { showControls, showLegend } = this.props;

    const showLeftActions = showControls || (isMobile && showLegend);
    const showRightActions = !isMobile && showLegend;

    return (
      <div
        style={this.styles.container}
        ref={this.container}
        data-testid="seatmaps-actions-menu"
      >
        {showLeftActions && (
          <ActionGroup>
            {!isMobile && showControls && (
              <React.Fragment>
                <Button
                  data-rh="Default"
                  data-custom-at="right"
                  onClick={this.props.onZoomIn}
                  icon={<IconPlus />}
                  isMobile={isMobile}
                  style={{ borderRight: "2px solid lightgray" }}
                  name="zoom-in"
                  data-testid="zoom-in"
                />

                <Button
                  onClick={this.props.onZoomOut}
                  icon={<IconMinus />}
                  isMobile={isMobile}
                  style={{ borderRight: "2px solid lightgray" }}
                  name="zoom-out"
                  data-testid="zoom-out"
                />

                <Button
                  onClick={this.props.onResetZoom}
                  icon={<IconUndo />}
                  text="Reset Zoom"
                  isMobile={isMobile}
                  style={{ borderRight: "2px solid lightgray" }}
                  name="reset-zoom"
                  data-testid="reset-zoom"
                />
              </React.Fragment>
            )}
            {showControls && (
              <Button
                className="clear-selection"
                onClick={this.props.onClearSelection}
                icon={<IconClose />}
                text={`Clear${isMobile ? "" : " All"}`}
                isMobile={isMobile}
                style={{
                  borderRight: isMobile ? "2px solid lightgray" : undefined,
                }}
                name="clear-selection"
              />
            )}
            {isMobile && showLegend && (
              <Legend isMobile ranges={this.props.ranges} />
            )}
          </ActionGroup>
        )}
        {showRightActions && (
          <ActionGroup>
            <Legend
              ranges={this.props.ranges}
              showLegendOpenAlwaysForDesktop={
                this.props.showLegendOpenAlwaysForDesktop
              }
              openLegendInitially={this.props.openLegendInitially}
            />
          </ActionGroup>
        )}
      </div>
    );
  }
}
