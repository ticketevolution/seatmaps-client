import "jest-enzyme";

import React from "react";
import { shallow, ShallowWrapper } from "enzyme";
import ZoomHelper from "../../ZoomHelper/index";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

let comp: ShallowWrapper<ZoomHelper["props"], ZoomHelper["state"], ZoomHelper>;

const mountComponent = function () {
  comp = shallow<ZoomHelper>(<ZoomHelper />);
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
      expect(comp.find(".zoom-in-icon")).toHaveLength(1);
      expect(comp.find(".slide-icon")).toHaveLength(1);
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
      comp.instance().handleViewportChange = handleViewportChangeMock;
      //   (comp.instance() ).componentDidMount();
      jest.advanceTimersByTime(501);

      //   expect(handleViewportChangeMock).toBeCalledTimes(1);
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        1,
        "wheel",
        handleViewportChangeMock,
      );
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        2,
        "resize",
        handleViewportChangeMock,
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
      comp.instance().handleViewportChange = handleViewportChangeMock;
      comp.instance().componentWillUnmount();
      // jest.advanceTimersByTime(501);

      //   expect(handleViewportChangeMock).toBeCalledTimes(1);
      expect(window.removeEventListener).toHaveBeenNthCalledWith(
        1,
        "wheel",
        handleViewportChangeMock,
      );
      expect(window.removeEventListener).toHaveBeenNthCalledWith(
        2,
        "resize",
        handleViewportChangeMock,
      );
    });
  });

  describe("on handleViewportChange", () => {
    it("should not call hide if discovered is true", () => {
      comp = mountComponent();
      comp.instance().setState({ discovered: true });
      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      comp.instance().handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        comp.instance().hide,
        4000,
      );
    });

    it("should not call hide if ref is undefined", () => {
      comp = mountComponent();
      const getCurrentContainerMock =
        jest.fn<ZoomHelper["getCurrentContainer"]>();
      getCurrentContainerMock.mockReturnValue(
        undefined as unknown as HTMLDivElement,
      );
      comp.instance().getCurrentContainer = getCurrentContainerMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      comp.instance().handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        comp.instance().hide,
        4000,
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

      const getCurrentContainerMock =
        jest.fn<ZoomHelper["getCurrentContainer"]>();
      getCurrentContainerMock.mockReturnValue({
        getBoundingClientRect: getBoundingClientRectMock,
      } as unknown as HTMLDivElement);
      comp.instance().getCurrentContainer = getCurrentContainerMock;

      const shouldHideMock = jest.fn<ZoomHelper["shouldHide"]>();
      shouldHideMock.mockReturnValue(false);
      comp.instance().shouldHide = shouldHideMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      comp.instance().handleViewportChange();

      expect(setTimeoutMock).not.toHaveBeenCalledWith(
        comp.instance().hide,
        4000,
      );
    });

    // TODO: this block has identical title to another one, figure out what is actually tested
    it("should not call hide if shouldHide is false (duplicate title)", () => {
      comp = mountComponent();
      const getBoundingClientRectMock = jest.fn();
      getBoundingClientRectMock.mockReturnValue({
        top: 10,
        bottom: 40,
        left: 10,
        right: 40,
        width: 30,
      });

      const getCurrentContainerMock =
        jest.fn<ZoomHelper["getCurrentContainer"]>();
      getCurrentContainerMock.mockReturnValue({
        getBoundingClientRect: getBoundingClientRectMock,
      } as unknown as HTMLDivElement);
      comp.instance().getCurrentContainer = getCurrentContainerMock;

      const shouldHideMock = jest.fn<ZoomHelper["shouldHide"]>();
      shouldHideMock.mockReturnValue(true);
      comp.instance().shouldHide = shouldHideMock;

      comp.update();

      const setTimeoutMock = jest.spyOn(window, "setTimeout");
      comp.instance().handleViewportChange();

      expect(setTimeoutMock).toHaveBeenCalledWith(comp.instance().hide, 4000);
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
      shouldHide = comp.instance().shouldHide;
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
      const currentContainer = comp.instance().container;

      expect(comp.instance().getCurrentContainer()).toBe(
        currentContainer.current,
      );
    });
  });
});
