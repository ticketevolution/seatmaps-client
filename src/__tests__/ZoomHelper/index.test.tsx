import "jest-enzyme";

import React from "react";
import { mount, ReactWrapper, shallow, ShallowWrapper } from "enzyme";
import ZoomHelper from "../../ZoomHelper/index";
import PinchZoomInIcon from "../../ZoomHelper/pinch-zoom-in.svg";
import TwoFingerSlideIcon from "../../ZoomHelper/two-finger-slide.svg";

let comp: ShallowWrapper;

const mountComponent = function () {
  comp = shallow(<ZoomHelper />);
  return comp;
};

describe("ZoomHelper", () => {
  beforeEach(() => {
    mountComponent();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("render()", () => {
    it("renders", () => {
      expect(comp.find("img")).toHaveLength(2);
      expect(comp.find("img").find(".zoom-in-icon").props().src).toBe(
        PinchZoomInIcon
      );
      expect(comp.find("img").find(".slide-icon").props().src).toBe(
        TwoFingerSlideIcon
      );
    });

    it("should set discovered to true when container is clicked", () => {
      const setState = jest.spyOn(comp.instance(), "setState");
      comp.find("div").first().simulate("click");
      expect(setState).toHaveBeenCalledWith({ discovered: true });
    });
  });

  describe("on componentDidMount", () => {
    const handleViewportChangeMock = jest.fn();
    beforeEach(() => {
      window.addEventListener = jest.fn();
      jest.useFakeTimers();
    });

    it("should set event handlers", () => {
      comp = mountComponent();
      (comp.instance() as ZoomHelper).handleViewportChange = handleViewportChangeMock;
      //   (comp.instance() as ZoomHelper).componentDidMount();
      jest.advanceTimersByTime(501);

      //   expect(handleViewportChangeMock).toBeCalledTimes(1);
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        1,
        "wheel",
        handleViewportChangeMock
      );
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        2,
        "resize",
        handleViewportChangeMock
      );
    });
  });

  describe("on componentWillUnmount", () => {
    const handleViewportChangeMock = jest.fn();
    beforeEach(() => {
      window.removeEventListener = jest.fn();
    });

    it("should remove event handlers", () => {
      comp = mountComponent();
      (comp.instance() as ZoomHelper).handleViewportChange = handleViewportChangeMock;
      (comp.instance() as ZoomHelper).componentWillUnmount();
      //jest.advanceTimersByTime(501);

      //   expect(handleViewportChangeMock).toBeCalledTimes(1);
      expect(window.removeEventListener).toHaveBeenNthCalledWith(
        1,
        "wheel",
        handleViewportChangeMock
      );
      expect(window.removeEventListener).toHaveBeenNthCalledWith(
        2,
        "resize",
        handleViewportChangeMock
      );
    });
  });

  describe("on handleViewportChange", () => {
    it("should not call hide if discovered is true", () => {
      comp = mountComponent();
      comp.instance().setState({ discovered: true });
      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      (comp.instance() as ZoomHelper).handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        (comp.instance() as ZoomHelper).hide,
        4000
      );
    });

    it("should not call hide if ref is undefined", () => {
      comp = mountComponent();
      const getCurrentContainerMock = jest.fn();
      getCurrentContainerMock.mockReturnValue(
        (undefined as any) as HTMLDivElement
      );
      (comp.instance() as ZoomHelper).getCurrentContainer = getCurrentContainerMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      (comp.instance() as ZoomHelper).handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        (comp.instance() as ZoomHelper).hide,
        4000
      );
    });

    it("should not call hide if shouldHide is false", () => {
      comp = mountComponent();
      const getBoundingClientRectMock = jest.fn();
      getBoundingClientRectMock.mockReturnValue({
        top: 10,
        bottom: 40,
        left: 10,
        right: 40,
        width: 30,
      });

      const getCurrentContainerMock = jest.fn();
      getCurrentContainerMock.mockReturnValue(({
        getBoundingClientRect: getBoundingClientRectMock,
      } as any) as HTMLDivElement);
      (comp.instance() as ZoomHelper).getCurrentContainer = getCurrentContainerMock;

      const shouldHideMock = jest.fn();
      shouldHideMock.mockReturnValue(false);
      (comp.instance() as ZoomHelper).shouldHide = shouldHideMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      (comp.instance() as ZoomHelper).handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        (comp.instance() as ZoomHelper).hide,
        4000
      );
    });

    it("should not call hide if shouldHide is false", () => {
      comp = mountComponent();
      const getBoundingClientRectMock = jest.fn();
      getBoundingClientRectMock.mockReturnValue({
        top: 10,
        bottom: 40,
        left: 10,
        right: 40,
        width: 30,
      });

      const getCurrentContainerMock = jest.fn();
      getCurrentContainerMock.mockReturnValue(({
        getBoundingClientRect: getBoundingClientRectMock,
      } as any) as HTMLDivElement);
      (comp.instance() as ZoomHelper).getCurrentContainer = getCurrentContainerMock;

      const shouldHideMock = jest.fn();
      shouldHideMock.mockReturnValue(true);
      (comp.instance() as ZoomHelper).shouldHide = shouldHideMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      (comp.instance() as ZoomHelper).handleViewportChange();

      expect(setTimeoutMock).toHaveBeenCalledWith(
        (comp.instance() as ZoomHelper).hide,
        4000
      );
    });
  });

  describe("shuoldHide", () => {
    let shouldHide: (bounds: DOMRect) => boolean;
    const mockBounds: DOMRect = {
      top: 10,
      height: 10,
      bottom: 20,
      left: 10,
      width: 10,
      right: 20,
      x: 10,
      y: 10,
      toJSON: jest.fn(),
    };
    beforeEach(() => {
      comp = mountComponent();
      shouldHide = (comp.instance() as ZoomHelper).shouldHide;
    });

    it("should return false if top is higher than window height", () => {
      const bounds = {
        ...mockBounds,
        top: window.innerHeight,
      };

      expect(shouldHide(bounds)).toBe(false);
    });

    it("should return false if bounds has 0 height and 0 top", () => {
      const bounds = {
        ...mockBounds,
        top: 0,
        height: 0,
      };

      expect(shouldHide(bounds)).toBe(false);
    });

    it("should return false if bounds left is greather than window witdh", () => {
      const bounds = {
        ...mockBounds,
        left: window.innerWidth + 1,
      };

      expect(shouldHide(bounds)).toBe(false);
    });

    it("should return false if bounds has 0 left and 0 width", () => {
      const bounds = {
        ...mockBounds,
        left: 0,
        width: 0,
      };

      expect(shouldHide(bounds)).toBe(false);
    });

    it("should return true if bounds is within window viewport", () => {
      const bounds = {
        ...mockBounds,
        left: window.innerWidth - 1,
        top: window.innerHeight - 1,
      };

      expect(shouldHide(bounds)).toBe(true);
    });
  });

  describe("getCurrentContainer", () => {
    it("should return ref container", () => {
      comp = mountComponent();
      const currentContainer = (comp.instance() as ZoomHelper).container;

      expect((comp.instance() as ZoomHelper).getCurrentContainer()).toBe(
        currentContainer.current
      );
    });
  });
});
