
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
    const vb = svg.getAttribute('viewBox')!.split(' ').map(Number)
    ivbx = vb[0]
    ivby = vb[1]
    ivbw = vb[2]
    ivbh = vb[3]
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
    const vbh = ivbh * magRatio
    const vbw = ivbw * magRatio

    // change in the magnitude components of the viewbox vector
    const dvbh = vbh - ivbh
    const dvbw = vbw - ivbw

    // position components of the viewbox vector
    const vbx = ivbx - touchMidX + iTouchMidX - (dvbh / 2)
    const vby = ivby - touchMidY + iTouchMidY - (dvbw / 2)

    // update the viewbox
    svg.setAttribute('viewBox', `${vbx} ${vby} ${vbw} ${vbh}`)
  })
}
