export const UNAVAILABLE_COLOR = '#9E9E9E';

export const fillSection = (id, color, type = 'fill') => {
  if (!color) {
    throw Error('Color is undefined for this section.');
  }
  const elem = document.querySelector(`[data-section-id="${id}"]`);
  if (elem.nodeName === 'path') {
    elem.setAttribute(type, color);
  } else {
    elem.querySelectorAll('path').forEach(path => path.setAttribute(type, color));
  }
}