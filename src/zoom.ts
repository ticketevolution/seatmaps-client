
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

export default function (svg: SVGSVGElement) {
  // initial touch points (x and y components of points a and b)
  let iTouchAX: number
  let iTouchAY: number
  let iTouchBX: number
  let iTouchBY: number

  // initial viewbox of the svg element
  let ivbx: number
  let ivby: number
  let ivbh: number
  let ivbw: number

  // used to convert screen coordinates into coordinates in the svg space
  const referencePoint = svg.createSVGPoint()

  // disables full page zooming and panning on safari mobile
  svg.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

  // for each touch start with exactly two touches, update the initial touch points and viewbox
  svg.addEventListener('touchstart', e => {
    // only respong when two fingers are on the screen
    if (e.touches.length !== 2) {
      return
    }

    // update initial touch points
    iTouchAX = e.touches.item(0)!.clientX
    iTouchAY = e.touches.item(0)!.clientY
    iTouchBX = e.touches.item(1)!.clientX
    iTouchBY = e.touches.item(1)!.clientY

    // update the initial viewbox
    ivbx = svg.viewBox.baseVal.x
    ivby = svg.viewBox.baseVal.y
    ivbw = svg.viewBox.baseVal.width
    ivbh = svg.viewBox.baseVal.height
  })

  svg.addEventListener('touchmove', e => {
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
  })

  // initial mouse points in the client coordinate space
  let iMouseClientX: number
  let iMouseClientY: number

  let dragging = false

  svg.addEventListener('mousedown', event => {
    iMouseClientX = event.clientX
    iMouseClientY = event.clientY

    // update the initial viewbox
    ivbx = svg.viewBox.baseVal.x
    ivby = svg.viewBox.baseVal.y

    dragging = true
  })

  svg.addEventListener('mousemove', event => {
    if (!dragging) {
      return
    }

    const mouseClientX = event.pageX
    const mouseClientY = event.pageY

    const [ mouseSVGX, mouseSVGY ] = svgPointFromClientPoint(referencePoint, svg, mouseClientX, mouseClientY)
    const [ iMouseSVGX, iMouseSVGY ] = svgPointFromClientPoint(referencePoint, svg, iMouseClientX, iMouseClientY)

    svg.viewBox.baseVal.x = ivbx - mouseSVGX + iMouseSVGX
    svg.viewBox.baseVal.y = ivby - mouseSVGY + iMouseSVGY
  })

  svg.addEventListener('mouseup', () => {
    dragging = false
  })
}
