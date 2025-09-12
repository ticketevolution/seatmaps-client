import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ZoomHelper, { ZoomHelperInstance } from "../../ZoomHelper/index";
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
  afterEach,
} from "@jest/globals";

jest.useFakeTimers();

describe("ZoomHelper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("render()", () => {
    it("renders icons", () => {
      render(<ZoomHelper />);
      expect(document.querySelector(".zoom-in-icon")).toBeInTheDocument();
      expect(document.querySelector(".slide-icon")).toBeInTheDocument();
    });

    it("sets discovered to true when container is clicked", () => {
      render(<ZoomHelper />);
      const container = screen.getByText(/pinch to zoom/i).parentElement!;
      expect(container).toHaveStyle("opacity: 1"); // initially visible
      fireEvent.click(container);
      expect(container).toHaveStyle("opacity: 0"); // becomes hidden
    });
  });

  describe("on componentWillUnmount", () => {
    beforeEach(() => {
      window.removeEventListener = jest.fn();
    });

    it("removes event handlers", () => {
      const { unmount } = render(<ZoomHelper />);
      act(() => {
        jest.advanceTimersByTime(501);
      });
      unmount();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });

  describe("handleViewportChange", () => {
    it("does not call hide if already discovered", () => {
      render(<ZoomHelper />);
      const container = screen.getByText(/pinch to zoom/i).parentElement!;
      fireEvent.click(container);
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      fireEvent.resize(window);
      expect(setTimeoutSpy).not.toHaveBeenCalledWith(
        expect.any(Function),
        4000,
      );
    });

    it("does not call hide if ref is missing", () => {
      const { unmount } = render(<ZoomHelper />);
      const div = document.querySelector("div");
      if (div) {
        div.getBoundingClientRect = () => undefined as unknown as DOMRect;
      }
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      fireEvent.resize(window);
      const calls = setTimeoutSpy.mock.calls;
      expect(calls.some(([, delay]) => delay === 4000)).toBe(false);
      unmount();
    });

    it("calls hide after 4s if shouldHide is true", () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      render(<ZoomHelper />);

      act(() => {
        jest.advanceTimersByTime(501);
      });
      const zoomContainer = screen.getByText(/pinch to zoom/i).parentElement!;
      jest.spyOn(zoomContainer, "getBoundingClientRect").mockReturnValue({
        top: 10,
        bottom: 20,
        left: 10,
        right: 20,
        width: 10,
        height: 10,
        x: 10,
        y: 10,
        toJSON: () => {},
      });

      fireEvent.resize(window);

      expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 4000)).toBe(
        true,
      );

      setTimeoutSpy.mockRestore();
    });
  });

  describe("on componentDidMount", () => {
    beforeEach(() => {
      window.addEventListener = jest.fn();
    });

    it("sets event handlers after 500ms", () => {
      render(<ZoomHelper />);
      act(() => {
        jest.advanceTimersByTime(501);
      });
      expect(window.addEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
    });
  });

  describe("shouldHide", () => {
    it("returns false if element is completely outside viewport", () => {
      let instance: ZoomHelperInstance | null = null;
      render(
        <ZoomHelper
          ref={(node) => {
            instance = node;
          }}
        />,
      );

      const bounds = {
        top: window.innerHeight + 100,
        bottom: window.innerHeight + 200,
        left: window.innerWidth + 100,
        right: window.innerWidth + 200,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect;

      expect(instance!.shouldHide(bounds)).toBe(false);
    });

    it("returns true if element is within viewport", () => {
      let instance: ZoomHelperInstance | null = null;

      render(
        <ZoomHelper
          ref={(node) => {
            instance = node;
          }}
        />,
      );
      const bounds = {
        top: 10,
        bottom: 20,
        left: 10,
        right: 20,
        width: 10,
        height: 10,
        x: 10,
        y: 10,
        toJSON: () => {},
      } as DOMRect;

      expect(instance!.shouldHide(bounds)).toBe(true);
    });
  });

  describe("getCurrentContainer", () => {
    it("returns ref container", () => {
      render(<ZoomHelper />);
      const container = screen.getByText(/pinch to zoom/i).parentElement!;
      expect(container).toBeInTheDocument();
      expect(container.tagName).toBe("DIV");
    });
  });
});
