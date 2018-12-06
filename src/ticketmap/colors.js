export const UNAVAILABLE_COLOR = '#9E9E9E';

export const fillSection = (id, color, type = 'fill') => {
  if (!color) {
    throw Error('Color is undefined for this section.');
  }
  Array.from(document.querySelectorAll(`[data-section-id="${id}"]`))
    .reduce((memo, element) => [...memo, element, ...element.querySelectorAll('path')], [])
    .forEach(element => element.setAttribute(type, color));
}
