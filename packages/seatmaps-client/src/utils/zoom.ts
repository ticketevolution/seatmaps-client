import { getReferencePoint, getScreenCTM, getViewBox } from "./utils";

const ZOOM_COEFFICIENT = 5;
const SCROLL_PAN_COEFFICIENT = 0.5;
const MOUSE_MOVEMENT_TRAP_LOWER_BOUND = 50;

// determines the magnitude of a vector
function magnitude(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
}

// prevents the default reaction to an event
function preventDefault(event: Event) {
  event.preventDefault();
}

// retrieves the line height of the page by generating an unstyled, blank span and measuring its height
function getScrollLineHeight() {
  const iframe = document.createElement("iframe");
  iframe.src = "#";
  document.body.appendChild(iframe);

  if (!iframe.contentDocument) {
    throw new Error("unable to create an iframe to test for line height");
  }

  iframe.contentDocument.open();
  iframe.contentDocument.write(
    "<!DOCTYPE html><html><head></head><body><span>a</span></body></html>",
  );
  iframe.contentDocument.close();

  const testElement = iframe.contentDocument.querySelector("span");
  if (!testElement) {
    throw new Error("unable to find test element for line height test");
  }

  const lineHeight = testElement.offsetHeight;
  document.body.removeChild(iframe);
  return lineHeight;
}

export interface ZoomControl {
  zoomIn: (percent: number) => void;
  zoomOut: (percent: number) => void;
  reset: () => void;
  teardown: () => void;
  enable: () => void;
  disable: () => void;
}

/*
 * enables support for touch and mouse control of an svg element's viewport
 * two-finger drags will pan the map
 * mouse scrolling and pinching will zoom in and out
 */
export default function (svg: SVGSVGElement) {
  // used to convert screen coordinates into coordinates in the svg space
  const referencePoint = getReferencePoint(svg);

  // converts a point from the page coordinate space to a point in the svg coordinate space
  function svgPoint(x: number, y: number): number[] {
    const matrix = getScreenCTM(svg);
    if (!matrix) {
      throw new Error(
        "cannot convert dom point to svg point due to missing conversion matrix",
      );
    }

    referencePoint.x = x;
    referencePoint.y = y;

    const p = referencePoint.matrixTransform(matrix.inverse());
    return [p.x, p.y];
  }

  // initial touch points (x and y components of points a and b)
  let iTouchAX: number;
  let iTouchAY: number;
  let iTouchBX: number;
  let iTouchBY: number;

  // initial viewbox of the svg element (at the beginning of the current manipulation)
  let initialViewboxX: number;
  let initialViewboxY: number;
  let initialViewboxHeight: number;
  let initialViewboxWidth: number;

  const viewbox = getViewBox(svg);

  function updateInitialViewbox() {
    initialViewboxX = viewbox.x;
    initialViewboxY = viewbox.y;
    initialViewboxWidth = viewbox.width;
    initialViewboxHeight = viewbox.height;
  }

  // original viewBox of the svg element (before the first manipulation)
  const originalViewboxX = viewbox.x;
  const originalViewboxY = viewbox.y;
  const originalViewboxWidth = viewbox.width;
  const originalViewboxHeight = viewbox.height;

  function translate(x: number, y: number) {
    viewbox.x += x;
    viewbox.y += y;
  }

  function scale(scale: number) {
    const initialViewboxHeight = viewbox.height;
    const initialViewboxWidth = viewbox.width;

    viewbox.height *= scale;
    viewbox.width *= scale;

    translate(
      0 - (viewbox.width - initialViewboxWidth) / 2,
      0 - (viewbox.height - initialViewboxHeight) / 2,
    );
  }

  // decreases the size of the map, relative to the viewport size
  function zoomIn(percent: number) {
    scale(1 - percent);
  }

  // increases the size of the map, relative to the viewport size
  function zoomOut(percent: number) {
    scale(1 + percent);
  }

  // resets the svg's viewport to its original version
  function reset() {
    viewbox.x = originalViewboxX;
    viewbox.y = originalViewboxY;
    viewbox.width = originalViewboxWidth;
    viewbox.height = originalViewboxHeight;
  }

  let touching = false;

  // for each touch start with exactly two touches, update the initial touch points and viewbox
  function handleTouchStart(event: TouchEvent) {
    // only respond when two fingers are on the screen
    if (event.touches.length !== 2) {
      return;
    }

    touching = true;
    event.preventDefault();

    const iTouchA = event.touches.item(0);
    const iTouchB = event.touches.item(1);
    if (!iTouchA || !iTouchB) {
      return;
    }

    // update initial touch points
    iTouchAX = iTouchA.clientX;
    iTouchAY = iTouchA.clientY;
    iTouchBX = iTouchB.clientX;
    iTouchBY = iTouchB.clientY;

    updateInitialViewbox();
  }

  function handleTouchMove(event: TouchEvent) {
    const touchA = event.touches.item(0);
    const touchB = event.touches.item(1);

    // only respond when two fingers are on the screen
    if (event.touches.length !== 2 || !touchA || !touchB) {
      return;
    }

    event.preventDefault();

    // current points of the touch vector
    const touchAX = touchA.clientX;
    const touchAY = touchA.clientY;
    const touchBX = touchB.clientX;
    const touchBY = touchB.clientY;

    // initial and current touch vector midpoints
    const [touchMidX, touchMidY] = svgPoint(
      (touchAX + touchBX) / 2,
      (touchAY + touchBY) / 2,
    );
    const [iTouchMidX, iTouchMidY] = svgPoint(
      (iTouchAX + iTouchBX) / 2,
      (iTouchAY + iTouchBY) / 2,
    );

    // rate of change of the touch vector
    const iTouchMag = magnitude(iTouchAX, iTouchAY, iTouchBX, iTouchBY);
    const touchMag = magnitude(touchAX, touchAY, touchBX, touchBY);
    const magRatio = iTouchMag / touchMag;

    // magnitude components of the viewbox vector
    viewbox.height = initialViewboxHeight * magRatio;
    viewbox.width = initialViewboxWidth * magRatio;

    // change in the magnitude components of the viewbox vector
    const dvbh = viewbox.height - initialViewboxHeight;
    const dvbw = viewbox.width - initialViewboxWidth;

    // position components of the viewbox vector
    viewbox.x = initialViewboxX - touchMidX + iTouchMidX - dvbh / 2;
    viewbox.y = initialViewboxY - touchMidY + iTouchMidY - dvbw / 2;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) {
      touching = false;
    }
  }

  // initial mouse points in the client coordinate space
  let iMouseX: number;
  let iMouseY: number;

  let dragging = false;

  function handleMouseDown(event: MouseEvent) {
    iMouseX = event.clientX;
    iMouseY = event.clientY;

    event.stopPropagation();
    updateInitialViewbox();

    dragging = true;
  }

  // dragging the svg will also trigger click events, so we must trap them
  // unless they drag the svg a very small distance (common with trackpads)
  function handleClick(e: MouseEvent) {
    if (
      magnitude(e.clientX, e.clientY, iMouseX, iMouseY) >
      MOUSE_MOVEMENT_TRAP_LOWER_BOUND
    ) {
      e.stopPropagation();
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!dragging) {
      return;
    }

    const [mouseSVGX, mouseSVGY] = svgPoint(event.clientX, event.clientY);
    const [iMouseSVGX, iMouseSVGY] = svgPoint(iMouseX, iMouseY);

    viewbox.x = initialViewboxX - mouseSVGX + iMouseSVGX;
    viewbox.y = initialViewboxY - mouseSVGY + iMouseSVGY;
  }

  function stopDragging() {
    dragging = false;
  }

  const lineHeight = getScrollLineHeight();

  function handleWheel(event: WheelEvent) {
    let deltaX, deltaY;

    if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
      deltaX = event.deltaX;
      deltaY = event.deltaY;
    } else if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      deltaX = event.deltaX * lineHeight;
      deltaY = event.deltaY * lineHeight;
    } else {
      return;
    }

    event.preventDefault();

    updateInitialViewbox();

    if (event.ctrlKey) {
      // Handle controlled scrolls as zoom inputs.
      const delta = deltaY;

      viewbox.height =
        viewbox.height * (1 + (delta / window.innerHeight) * ZOOM_COEFFICIENT);
      viewbox.width =
        viewbox.width * (1 + (delta / window.innerWidth) * ZOOM_COEFFICIENT);

      translate(
        0 - (viewbox.width - initialViewboxWidth) / 2,
        0 - (viewbox.height - initialViewboxHeight) / 2,
      );
    } else {
      // Handle non-controlled scrolls as pan inputs.
      translate(
        deltaX * SCROLL_PAN_COEFFICIENT,
        deltaY * SCROLL_PAN_COEFFICIENT,
      );
    }
  }

  type GestureEvent = Event & {
    readonly rotation: number;
    readonly scale: number;
  };

  function handleGestureChange(event: Event) {
    if (touching) {
      return;
    }

    updateInitialViewbox();

    viewbox.width = (originalViewboxWidth * 1) / (event as GestureEvent).scale;
    viewbox.height =
      (originalViewboxHeight * 1) / (event as GestureEvent).scale;

    viewbox.x -= (viewbox.width - initialViewboxWidth) / 2;
    viewbox.y -= (viewbox.height - initialViewboxHeight) / 2;
  }

  function setup() {
    // disables full page zooming and panning on safari mobile
    svg.addEventListener("touchstart", handleTouchStart, { passive: false });
    svg.addEventListener("touchmove", handleTouchMove, { passive: false });
    svg.addEventListener("touchend", handleTouchEnd, { passive: false });
    svg.addEventListener("mousedown", handleMouseDown);
    svg.addEventListener("click", handleClick);
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseup", stopDragging);
    svg.addEventListener("mouseleave", stopDragging);
    svg.addEventListener("wheel", handleWheel);
    svg.addEventListener("gesturestart", preventDefault, { passive: false });
    svg.addEventListener("gesturechange", preventDefault, { passive: false });
    svg.addEventListener("gesturechange", handleGestureChange);
    svg.addEventListener("gestureend", preventDefault, { passive: false });
  }

  function teardown() {
    svg.removeEventListener("touchstart", handleTouchStart);
    svg.removeEventListener("touchmove", handleTouchMove);
    svg.removeEventListener("touchend", handleTouchEnd);
    svg.removeEventListener("mousedown", handleMouseDown);
    svg.removeEventListener("click", handleClick);
    svg.removeEventListener("mousemove", handleMouseMove);
    svg.removeEventListener("mouseup", stopDragging);
    svg.removeEventListener("mouseleave", stopDragging);
    svg.removeEventListener("wheel", handleWheel);
    svg.removeEventListener("gesturestart", preventDefault);
    svg.removeEventListener("gesturechange", preventDefault);
    svg.removeEventListener("gesturechange", handleGestureChange);
    svg.removeEventListener("gestureend", preventDefault);
  }

  setup();

  return {
    zoomIn,
    zoomOut,
    reset,
    teardown,
    enable: setup,
    disable: teardown,
  };
}
