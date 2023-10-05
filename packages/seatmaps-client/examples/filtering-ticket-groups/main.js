/* global Tevomaps */

const VENUE_ID = '896'
const CONFIGURATION_ID = '14341'

let map
let allTicketGroups
let availableTicketGroups

let quantityFilter = 1
let minPriceFilter = 0
let maxPriceFilter = 0
let typeFilter = new Set()

/**
 * Rendering
 */

const createHeading = (section, row) => {
  const element = document.createElement('h1')
  element.append(document.createTextNode(`${section}, Row ${row}`))
  return element
}

const createType = (format) => {
  const element = document.createElement('h2')
  element.appendChild(document.createTextNode(format))
  return element
}

const createQuantity = (quantity) => {
  const element = document.createElement('h3')
  element.append(document.createTextNode(`${quantity} ticket${quantity > 1 ? 's' : ''}`))
  return element
}

const createTicketGroupListItem = (ticketGroup) => {
  const ticketGroupListItem = document.createElement('div')
  ticketGroupListItem.classList.add('ticket-groups-list-item')
  ticketGroupListItem.dataset.section = ticketGroup.tevo_section_name
  ticketGroupListItem.appendChild(createHeading(ticketGroup.section, ticketGroup.row))
  ticketGroupListItem.appendChild(createType(ticketGroup.format))
  ticketGroupListItem.appendChild(createQuantity(ticketGroup.quantity))
  return ticketGroupListItem
}

const renderTicketGroupList = (ticketGroups = []) => {
  const ticketGroupsList = document.createElement('div')
  for (const ticketGroup of ticketGroups) {
    ticketGroupsList.appendChild(createTicketGroupListItem(ticketGroup))
  }
  const ticketGroupsContainer = document.getElementById('ticketGroups')
  ticketGroupsContainer.innerHTML = ''
  ticketGroupsContainer.appendChild(ticketGroupsList)
}

const setPriceRange = () => {
  minPriceFilter = allTicketGroups[0].retail_price
  maxPriceFilter = allTicketGroups[allTicketGroups.length - 1].retail_price

  const minPrice = document.querySelector('[name="min-price"]')
  minPrice.setAttribute('min', minPriceFilter)
  minPrice.setAttribute('max', maxPriceFilter)
  minPrice.setAttribute('value', minPriceFilter)

  const maxPrice = document.querySelector('[name="max-price"]')
  maxPrice.setAttribute('min', minPriceFilter)
  maxPrice.setAttribute('max', maxPriceFilter)
  maxPrice.setAttribute('value', maxPriceFilter)
}

const updatePriceDisplays = () => {
  const minPrice = document.getElementById('min-price')
  minPrice.innerHTML = ''
  minPrice.appendChild(document.createTextNode(`$${minPriceFilter}`))

  const maxPrice = document.getElementById('max-price')
  maxPrice.innerHTML = ''
  maxPrice.appendChild(document.createTextNode(`$${maxPriceFilter}`))
}

/**
 * Filtering
 */

const filterBySection = (selectedSections) =>
  availableTicketGroups.filter(ticketGroup =>
    selectedSections.length === 0 || selectedSections.includes(ticketGroup.tevo_section_name))

const filter = () =>
  allTicketGroups
    .filter(ticketGroup => ticketGroup.quantity >= quantityFilter)
    .filter(ticketGroup => ticketGroup.retail_price <= maxPriceFilter)
    .filter(ticketGroup => ticketGroup.retail_price >= minPriceFilter)
    .filter(ticketGroup => typeFilter.size === 0 || typeFilter.has(ticketGroup.format))

/**
 * Filter Listeners
 */

const update = () => {
  availableTicketGroups = filter()
  updatePriceDisplays()
  map.updateTicketGroups(availableTicketGroups)
  renderTicketGroupList(availableTicketGroups)
}

const updateFilters = (name, value) => {
  switch (name) {
    case 'quantity':
      quantityFilter = value
      break
    case 'min-price':
      minPriceFilter = value
      break
    case 'max-price':
      maxPriceFilter = value
      break
    case 'type':
      if (typeFilter.has(value)) {
        typeFilter.delete(value)
      } else {
        typeFilter.add(value)
      }
      break
    default:
  }
}

document.getElementById('filters')
  .addEventListener('change', ({ target: { name, value } }) => {
    updateFilters(name, value)
    update()
  })

const ticketGroupsElement = document.getElementById('ticketGroups')
ticketGroupsElement.addEventListener('mouseover', (event) => {
  const element = event.path.find((path) => path.classList && path.classList.contains('ticket-groups-list-item'))
  if (element) {
    map.highlightSection(element.dataset.section)
  }
})
ticketGroupsElement.addEventListener('mouseout', (event) => {
  const element = event.path.find((path) => path.classList && path.classList.contains('ticket-groups-list-item'))
  if (element) {
    map.unhighlightSection(element.dataset.section)
  }
})

/**
 * Initializing
 */

const fetchTicketGroups = () =>
  fetch('/examples/data/ticket-groups-1591449.json')
    .then(response => response.json())

const buildMap = () => {
  map = new Tevomaps({
    venueId: VENUE_ID,
    configurationId: CONFIGURATION_ID,
    onSelection: (selectedSections) =>
      renderTicketGroupList(filterBySection(selectedSections))
  }).build('map')
}

window.onload = () => {
  buildMap()
  fetchTicketGroups()
    .then((ticketGroups) => {
      allTicketGroups = ticketGroups.sort((a, b) => a.retail_price - b.retail_price)
      setPriceRange()
      update()
    })
}
