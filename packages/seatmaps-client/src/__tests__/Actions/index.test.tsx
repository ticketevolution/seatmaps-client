import "jest-enzyme";

import React from "react";
import { act } from "react-dom/test-utils";
import { mount, ReactWrapper } from "enzyme";
import Actions, { Props } from "../../Actions";
import ActionGroup from "../../Actions/ActionGroup";
import Legend from "../../Legend";
import Button from "../../Button";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("Actions", () => {
  let wrapper: ReactWrapper<Actions["props"], Actions["state"], Actions>;
  let props: Props;

  beforeEach(() => {
    props = {
      ranges: [],
      onClearSelection: jest.fn(),
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onResetZoom: jest.fn(),
    };
    wrapper = mount<Actions>(<Actions {...props} />);
  });

  it("renders", () => {
    expect(wrapper.isEmptyRender()).toEqual(false);
  });

  it("renders the actions and legend in one group on mobile browsers", () => {
    wrapper.setProps({ showControls: true, showLegend: true });
    act(() => {
      wrapper.setState({ isMobile: true });
    });
    expect(wrapper.find(ActionGroup)).toHaveLength(1);
  });

  it("renders the actions and legend in separate groups on mobile browsers", () => {
    wrapper.setProps({ showControls: true, showLegend: true });
    act(() => {
      wrapper.setState({ isMobile: false });
    });
    expect(wrapper.find(ActionGroup)).toHaveLength(2);
    expect(wrapper.find(ActionGroup).at(1).find(Legend)).toHaveLength(1);
  });

  describe("when controls are visible", () => {
    beforeEach(() => {
      wrapper.setProps({ showControls: true });
    });

    describe("on desktop browsers", () => {
      beforeEach(() => {
        act(() => {
          wrapper.setState({ isMobile: false });
        });
      });

      it("matches snapshot", () => {
        expect(wrapper).toMatchSnapshot();
      });

      it("renders a clear selection button", () => {
        expect(wrapper.exists('[name="clear-selection"]')).toEqual(true);
      });

      it("renders a zoom in button", () => {
        expect(wrapper.exists('[name="zoom-in"]')).toEqual(true);
      });

      it("renders a zoom out button", () => {
        expect(wrapper.exists('[name="zoom-out"]')).toEqual(true);
      });

      it("renders a reset zoom button", () => {
        expect(wrapper.exists('[name="reset-zoom"]')).toEqual(true);
      });

      it("renders a button that zooms in", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onZoomIn).toHaveBeenCalled();
      });

      it("renders a button that zooms out", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onZoomOut).toHaveBeenCalled();
      });

      it("renders a button that resets zoom", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onResetZoom).toHaveBeenCalled();
      });

      it("renders a button that clears selections", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onClearSelection).toHaveBeenCalled();
      });
    });

    describe("on mobile browsers", () => {
      beforeEach(() => {
        act(() => {
          wrapper.instance().setState({ isMobile: true });
        });
      });

      it("matches snapshot", () => {
        expect(wrapper).toMatchSnapshot();
      });

      it("renders a clear selection button", () => {
        expect(wrapper.exists('[name="clear-selection"]')).toEqual(true);
      });

      it("does not render a button that zooms in", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onZoomIn).not.toHaveBeenCalled();
      });

      it("does not render a button that zooms out", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onZoomOut).not.toHaveBeenCalled();
      });

      it("does not render a button that resets zoom", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onResetZoom).not.toHaveBeenCalled();
      });

      it("renders a button that clears selections", () => {
        wrapper.find(Button).forEach((button) => button.simulate("click"));
        expect(props.onClearSelection).toHaveBeenCalled();
      });
    });

    describe("when component is unmounted", () => {
      beforeEach(() => {
        jest.spyOn(window, "clearInterval");
      });

      it("should clear the interval", () => {
        wrapper.unmount();
        expect(clearInterval).toHaveBeenCalled();
      });
    });

    describe("updateIsMobile", () => {
      it("should not call setState if the container is not defined", () => {
        const getCurrentContainerMock =
          jest.fn<Actions["getCurrentContainer"]>();
        getCurrentContainerMock.mockReturnValue(null);
        wrapper.instance().getCurrentContainer = getCurrentContainerMock;
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        wrapper.instance().updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).not.toHaveBeenCalled();
      });

      it("should set isMobile true if container width is mobile", () => {
        const getCurrentContainerMock =
          jest.fn<Actions["getCurrentContainer"]>();
        getCurrentContainerMock.mockReturnValue({
          clientWidth: 399,
        } as unknown as HTMLDivElement);
        wrapper.instance().getCurrentContainer = getCurrentContainerMock;
        act(() => {
          wrapper.instance().setState({ isMobile: false });
        });
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        act(() => {
          wrapper.instance().updateIsMobile();
        });

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: true,
        });
      });

      it("should set isMobile true if window width is mobile", () => {
        const getCurrentContainerMock =
          jest.fn<Actions["getCurrentContainer"]>();
        getCurrentContainerMock.mockReturnValue({
          clientWidth: 400,
        } as unknown as HTMLDivElement);
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 519,
        });
        wrapper.instance().getCurrentContainer = getCurrentContainerMock;
        act(() => {
          wrapper.instance().setState({ isMobile: false });
        });
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        act(() => {
          wrapper.instance().updateIsMobile();
        });

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: true,
        });
      });
    });
  });
});
