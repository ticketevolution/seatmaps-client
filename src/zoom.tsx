
function distance (a: any, b: any) {
  return Math.sqrt(Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageX - b.pageY, 2))
}

export default function (svg: SVGSVGElement) {
  let initialTouchAX: number
  let initialTouchAY: number
  let initialTouchBX: number
  let initialTouchBY: number
  let initialTouchMidX: number
  let initialTouchMidY: number
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

    initialTouchAX = e.touches.item(0)!.clientX
    initialTouchAY = e.touches.item(0)!.clientY
    initialTouchBX = e.touches.item(1)!.clientX
    initialTouchBY = e.touches.item(1)!.clientY

    const vb = svg.getAttribute('viewBox')!.split(' ').map(Number)
    console.log(vb)
    ivbX = vb[0]
    ivbY = vb[1]
    ivbW = vb[2]
    ivbH = vb[3]
  })

  svg.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) {
      return
    }

    let touchAX = e.touches.item(0)!.clientX
    let touchAY = e.touches.item(0)!.clientY
    let touchBX = e.touches.item(1)!.clientX
    let touchBY = e.touches.item(1)!.clientY

    referencePoint.x = (touchAX + touchBX) / 2
    referencePoint.y = (touchAY + touchBY) / 2

    let p = referencePoint.matrixTransform(svg.getScreenCTM()!.inverse())

    let touchMidX = p.x
    let touchMidY = p.y

    referencePoint.x = (initialTouchAX + initialTouchBX) / 2
    referencePoint.y = (initialTouchAY + initialTouchBY) / 2

    p = referencePoint.matrixTransform(svg.getScreenCTM()!.inverse())

    initialTouchMidX = p.x
    initialTouchMidY = p.y

    console.log('i', initialTouchMidX, initialTouchMidY)
    console.log(touchMidX, touchMidY)

    const vbx = ivbX - touchMidX + initialTouchMidX
    const vby = ivbY - touchMidY + initialTouchMidY
    svg.setAttribute('viewBox', `${vbx} ${vby} ${ivbW} ${ivbH}`)
  })
}
