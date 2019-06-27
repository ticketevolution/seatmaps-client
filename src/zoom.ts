const ZOOM_COEFFICIENT = 5
const SCROLL_PAN_COEFFICIENT = .5

// determines the magnitude of a vector
function magnitude (ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}

// prevents the default reaction to an event
function preventDefault (event: Event) {
  event.preventDefault()
}

// retrieves the line height of the page by generating an unstyled, blank span and measuring its height
function getScrollLineHeight () {
  const iframe = document.createElement('iframe')
  iframe.src = '#'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    throw new Error('unable to create an iframe to test for line height')
  }

  doc.open()
  doc.write('<!DOCTYPE html><html><head></head><body><span>a</span></body></html>')
  doc.close()

  const testElement = doc.querySelector('span')
  if (!testElement) {
    throw new Error('unable to find test element for line height test')
  }

  const lineHeight = testElement.offsetHeight
  document.body.removeChild(iframe)
  return lineHeight
}

export interface ZoomControl {
  zoomIn: (percent: number) => void
  zoomOut: (percent: number) => void
  reset: () => void
  teardown: () => void
}

/*
* enables support for touch and mouse control of an svg element's viewport
* two-finger drags will pan the map
* mouse scrolling and pinching will zoom in and out
*/
export default function (svg: SVGSVGElement) {
  // used to convert screen coordinates into coordinates in the svg space
  const referencePoint = svg.createSVGPoint()

  // converts a point from the page coordinate space to a point in the svg coordinate space
  function svgPoint (x: number, y: number): number[] {
    const matrix = svg.getScreenCTM()
    if (!matrix) {
      throw new Error('cannot convert dom point to svg point due to missing conversion matrix')
    }

    referencePoint.x = x
    referencePoint.y = y

    let p = referencePoint.matrixTransform(matrix.inverse())
    return [p.x, p.y]
  }

  // initial touch points (x and y components of points a and b)
  let iTouchAX: number
  let iTouchAY: number
  let iTouchBX: number
  let iTouchBY: number

  // initial viewbox of the svg element (before the latest manipulation)
  let ivbx: number
  let ivby: number
  let ivbh: number
  let ivbw: number

  const viewbox = svg.viewBox.baseVal

  function updateInitialViewbox () {
    ivbx = viewbox.x
    ivby = viewbox.y
    ivbw = viewbox.width
    ivbh = viewbox.height
  }

  // original viewBox of the svg element (before the first manipulation)
  const ovbx = viewbox.x
  const ovby = viewbox.y
  const ovbw = viewbox.width
  const ovbh = viewbox.height

  function scale (scale: number) {
    const initialViewboxHeight = viewbox.height
    const initialViewboxWidth = viewbox.width

    viewbox.height *= scale
    viewbox.width *= scale
    
    viewbox.x -= (viewbox.width - initialViewboxWidth) / 2
    viewbox.y -= (viewbox.height - initialViewboxHeight) / 2
  }

  function zoomIn (percent: number) {
    scale(1 - percent)
  }

  function zoomOut (percent: number) {
    scale(1 + percent)
  }

  // returns the svg to the original zoom level and viewport location
  function reset () {
    viewbox.x = ovbx
    viewbox.y = ovby
    viewbox.width = ovbw
    viewbox.height = ovbh
  }

  // for each touch start with exactly two touches, update the initial touch points and viewbox
  function handleTouchStart (e: TouchEvent) {
    // only respong when two fingers are on the screen
    if (e.touches.length !== 2) {
      return
    }

    const iTouchA = e.touches.item(0)
    const iTouchB = e.touches.item(1)
    if (!iTouchA || !iTouchB) {
      return
    }

    // update initial touch points
    iTouchAX = iTouchA.clientX
    iTouchAY = iTouchA.clientY
    iTouchBX = iTouchB.clientX
    iTouchBY = iTouchB.clientY

    updateInitialViewbox()
  }

  function handleTouchMove (e: TouchEvent) {
    // only respond when two fingers are on the screen
    if (e.touches.length !== 2) {
      return
    }

    const touchA = e.touches.item(0)
    const touchB = e.touches.item(1)
    if (!touchA || !touchB) {
      return
    }

    // current points of the touch vector
    const touchAX = touchA.clientX
    const touchAY = touchA.clientY
    const touchBX = touchB.clientX
    const touchBY = touchB.clientY

    // initial and current touch vector midpoints
    const [ touchMidX, touchMidY ] = svgPoint((touchAX + touchBX) / 2, (touchAY + touchBY) / 2)
    const [ iTouchMidX, iTouchMidY ] = svgPoint((iTouchAX + iTouchBX) / 2, (iTouchAY + iTouchBY) / 2)

    // rate of change of the touch vector
    const iTouchMag = magnitude(iTouchAX, iTouchAY, iTouchBX, iTouchBY)
    const touchMag = magnitude(touchAX, touchAY, touchBX, touchBY)
    const magRatio = iTouchMag / touchMag

    // magnitude components of the viewbox vector
    viewbox.height = ivbh * magRatio
    viewbox.width = ivbw * magRatio

    // change in the magnitude components of the viewbox vector
    const dvbh = viewbox.height - ivbh
    const dvbw = viewbox.width - ivbw

    // position components of the viewbox vector
    viewbox.x = ivbx - touchMidX + iTouchMidX - (dvbh / 2)
    viewbox.y = ivby - touchMidY + iTouchMidY - (dvbw / 2)
  }

  // initial mouse points in the client coordinate space
  let iMouseX: number
  let iMouseY: number

  let dragging = false

  function handleMouseDown (event: MouseEvent) {
    iMouseX = event.clientX
    iMouseY = event.clientY

    updateInitialViewbox()

    dragging = true
  }

  function handleMouseMove (event: MouseEvent) {
    if (!dragging) {
      return
    }

    const [ mouseSVGX, mouseSVGY ] = svgPoint(event.clientX, event.clientY)
    const [ iMouseSVGX, iMouseSVGY ] = svgPoint(iMouseX, iMouseY)

    viewbox.x = ivbx - mouseSVGX + iMouseSVGX
    viewbox.y = ivby - mouseSVGY + iMouseSVGY
  }

  function handleMouseUp () {
    dragging = false
  }

  const lineHeight = getScrollLineHeight()

  function handleWheel (event: WheelEvent) {
    let deltaX, deltaY

    if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
      deltaX = event.deltaX
      deltaY = event.deltaY
    } else if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      deltaX = event.deltaX * lineHeight
      deltaY = event.deltaY * lineHeight
    } else {
      return
    }

    updateInitialViewbox()

    if (event.ctrlKey) {
      // Handle controlled scrolls as zoom inputs.
      const delta = deltaY

      viewbox.height = viewbox.height * (1 + (delta / window.innerHeight * ZOOM_COEFFICIENT))
      viewbox.width = viewbox.width * (1 + (delta / window.innerWidth * ZOOM_COEFFICIENT))

      viewbox.x -= (viewbox.width - ivbw) / 2
      viewbox.y -= (viewbox.height - ivbh) / 2
    } else {
      // Handle non-controlled scrolls as pan inputs.
      viewbox.x += deltaX * SCROLL_PAN_COEFFICIENT
      viewbox.y += deltaY * SCROLL_PAN_COEFFICIENT
    }
  }

  function handleGestureChange (event: any) {
    updateInitialViewbox()

    viewbox.width = ovbw * 1 / event.scale
    viewbox.height = ovbh * 1 / event.scale

    viewbox.x -= (viewbox.width - ivbw) / 2
    viewbox.y -= (viewbox.height - ivbh) / 2
  }

  // disables full page zooming and panning on safari mobile
  svg.addEventListener('touchmove', preventDefault, { passive: false })
  svg.addEventListener('touchstart', handleTouchStart)
  svg.addEventListener('touchmove', handleTouchMove)
  svg.addEventListener('mousedown', handleMouseDown)
  svg.addEventListener('mousemove', handleMouseMove)
  svg.addEventListener('mouseup', handleMouseUp)
  svg.addEventListener('wheel', preventDefault, { passive: false })
  svg.addEventListener('wheel', handleWheel)
  svg.addEventListener('gesturestart', preventDefault, { passive: false })
  svg.addEventListener('gesturechange', preventDefault, { passive: false })
  svg.addEventListener('gesturechange', handleGestureChange)
  svg.addEventListener('gestureend', preventDefault, { passive: false })

  function teardown () {
    svg.removeEventListener('touchmove', preventDefault)
    svg.removeEventListener('touchstart', handleTouchStart)
    svg.removeEventListener('touchmove', handleTouchMove)
    svg.removeEventListener('mousedown', handleMouseDown)
    svg.removeEventListener('mousemove', handleMouseMove)
    svg.removeEventListener('mouseup', handleMouseUp)
    svg.removeEventListener('wheel', preventDefault)
    svg.removeEventListener('wheel', handleWheel)
    svg.removeEventListener('gesturestart', preventDefault)
    svg.removeEventListener('gesturechange', preventDefault)
    svg.removeEventListener('gesturechange', handleGestureChange)
    svg.removeEventListener('gestureend', preventDefault)
  }

  return {
    zoomIn,
    zoomOut,
    reset,
    teardown
  }
}
