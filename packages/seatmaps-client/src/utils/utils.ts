export function getReferencePoint(svg: SVGSVGElement) {
  return svg.createSVGPoint();
}

export function getScreenCTM(svg: SVGSVGElement) {
  return svg.getScreenCTM();
}

export function getViewBox(svg: SVGSVGElement) {
  return svg.viewBox.baseVal;
}
