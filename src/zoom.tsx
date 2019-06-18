
function magnitude (ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}

function svgPointFromClientPoint (referencePoint: DOMPoint, svg: SVGSVGElement, x: number, y: number): number[] {
  referencePoint.x = x
  referencePoint.y = y

  let p = referencePoint.matrixTransform(svg.getScreenCTM()!.inverse())
  return [p.x, p.y]
}

export default function (svg: SVGSVGElement) {
  let iTouchAX: number
  let iTouchAY: number
  let iTouchBX: number
  let iTouchBY: number
  let ivbX: number
  let ivbY: number
  let ivbH: number
  let ivbW: number

  const referencePoint = svg.createSVGPoint()

  svg.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

  svg.addEventListener('touchstart', e => {
    if (e.touches.length !== 2) {
      return
    }

    iTouchAX = e.touches.item(0)!.clientX
    iTouchAY = e.touches.item(0)!.clientY
    iTouchBX = e.touches.item(1)!.clientX
    iTouchBY = e.touches.item(1)!.clientY

    const vb = svg.getAttribute('viewBox')!.split(' ').map(Number)
    ivbX = vb[0]
    ivbY = vb[1]
    ivbW = vb[2]
    ivbH = vb[3]
  })

  svg.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) {
      return
    }

    const touchAX = e.touches.item(0)!.clientX
    const touchAY = e.touches.item(0)!.clientY
    const touchBX = e.touches.item(1)!.clientX
    const touchBY = e.touches.item(1)!.clientY

    const [ touchMidX, touchMidY ] = svgPointFromClientPoint(referencePoint, svg, (touchAX + touchBX) / 2, (touchAY + touchBY) / 2)
    const [ iTouchMidX, iTouchMidY ] = svgPointFromClientPoint(referencePoint, svg, (iTouchAX + iTouchBX) / 2, (iTouchAY + iTouchBY) / 2)

    const iTouchMag = magnitude(iTouchAX, iTouchAY, iTouchBX, iTouchBY)
    const touchMag = magnitude(touchAX, touchAY, touchBX, touchBY)
    const magRatio = iTouchMag / touchMag

    const vbh = ivbH * magRatio
    const vbw = ivbW * magRatio

    const dvbh = vbh - ivbH
    const dvbw = vbw - ivbW

    const vbx = ivbX - touchMidX + iTouchMidX - (dvbh / 2)
    const vby = ivbY - touchMidY + iTouchMidY - (dvbw / 2)

    svg.setAttribute('viewBox', `${vbx} ${vby} ${vbw} ${vbh}`)
  })
}
