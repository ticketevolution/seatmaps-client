import "jest-enzyme";

import React from "react";
import { mount, ReactWrapper } from "enzyme";
import Actions, { Props } from "../../Actions";
import ActionGroup from "../../Actions/ActionGroup";
import Legend from "../../Legend";
import Button from "../../Button";

describe("Actions", () => {
  let wrapper: ReactWrapper<Props>;
  let props: Props;

  beforeEach(() => {
    props = {
      ranges: [],
      onClearSelection: jest.fn(),
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onResetZoom: jest.fn(),
    };
    wrapper = mount(<Actions {...props} />);
  });

  it("renders", () => {
    expect(wrapper).toExist();
  });

  it("renders the actions and legend in one group on mobile browsers", () => {
    wrapper.setProps({ showControls: true, showLegend: true });
    wrapper.setState({ isMobile: true });
    expect(wrapper.find(ActionGroup)).toHaveLength(1);
  });

  it("renders the actions and legend in separate groups on mobile browsers", () => {
    wrapper.setProps({ showControls: true, showLegend: true });
    wrapper.setState({ isMobile: false });
    expect(wrapper.find(ActionGroup)).toHaveLength(2);
    expect(wrapper.find(ActionGroup).at(1).find(Legend)).toHaveLength(1);
  });

  describe("when controls are visible", () => {
    beforeEach(() => {
      wrapper.setProps({ showControls: true });
    });

    describe("on desktop browsers", () => {
      beforeEach(() => {
        wrapper.setState({ isMobile: false });
      });

      it("matches snapshot", () => {
        expect(wrapper).toMatchSnapshot();
      });

      it("renders a clear selection button", () => {
        expect(wrapper).toContainMatchingElement('[name="clear-selection"]');
      });

      it("renders a zoom in button", () => {
        expect(wrapper).toContainMatchingElement('[name="zoom-in"]');
      });

      it("renders a zoom out button", () => {
        expect(wrapper).toContainMatchingElement('[name="zoom-out"]');
      });

      it("renders a reset zoom button", () => {
        expect(wrapper).toContainMatchingElement('[name="reset-zoom"]');
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
        wrapper.setState({ isMobile: true });
      });

      it("matches snapshot", () => {
        expect(wrapper).toMatchSnapshot();
      });

      it("renders a clear selection button", () => {
        expect(wrapper).toContainMatchingElement('[name="clear-selection"]');
      });

      it("does not render a zoom in button", () => {
        expect(wrapper).not.toContainMatchingElement('[name="zoom-in"]');
      });

      it("does not render a zoom out button", () => {
        expect(wrapper).not.toContainMatchingElement('[name="zoom-out"]');
      });

      it("does not render a reset zoom button", () => {
        expect(wrapper).not.toContainMatchingElement('[name="reset-zoom"]');
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
        const getCurrentContainerMock = jest.fn();
        getCurrentContainerMock.mockReturnValue(
          (undefined as any) as HTMLDivElement
        );
        (wrapper.instance() as Actions).getCurrentContainer = getCurrentContainerMock;
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        (wrapper.instance() as Actions).updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).not.toHaveBeenCalled();
      });

      it("should set isMobile true if container width is mobile", () => {
        const getCurrentContainerMock = jest.fn();
        getCurrentContainerMock.mockReturnValue(({
          clientWidth: 399,
        } as any) as HTMLDivElement);
        (wrapper.instance() as Actions).getCurrentContainer = getCurrentContainerMock;
        wrapper.instance().setState({ isMobile: false });
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        (wrapper.instance() as Actions).updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: true,
        });
      });

      it("should set isMobile false if container width is not mobile", () => {
        const getCurrentContainerMock = jest.fn();
        getCurrentContainerMock.mockReturnValue(({
          clientWidth: 400,
        } as any) as HTMLDivElement);
        (wrapper.instance() as Actions).getCurrentContainer = getCurrentContainerMock;
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        (wrapper.instance() as Actions).updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: false,
        });
      });

      it("should set isMobile true if window width is mobile", () => {
        const getCurrentContainerMock = jest.fn();
        getCurrentContainerMock.mockReturnValue(({
          clientWidth: 400,
        } as any) as HTMLDivElement);
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 519,
        });
        (wrapper.instance() as Actions).getCurrentContainer = getCurrentContainerMock;
        wrapper.instance().setState({ isMobile: false });
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        (wrapper.instance() as Actions).updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: true,
        });
      });

      it("should set isMobile false if container width is not mobile", () => {
        const getCurrentContainerMock = jest.fn();
        getCurrentContainerMock.mockReturnValue(({
          clientWidth: 400,
        } as any) as HTMLDivElement);
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 520,
        });
        (wrapper.instance() as Actions).getCurrentContainer = getCurrentContainerMock;
        jest.spyOn(wrapper.instance(), "setState");
        wrapper.update();

        (wrapper.instance() as Actions).updateIsMobile();

        expect(getCurrentContainerMock).toHaveBeenCalledTimes(1);
        expect(wrapper.instance().setState).toHaveBeenCalledWith({
          isMobile: false,
        });
      });
    });
  });
});

describe("default props", () => {
  let wrapper: ReactWrapper<Props>;
  let props: Props;
  const mock = jest.spyOn(Actions.defaultProps, "onClearSelection");

  beforeEach(() => {
    props = {
      ranges: [],
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onResetZoom: jest.fn(),
    };
    wrapper = mount(<Actions {...props} />);
  });

  it("onClearSelection", () => {
    wrapper.update();
    wrapper.find(Button).first().simulate("click");
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
