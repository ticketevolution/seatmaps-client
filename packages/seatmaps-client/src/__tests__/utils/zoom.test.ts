import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { ZoomControl } from "../../utils/zoom";

describe("zoom", () => {
  let zoomApi: ZoomControl;
  let svg: SVGSVGElement;
  let mockPoint: DOMRect;
  let eventHandlers: { [key: string]: ((e: Event) => void)[] } = {};
  const addEventListenerMock = jest.fn<typeof document.addEventListener>();

  const inverseMock = jest.fn();
  const matrixTransformMock = jest.fn();
  const stopPropagationMock = jest.fn();
  const removeEventListenerMock = jest.fn();
  const getViewBoxMock = jest.fn();
  const getScreenCTMMock = jest.fn();
  const getReferencePointMock = jest.fn();

  // NOTE: with current mock structure jest fails to mock those without using require("../../utils/zoom")
  // TODO: probably would be better to not rely on mock resets and isolate sigleton for each test case
  jest.mock("../../utils/utils", () => ({
    getViewBox: getViewBoxMock,
    getScreenCTM: getScreenCTMMock,
    getReferencePoint: getReferencePointMock,
  }));

  const defaultEvent = {
    preventDefault: jest.fn(),
    stopPropagation: stopPropagationMock,
  };

  const touches = [
    { clientX: 11, clientY: 11 },
    { clientX: 19, clientY: 19 },
  ];

  const touchStartEvent = {
    ...defaultEvent,
    touches: {
      length: touches.length,
      item: (index: number) => {
        return touches[index];
      },
    },
  } as unknown as Event;

  const mouseDownEvent = {
    ...defaultEvent,
    clientX: 10,
    clientY: 10,
  } as unknown as Event;

  const events = [
    { eventName: "touchstart", passiveArg: true },
    { eventName: "touchmove", passiveArg: true },
    { eventName: "touchend", passiveArg: true },
    { eventName: "mousedown", passiveArg: false },
    { eventName: "click", passiveArg: false },
    { eventName: "mousemove", passiveArg: false },
    { eventName: "mouseup", passiveArg: false },
    { eventName: "mouseleave", passiveArg: false },
    { eventName: "wheel", passiveArg: false },
    { eventName: "gesturestart", passiveArg: true },
    { eventName: "gesturechange", passiveArg: true },
    { eventName: "gesturechange", passiveArg: false, handlerIndex: 1 },
    { eventName: "gestureend", passiveArg: true },
  ];

  const triggerEvent = (eventName: string, e: Event) => {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName].forEach((handler) => {
        handler(e);
      });
    }
  };

  beforeEach(() => {
    mockPoint = {
      x: 10,
      y: 10,
      height: 10,
      width: 10,
      bottom: 10,
      left: 10,
      right: 10,
      top: 10,
      toJSON: jest.fn(),
    };

    eventHandlers = {};
    addEventListenerMock.mockImplementation(
      (event: string, handler: (e: Event) => void) => {
        eventHandlers[event] = eventHandlers[event] || [];
        eventHandlers[event].push(handler);
      },
    );

    matrixTransformMock.mockReturnValue({
      x: 4,
      y: 4,
    });
    inverseMock.mockReturnValue({});
    getReferencePointMock.mockImplementation(
      () =>
        ({
          matrixTransform: matrixTransformMock,
        }) as unknown as ReturnType<typeof getReferencePointMock>,
    );
    getScreenCTMMock.mockImplementation(
      () =>
        ({
          inverse: inverseMock,
        }) as unknown as ReturnType<typeof getScreenCTMMock>,
    );
    getViewBoxMock.mockImplementation(() => mockPoint);
    svg = {
      createSVGPoint: jest.fn(),
      getScreenCTM: jest.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    } as unknown as SVGSVGElement;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeZoom } = require("../../utils/zoom");
    zoomApi = initializeZoom(svg);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should setup event listeners", () => {
    events.forEach((event, index) => {
      if (event.passiveArg) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(addEventListenerMock).toHaveBeenNthCalledWith(
          index + 1,
          event.eventName,
          eventHandlers[event.eventName][event.handlerIndex || 0],
          { passive: false },
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(addEventListenerMock).toHaveBeenNthCalledWith(
          index + 1,
          event.eventName,
          eventHandlers[event.eventName][event.handlerIndex || 0],
        );
      }
    });
  });

  it("should teardown event listeners", () => {
    zoomApi.teardown();
    events.forEach((event, index) => {
      expect(removeEventListenerMock).toHaveBeenNthCalledWith(
        index + 1,
        event.eventName,
        eventHandlers[event.eventName][event.handlerIndex || 0],
      );
    });
  });

  describe("zoom api", () => {
    it("zomms in", () => {
      zoomApi.zoomIn(0.1);

      expect(mockPoint.height).toBe(9);
      expect(mockPoint.width).toBe(9);
      expect(mockPoint.x).toBe(10.5);
      expect(mockPoint.y).toBe(10.5);
    });

    it("zomms out", () => {
      zoomApi.zoomOut(0.1);

      expect(mockPoint.height).toBe(11);
      expect(mockPoint.width).toBe(11);
      expect(mockPoint.x).toBe(9.5);
      expect(mockPoint.y).toBe(9.5);
    });

    it("resets to original position after zoom", () => {
      zoomApi.zoomOut(0.1);
      expect(mockPoint.height).toBe(11);
      expect(mockPoint.width).toBe(11);
      expect(mockPoint.x).toBe(9.5);
      expect(mockPoint.y).toBe(9.5);

      zoomApi.reset();
      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleGestureChange", () => {
      const e1 = {
        ...defaultEvent,
        touches: {
          length: 1,
        },
      } as unknown as Event;
      const e2 = {
        ...defaultEvent,
        scale: 2,
      } as unknown as Event;
      triggerEvent("touchend", e1);
      triggerEvent("gesturechange", e2);

      expect(mockPoint.height).toBe(5);
      expect(mockPoint.width).toBe(5);
      expect(mockPoint.x).toBe(12.5);
      expect(mockPoint.y).toBe(12.5);
    });

    it("handleGestureChange after handleTouchStart should not update point", () => {
      const e = {
        ...defaultEvent,
        scale: 2,
      } as unknown as Event;
      triggerEvent("touchstart", touchStartEvent);
      triggerEvent("gesturechange", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleWheel when ctrl key is not pressed and delta mode is DOM_DELTA_PIXEL", () => {
      const e = {
        ...defaultEvent,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaX: 4,
        deltaY: 4,
      } as unknown as Event;
      triggerEvent("wheel", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(12);
      expect(mockPoint.y).toBe(12);
    });

    it("handleWheel when ctrl key is not pressed and delta mode is DOM_DELTA_LINE", () => {
      const e = {
        ...defaultEvent,
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        deltaX: 4,
        deltaY: 4,
      } as unknown as Event;
      triggerEvent("wheel", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleWheel when ctrl key is pressed and delta mode is DOM_DELTA_PIXEL", () => {
      const e = {
        ...defaultEvent,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaX: 10,
        deltaY: 10,
        ctrlKey: true,
      } as unknown as Event;
      triggerEvent("wheel", e);

      expect(mockPoint.height).toBe(10.651041666666668);
      expect(mockPoint.width).toBe(10.48828125);
      expect(mockPoint.x).toBe(9.755859375);
      expect(mockPoint.y).toBe(9.674479166666666);
    });

    it("handleWheel when ctrl key is pressed and delta mode is DOM_DELTA_LINE", () => {
      const e = {
        ...defaultEvent,
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        deltaX: 10,
        deltaY: 10,
        ctrlKey: true,
      } as unknown as Event;
      triggerEvent("wheel", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleWheel should not change point if delta mode is not DOM_DELTA_LINE or DOM_DELTA_PIXEL", () => {
      const e = {
        ...defaultEvent,
        deltaX: 10,
        deltaY: 10,
        ctrlKey: true,
      } as unknown as Event;
      triggerEvent("wheel", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleMouseMove should do nothing if not dragging", () => {
      const e = {
        ...defaultEvent,
      } as unknown as Event;
      triggerEvent("mouseleave", e);
      triggerEvent("mousemove", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleMouseMove if dragging with no matrix should throw error", () => {
      getScreenCTMMock.mockReturnValue(
        undefined as unknown as ReturnType<typeof getScreenCTMMock>,
      );
      const e = {
        ...defaultEvent,
      } as unknown as Event;
      triggerEvent("mousedown", mouseDownEvent);

      expect(() => {
        triggerEvent("mousemove", e);
      }).toThrow(
        "cannot convert dom point to svg point due to missing conversion matrix",
      );

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleMouseMove if dragging", () => {
      const e = {
        ...defaultEvent,
      } as unknown as Event;
      triggerEvent("mousedown", mouseDownEvent);
      triggerEvent("mousemove", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleClick should not stop propagation if magnitude is smaller than bound", () => {
      triggerEvent("click", mouseDownEvent);

      expect(stopPropagationMock).not.toHaveBeenCalled();
    });

    it("handleClick should stop propagation if magnitude is bigger than bound", () => {
      const e = {
        ...defaultEvent,
        clientX: 200,
        clientY: 200,
      } as unknown as Event;
      triggerEvent("mousedown", mouseDownEvent);
      triggerEvent("click", e);

      expect(stopPropagationMock).toHaveBeenCalledTimes(2);
    });

    it("handleTouchEnd with touches < 2 should enable gesturechange to zoom", () => {
      const e1 = {
        ...defaultEvent,
        touches: {
          length: 1,
        },
      } as unknown as Event;
      const e2 = {
        ...defaultEvent,
        scale: 2,
      } as unknown as Event;

      triggerEvent("touchend", e1);
      triggerEvent("gesturechange", e2);

      expect(mockPoint.height).toBe(5);
      expect(mockPoint.width).toBe(5);
      expect(mockPoint.x).toBe(12.5);
      expect(mockPoint.y).toBe(12.5);
    });

    it("handleTouchEnd with touches >= 2 should disable gesturechange zoom", () => {
      const e1 = {
        ...defaultEvent,
        touches: {
          length: 2,
        },
      } as unknown as Event;
      const e2 = {
        ...defaultEvent,
        scale: 2,
      } as unknown as Event;

      triggerEvent("touchstart", touchStartEvent);
      triggerEvent("touchend", e1);
      triggerEvent("gesturechange", e2);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchMove if no touches should not zoom", () => {
      const e = {
        touches: {
          item: () => {
            return undefined;
          },
        },
      } as unknown as Event;

      triggerEvent("touchmove", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchMove if first item is undefined should not zoom", () => {
      const e = {
        touches: {
          length: 2,
          item: () => {
            return undefined;
          },
        },
      } as unknown as Event;

      triggerEvent("touchmove", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchMove if second item is undefined should not zoom", () => {
      const e = {
        touches: {
          length: 2,
          item: (index: number) => {
            if (index === 0) {
              return touches[0];
            }
            return undefined;
          },
        },
      } as unknown as Event;

      triggerEvent("touchmove", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchMove if both touches are present should zoom", () => {
      triggerEvent("touchstart", touchStartEvent);
      triggerEvent("touchmove", touchStartEvent);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchStart should not modify viewbox if number of touches is < 2", () => {
      const e = {
        touches: {
          length: 1,
          item: () => {
            return undefined;
          },
        },
      } as unknown as Event;

      triggerEvent("touchstart", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    it("handleTouchStart should not modify viewbox if first item is undefined", () => {
      const e = {
        ...defaultEvent,
        touches: {
          length: 2,
          item: () => {
            return undefined;
          },
        },
      } as unknown as Event;

      triggerEvent("touchstart", e);

      expect(mockPoint.height).toBe(10);
      expect(mockPoint.width).toBe(10);
      expect(mockPoint.x).toBe(10);
      expect(mockPoint.y).toBe(10);
    });

    describe("getScrollLineHeight", () => {
      afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = "";
      });

      it("Should throw error if span not found in iframe", () => {
        const createElementMock = jest.spyOn(document, "createElement");
        createElementMock.mockReturnValueOnce({
          contentDocument: {
            open: jest.fn(),
            write: jest.fn(),
            close: jest.fn(),
            querySelector: () => {
              return undefined;
            },
          },
        } as unknown as HTMLElement);

        const appendChildMock = jest.spyOn(document.body, "appendChild");
        appendChildMock.mockImplementationOnce((node: Node) => {
          return node;
        });

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { initializeZoom } = require("../../utils/zoom");
        expect(() => {
          zoomApi = initializeZoom(svg);
        }).toThrow("unable to find test element for line height test");
      });

      it("Should throw error if iframe not found in document", () => {
        const createElementMock = jest.spyOn(document, "createElement");
        createElementMock.mockReturnValueOnce({
          contentDocument: undefined,
        } as unknown as HTMLElement);

        const appendChildMock = jest.spyOn(document.body, "appendChild");
        appendChildMock.mockImplementationOnce((node: Node) => {
          return node;
        });

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { initializeZoom } = require("../../utils/zoom");
        expect(() => {
          zoomApi = initializeZoom(svg);
        }).toThrow("unable to create an iframe to test for line height");
      });
    });
  });
});
