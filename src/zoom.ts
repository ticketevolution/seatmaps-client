const ZOOM_COEFFICIENT = 5

// determines the magnitude of a vector
function magnitude (ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}

// converts a point from the page coordinate space to a point in the svg coordinate space
function svgPointFromClientPoint (referencePoint: DOMPoint, svg: SVGSVGElement, x: number, y: number): number[] {
  referencePoint.x = x
  referencePoint.y = y

  let p = referencePoint.matrixTransform(svg.getScreenCTM()!.inverse())
  return [p.x, p.y]
}

function preventDefault (event: UIEvent) {
  event.preventDefault()
}

export interface ZoomControl {
  zoomIn: (percent: number) => void
  zoomOut: (percent: number) => void
  reset: () => void
  teardown: () => void
}

export default function (svg: SVGSVGElement) {
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

  function updateInitialViewbox () {
    ivbx = svg.viewBox.baseVal.x
    ivby = svg.viewBox.baseVal.y
    ivbw = svg.viewBox.baseVal.width
    ivbh = svg.viewBox.baseVal.height
  }

  // original viewBox of the svg element (before the first manipulation)
  const ovbx = svg.viewBox.baseVal.x
  const ovby = svg.viewBox.baseVal.y
  const ovbw = svg.viewBox.baseVal.width
  const ovbh = svg.viewBox.baseVal.height

  // used to convert screen coordinates into coordinates in the svg space
  const referencePoint = svg.createSVGPoint()

  // for each touch start with exactly two touches, update the initial touch points and viewbox
  function handleTouchStart (e: TouchEvent) {
    // only respong when two fingers are on the screen
    if (e.touches.length !== 2) {
      return
    }

    // update initial touch points
    iTouchAX = e.touches.item(0)!.clientX
    iTouchAY = e.touches.item(0)!.clientY
    iTouchBX = e.touches.item(1)!.clientX
    iTouchBY = e.touches.item(1)!.clientY

    updateInitialViewbox()
  }

  function handleTouchMove () {
    // only respond when two fingers are on the screen
    if (e.touches.length !== 2) {
      return
    }

    // current points of the touch vector
    const touchAX = e.touches.item(0)!.clientX
    const touchAY = e.touches.item(0)!.clientY
    const touchBX = e.touches.item(1)!.clientX
    const touchBY = e.touches.item(1)!.clientY

    // initial and current touch vector midpoints
    const [ touchMidX, touchMidY ] = svgPointFromClientPoint(referencePoint, svg, (touchAX + touchBX) / 2, (touchAY + touchBY) / 2)
    const [ iTouchMidX, iTouchMidY ] = svgPointFromClientPoint(referencePoint, svg, (iTouchAX + iTouchBX) / 2, (iTouchAY + iTouchBY) / 2)

    // rate of change of the touch vector
    const iTouchMag = magnitude(iTouchAX, iTouchAY, iTouchBX, iTouchBY)
    const touchMag = magnitude(touchAX, touchAY, touchBX, touchBY)
    const magRatio = iTouchMag / touchMag

    // magnitude components of the viewbox vector
    svg.viewBox.baseVal.height = ivbh * magRatio
    svg.viewBox.baseVal.width = ivbw * magRatio

    // change in the magnitude components of the viewbox vector
    const dvbh = svg.viewBox.baseVal.height - ivbh
    const dvbw = svg.viewBox.baseVal.width - ivbw

    // position components of the viewbox vector
    svg.viewBox.baseVal.x = ivbx - touchMidX + iTouchMidX - (dvbh / 2)
    svg.viewBox.baseVal.y = ivby - touchMidY + iTouchMidY - (dvbw / 2)
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

    const [ mouseSVGX, mouseSVGY ] = svgPointFromClientPoint(referencePoint, svg, event.pageX, event.pageY)
    const [ iMouseSVGX, iMouseSVGY ] = svgPointFromClientPoint(referencePoint, svg, iMouseClientX, iMouseClientY)

    svg.viewBox.baseVal.x = ivbx - mouseSVGX + iMouseSVGX
    svg.viewBox.baseVal.y = ivby - mouseSVGY + iMouseSVGY
  }

  function handleMouseUp () {
    dragging = false
  }

  function handleWheel (event: WheelEvent) {
    if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
      return
    }

    updateInitialViewbox()

    svg.viewBox.baseVal.height *= 1 + (event.deltaY / svg.clientHeight * ZOOM_COEFFICIENT)
    svg.viewBox.baseVal.width *= 1 + (event.deltaY / svg.clientWidth * ZOOM_COEFFICIENT)

    svg.viewBox.baseVal.x -= (svg.viewBox.baseVal.width - ivbw) / 2
    svg.viewBox.baseVal.y -= (svg.viewBox.baseVal.height - ivbh) / 2
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

    svg.viewBox.baseVal.height *= 1 - percent
    svg.viewBox.baseVal.width *= 1 - percent
    svg.viewBox.baseVal.x -= (svg.viewBox.baseVal.width - ivbw) / 2
    svg.viewBox.baseVal.y -= (svg.viewBox.baseVal.height - ivbh) / 2
  }

  function zoomOut (percent: number) {
    zoomIn(0 - percent)
  }

  function reset () {
    svg.viewBox.baseVal.x = ovbx
    svg.viewBox.baseVal.y = ovby
    svg.viewBox.baseVal.width = ovbw
    svg.viewBox.baseVal.height = ovbh
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
