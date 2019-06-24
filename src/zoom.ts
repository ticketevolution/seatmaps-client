const ZOOM_COEFFICIENT = 5

// determines the magnitude of a vector
function magnitude (ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}

// prevents the default reaction to an event
function preventDefault (event: UIEvent) {
  event.preventDefault()
}

export interface ZoomControl {
  zoomIn: (percent: number) => void
  zoomOut: (percent: number) => void
  reset: () => void
  teardown: () => void
}

/* enables support for touch and mouse control of an svg element's viewport
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
  let iMouseClientX: number
  let iMouseClientY: number

  let dragging = false

  function handleMouseDown (event: MouseEvent) {
    iMouseClientX = event.clientX
    iMouseClientY = event.clientY

    updateInitialViewbox()

    dragging = true
  }

  function handleMouseMove (event: MouseEvent) {
    if (!dragging) {
      return
    }

    const [ mouseSVGX, mouseSVGY ] = svgPoint(event.pageX, event.pageY)
    const [ iMouseSVGX, iMouseSVGY ] = svgPoint(iMouseClientX, iMouseClientY)

    viewbox.x = ivbx - mouseSVGX + iMouseSVGX
    viewbox.y = ivby - mouseSVGY + iMouseSVGY
  }

  function handleMouseUp () {
    dragging = false
  }

  function handleWheel (event: WheelEvent) {
    // there are many possible units, but we only support pixels
    if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
      return
    }

    updateInitialViewbox()

    // Scroll movements (track pad two finger swipe and pinch, scrollwheel movements) usually only change vertical offset.
    const delta = event.deltaY

    viewbox.height *= 1 + (delta / svg.clientHeight * ZOOM_COEFFICIENT)
    viewbox.width *= 1 + (delta / svg.clientWidth * ZOOM_COEFFICIENT)

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

  function zoomIn (percent: number) {
    updateInitialViewbox()

    viewbox.height *= 1 - percent
    viewbox.width *= 1 - percent
    viewbox.x -= (viewbox.width - ivbw) / 2
    viewbox.y -= (viewbox.height - ivbh) / 2
  }

  function zoomOut (percent: number) {
    zoomIn(0 - percent)
  }

  // returns the svg to the original zoom level and viewport location
  function reset () {
    viewbox.x = ovbx
    viewbox.y = ovby
    viewbox.width = ovbw
    viewbox.height = ovbh
  }

  function teardown () {
    svg.removeEventListener('touchmove', preventDefault)
    svg.removeEventListener('touchstart', handleTouchStart)
    svg.removeEventListener('touchmove', handleTouchMove)
    svg.removeEventListener('mousedown', handleMouseDown)
    svg.removeEventListener('mousemove', handleMouseMove)
    svg.removeEventListener('mouseup', handleMouseUp)
    svg.removeEventListener('wheel', preventDefault)
    svg.removeEventListener('wheel', handleWheel)
  }

  return {
    zoomIn,
    zoomOut,
    reset,
    teardown
  }
}
