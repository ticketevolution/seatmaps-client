export const fillSection = (id: string, color: string, type = 'fill') => {
  if (!color) {
    throw Error('Color is undefined for this section.')
  }
  getAllPaths(id).forEach(element => element.setAttribute(type, color))
}

export const setUnavailableColors = () => {
  getAllPaths().forEach(element => element.setAttribute('data-unavailable-color', element.getAttribute('fill')))
}

export const fillUnavailableColors = () => {
  getAllPaths().forEach(element => element.setAttribute('fill', element.getAttribute('data-unavailable-color')))
}

export const getAllPaths = (id?: string) =>
  Array.from(document.querySelectorAll(`[data-section-id${id ? `="${id}"` : ''}]`))
    .reduce((memo, element) => [...memo, element, ...Array.from(element.querySelectorAll('path'))], [])
