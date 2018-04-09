/* eslint-disable */

var d3 = require('d3')

// TODO
// TG's in pourover collection need sectionId
// Maybe put id's back into
// filterOptions.push({
//  id: sectionId
//  text: sectionId
// })
//

// 1. Make zoom not animate dumb.
// 2. Build a pourover filter for sectionId.
var InteractiveSeating = (function(window) {
  // REFERENCE /////////////////////////////////////////////////////////////////
  // https://www.dashingd3js.com/svg-paths-and-d3js
  // http://www.smashingmagazine.com/2012/10/04/the-code-side-of-color/
  // http://youmightnotneedjquery.com/
  // http://tutorials.jenkov.com/svg/svg-transformation.html#scale
  // http://truongtx.me/2014/03/13/working-with-zoom-behavior-in-d3js-and-some-notes/
  // http://stackoverflow.com/questions/25333309/d3-js-how-to-add-zoom-button-with-the-default-wheelmouse-zoom-behavior

  // TERMS /////////////////////////////////////////////////////////////////////
  // active   = a section that was clicked / used as a filter.
  // hovered  = a section that is being highlighted and showing its tooltip.
  // enabled  = a section that contains tickets, it is able to be clicked (activated).
  // disabled = a section with no tickets, it's grayed out.
  //
  // sectionId = a unique section identifier (usually contains zone and section number) e.g. 'terrace-sideline-614'.
  // sectionNumber = a section number like 220, multiple sections can correspond to that number,
  //   but often brokers just provide the number when entering section.  Using that sectionNumber + row, one
  //   can determine the corresponding sectionId using the section_matching.js function.

  /// ///////////////////////////////////////////////////////////////////////////
  // CONSTANTS /////////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////////
  var SVG_PATH_COMPONENTS_REGEX = /(m|l|h|v|c|s|q|t|a|z)(\-?\d+\.?\d+)(,\-?\d+\.?\d+)*/gi
  var SEATVIEW_EXTRACT_SECTION_ID_REGEX = /(seatviews\/big\/)(.+)(.jpg)$/
  var URLS = {
    DOES_INTERACTIVE_EXIST: 'https://dynamicvenuemaps.com/maps/check-dynamic/check_dynamic_maps.js?', // VID=414&CID=3094
    STATIC: 'https://dynamicvenuemaps.com/maps/Static_maps/big/',
    IMAGE_PREFIX: 'https://dynamicvenuemaps.com/maps/maps_setting/',
    INTERACTIVE_GEOMETRY: ['https://dynamicvenuemaps.com/maps/maps_setting/', '/map_shapes.js'],
    MISSING_SEAT_PREVIEW: 'https://www.dynamicvenuemaps.com/maps/seatviews/noimg_b.jpg',
    SEAT_PREVIEW:
      'https://dynamicvenuemaps.com/maps/svg_ajax/tooltip_infos.php?callback=thisIsIgnoredByDynamicVenueMaps&type=section',
    SECTION_MATCHER: ['https://dynamicvenuemaps.com/maps/maps_setting/', '/section_matching.js']
  }
  var SVG_TAGS = {
    IMAGE: 'image',
    PATH: 'path',
    TEXT: 'text'
  }
  var CONFIG = {
    ACTIVE_SECTION_FILL_COLOR: '#0099ff', // '#ff7900',
    ACTIVE_SECTION_STROKE_WIDTH: 3.0,
    ACTIVE_SECTION_STROKE_COLOR: '#0125AC', // '#d95905',
    ACTIVE_SECTION_TEXT_FONT_WEIGHT: 700,

    HOVERED_SECTION_FILL_COLOR: '#7ddaff',
    HOVERED_SECTION_STROKE_WIDTH: 2.0,
    HOVERED_SECTION_STROKE_COLOR: '#0099ff',
    HOVERED_SECTION_TEXT_FONT_WEIGHT: 700,

    INITIAL_SCALE: 0.98,

    LOG_SECTION_MATCHING: false,

    SECTION_FILL_EMPTY: '#999',
    SECTION_FILL_FIELD: '#7bab5b',
    SECTION_FILL_LIGHTEST: {
      r: 160, // a0
      g: 208, // d0
      b: 128 // 80
    },
    SECTION_FILL_DARKEST: {
      r: 48, // 30
      g: 96, // 60
      b: 16 // 10
    },
    SECTION_STROKE_COLOR: '#555',
    SECTION_STROKE_WIDTH: 0.4,

    TEXT_FONT_WEIGHT: 500,
    TEXT_FILL_COLOR: '#fff',
    TEXT_STROKE_COLOR: '#555',
    TEXT_FONT: 'MyriadPro-Regular, Helvetica, Arial, Verdana, Myriad Pro, sans-serif',

    TOOLTIP_WIDTH: 200,
    TOOLTIP_HEIGHT: 50,
    TOOLTIP_FILL_COLOR: '#f5f5f5',
    TOOLTIP_TIMEOUT: 5000,

    ZOOM_ANIMATION_DURATION: 200,
    ZOOM_BUTTON_SIZE: 24,
    RSET_BUTTON_SIZE: 60,
    ZOOM_CONSTRAIN_MIN_VISIBLE_PX: 100,
    ZOOM_IN_FACTOR: 1.8,

    RESIZE_DELAY: 100 // Wait until window resizing stops for RESIZE_DELAY ms before zoomToFit().
  }
  var QUADRANTS = {
    TOP: {},
    BOTTOM: {},
    LEFT: {},
    RIGHT: {}
  }
  var EVENTS = {
    ON_SELECTED_SECTIONS_CHANGE: 'onSelectedSectionsChange',
    SEAT_PREVIEW_IMAGE_AVAILABLE: 'onSeatPreviewChange',
    ON_HOVERED_SECTION_CHANGE: 'onHoveredSectionChange',
    INTERACTIVE_READY: 'onInteractiveReady',
    ON_CLEAR_BUTTON_CLICK: 'onClearButtonClick'
  }

  /// ///////////////////////////////////////////////////////////////////////////
  // PRIVATE METHODS ///////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////////
  var loadScript = function(src, callback) {
    var s, r, t
    r = false
    s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = src
    s.onload = s.onreadystatechange = function() {
      if (!r && (!this.readyState || this.readyState == 'complete')) {
        r = true
        if (callback) {
          callback()
        }
      }
    }
    t = document.getElementsByTagName('script')[0]
    t.parentNode.insertBefore(s, t)
  }

  var getMapGeometry = function(venueId, configurationId, callback) {
    var folderUrl = encodeURIComponent(venueId + '_' + configurationId)
    var successfulDownloads = 0

    var seeIfBothDownloadedCallback = function() {
      successfulDownloads++
      if (successfulDownloads == 2) {
        callback()
      }
    }

    var url = URLS.INTERACTIVE_GEOMETRY[0] + folderUrl + URLS.INTERACTIVE_GEOMETRY[1]
    loadScript(url, seeIfBothDownloadedCallback)

    var url = URLS.SECTION_MATCHER[0] + folderUrl + URLS.SECTION_MATCHER[1]
    loadScript(url, seeIfBothDownloadedCallback)
  }

  var getSectionMatching = function(venueId, configurationId, tickets, getSectionsByZone, callback) {
    var folderUrl = encodeURIComponent(venueId + '_' + configurationId)
    var url = URLS.SECTION_MATCHER[0] + folderUrl + URLS.SECTION_MATCHER[1]

    var sectionsLoadedCallback = function() {
      callback(getSectionsByZone(tickets))
    }

    loadScript(url, sectionsLoadedCallback)
  }

  var checkIfInteractiveExists = function(venueId, configurationId, callback) {
    var url =
      URLS.DOES_INTERACTIVE_EXIST + 'VID=' + encodeURIComponent(venueId) + '&CID=' + encodeURIComponent(configurationId)
    window.maps_dynamic_exist = false
    loadScript(url, function() {
      callback(!!window.maps_dynamic_exist)
    })
  }

  var getSectionNumberFromSectionId = function(sectionId) {
    return parseInt(sectionId.match(/\d+/))
  }

  var getSectionIdFromMapShapeId = function(mapShapeId) {
    return mapShapeId.replace(/^s\-/, '')
  }

  var humanizeSectionId = function(sectionId) {
    var parts = sectionId.split('-')
    // parts.splice(0, 1);
    parts.forEach(function(part, index) {
      parts[index] = part.charAt(0).toUpperCase() + part.slice(1)
    })
    return parts.join(' ')
  }

  var getTicketsBySectionId = function(tickets) {
    var ticketsBySectionId = {}
    if (typeof section_matching === 'undefined') {
      return ticketsBySectionId
    }
    tickets.forEach(function(ticket, index) {
      var sectionId = section_matching(ticket.section.toString(), ticket.row.toString())
      if (CONFIG.LOG_SECTION_MATCHING) {
        console.log('matched', ticket.section, ticket.row, 'to', sectionId)
      }
      if (sectionId == ticket.section) {
        console.warn('InteractiveSeating Warning: possible unmatched ticket.', ticket)
      }
      ticketsBySectionId[sectionId] = ticketsBySectionId[sectionId] || []
      ticketsBySectionId[sectionId].push(ticket)
    })
    return ticketsBySectionId
  }

  var getLowestPriceBySectionId = function(ticketsBySectionId) {
    var lowestPriceBySectionId = {}
    var minPrice = 0
    var maxPrice = 0
    if (Object.keys(ticketsBySectionId).length) {
      var firstTicket = ticketsBySectionId[Object.keys(ticketsBySectionId)[0]][0]
      minPrice = firstTicket.price
      maxPrice = firstTicket.price
    }
    for (var sectionId in ticketsBySectionId) {
      var tickets = ticketsBySectionId[sectionId]
      var lowestPriceInSection = tickets[0].price
      tickets.forEach(function(ticket, index) {
        if (ticket.price < lowestPriceInSection) {
          lowestPriceInSection = ticket.price
        }
        if (ticket.price > maxPrice) {
          maxPrice = ticket.price
        }
      })
      if (lowestPriceInSection < minPrice) {
        minPrice = lowestPriceInSection
      }
      lowestPriceBySectionId[sectionId] = lowestPriceInSection
    }
    var pricingData = {
      lowestPriceBySectionId: lowestPriceBySectionId,
      minPrice: minPrice,
      maxPrice: maxPrice
    }
    return pricingData
  }

  var getCentroid = function(element) {
    var boundingBox = element.getBBox()
    return [boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2]
  }

  var getMaxRoomToDarken = function() {
    return {
      r: CONFIG.SECTION_FILL_LIGHTEST.r - CONFIG.SECTION_FILL_DARKEST.r,
      g: CONFIG.SECTION_FILL_LIGHTEST.g - CONFIG.SECTION_FILL_DARKEST.g,
      b: CONFIG.SECTION_FILL_LIGHTEST.b - CONFIG.SECTION_FILL_DARKEST.b
    }
  }

  var getDarkenPerDollar = function(maxRoomToDarken, sqrtSpread) {
    return {
      r: maxRoomToDarken.r / sqrtSpread,
      g: maxRoomToDarken.g / sqrtSpread,
      b: maxRoomToDarken.b / sqrtSpread
    }
  }

  var hexToRgb = function(hex) {
    // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b
    })
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  var commaSeparateNumber = function(val) {
    // http://stackoverflow.com/questions/3883342/add-commas-to-a-number-in-jquery
    while (/(\d+)(\d{3})/.test(val.toString())) {
      val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2')
    }
    return val
  }

  var hideLoading = function() {
    var loading = document.getElementById('loading')
    if (loading) {
      loading.remove()
    }
  }

  /// ///////////////////////////////////////////////////////////////////////////
  // PUBLIC METHODS ////////////////////////////////////////////////////////////
  /// ///////////////////////////////////////////////////////////////////////////

  // Constructor.
  var InteractiveSeating = function(options) {
    var that = this

    /// /////////////////////////////////////////////////////////////////////////
    // PUBLIC VARS /////////////////////////////////////////////////////////////
    /// /////////////////////////////////////////////////////////////////////////
    this.activeSections = {}
    this.autoClearTooltipTimeout = null
    this.configurationId = null
    this.container = null
    this.containerId = null
    this.height = null
    this.hoveredSection = null
    this.lastHoveredTicketPath = null
    this.originalFillColors = {}
    this.pathElementsBySectionId = {}
    this.pricingData = {}
    this.rootElement = null
    this.seatPreviewCache = {}
    this.sectionIdsBySectionNumber = {}
    this.showPriceLegend = true
    this.showTooltip = true
    this.svgContainer = null
    this.tickets = []
    this.ticketsBySectionId = {}
    this.venueId = null
    this.width = null
    this.zoom = null
    /// /////////////////////////////////////////////////////////////////////////

    // Handle required params.
    this.containerId = options.containerId
    this.container = document.getElementById(this.containerId)
    this.venueId = options.venueId
    this.configurationId = options.configurationId
    this.tickets = options.tickets

    // Handle optional params.
    if (options.initialScale) {
      CONFIG.INITIAL_SCALE = parseFloat(options.initialScale)
    }

    if (options.emptySectionFill) {
      CONFIG.SECTION_FILL_EMPTY = options.emptySectionFill
    }

    if (options.cheapSectionFill) {
      var fill = hexToRgb(options.cheapSectionFill)
      CONFIG.SECTION_FILL_LIGHTEST = {
        r: fill.r,
        g: fill.g,
        b: fill.b
      }
    }

    if (options.expensiveSectionFill) {
      var fill = hexToRgb(options.expensiveSectionFill)
      CONFIG.SECTION_FILL_DARKEST = {
        r: fill.r,
        g: fill.g,
        b: fill.b
      }
    }

    if (options.textStrokeColor) {
      CONFIG.TEXT_STROKE_COLOR = options.textStrokeColor
    }

    if (options.textFillColor) {
      CONFIG.TEXT_FILL_COLOR = options.textFillColor
    }

    if (options.showPriceLegend === false) {
      this.showPriceLegend = false
    }

    if (options.showTooltip === false) {
      this.showTooltip = false
    }

    if (options.logSectionMatching === true) {
      CONFIG.LOG_SECTION_MATCHING = true
    }

    if (!this.container) {
      // options.containerId didn't point to an element.
      return this
    }

    this.container.innerHTML = ''

    // This is the JSONP callback DynamicVenueMaps wraps all seat image previews in.
    // Let's make it an alias for fetchSeatImage called from the context of the chart instance.
    window.jsonp_display_tooltip_section = this.onSeatImageLocationFound.bind(this)

    this.renderContainer()
    this.renderLoading()

    checkIfInteractiveExists(this.venueId, this.configurationId, function(doesExist) {
      if (doesExist) {
        that.renderInteractive()
      } else {
        that.renderStatic()
      }
    })

    return this
  }

  // API METHODS ///////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.matchSection = function(section, row) {
    if (typeof section_matching === 'undefined') {
      return null
    }
    var sectionId = section_matching(section.toString(), row.toString())
    return sectionId
  }

  InteractiveSeating.prototype.ticketHoverOn = function(ticket) {
    if (typeof section_matching !== 'undefined') {
      var sectionId = section_matching(ticket.section.toString(), ticket.row.toString())
      var pathElement = this.pathElementsBySectionId[sectionId]
      if (pathElement) {
        this.lastHoveredTicketPath = pathElement
        var suppressEvents = true
        this.onSectionMouseover(this.lastHoveredTicketPath.node(), suppressEvents)
      } else {
        if (this.currentTooltip) {
          this.currentTooltip.remove()
        }
      }
    }
  }

  InteractiveSeating.prototype.ticketHoverOff = function() {
    if (this.lastHoveredTicketPath) {
      this.onSectionMouseout(this.lastHoveredTicketPath.node())
    }
  }

  InteractiveSeating.prototype.getSectionsByZone = function(tickets) {
    var ticketsBySectionID = getTicketsBySectionId(tickets)

    var sectionsByZone = {}
    Object.keys(ticketsBySectionID).forEach(function(sectionString) {
      var sectionParts = sectionString.split('-')
      var zone = sectionParts.slice(0, -1).join('-')
      var section = sectionParts[sectionParts.length - 1]
      if (zone) {
        if (sectionsByZone[zone]) {
          sectionsByZone[zone].push(section)
        } else {
          sectionsByZone[zone] = [section]
        }
      }
    })
    return sectionsByZone
  }

  InteractiveSeating.prototype.updateTickets = function(tickets) {
    this.tickets = tickets

    var previouslyEnabledSections = _.clone(this.ticketsBySectionId)
    var previouslyActiveSections = _.clone(this.activeSections)
    this.activeSections = {}

    this.ticketsBySectionId = getTicketsBySectionId(tickets)
    this.pricingData = getLowestPriceBySectionId(this.ticketsBySectionId)
    this.hoveredSection = null
    var maxRoomToDarken = getMaxRoomToDarken()

    var sqrtMaxPrice = Math.sqrt(this.pricingData.maxPrice)
    var sqrtMinPrice = Math.sqrt(this.pricingData.minPrice)
    var sqrtSpread = Math.max(sqrtMaxPrice - sqrtMinPrice, 1)

    var darkenPerDollar = getDarkenPerDollar(maxRoomToDarken, sqrtSpread)

    for (var sectionId in previouslyEnabledSections) {
      if (previouslyEnabledSections.hasOwnProperty(sectionId)) {
        if (!this.ticketsBySectionId[sectionId]) {
          // If a previously enabled section is now disabled (empty), reset it.
          var pathElement = this.pathElementsBySectionId[sectionId]
          if (typeof pathElement !== 'undefined') {
            pathElement.attr({
              fill: CONFIG.SECTION_FILL_EMPTY,
              stroke: CONFIG.SECTION_STROKE_COLOR,
              'stroke-width': CONFIG.SECTION_STROKE_WIDTH
            })
          }
          this.originalFillColors[sectionId] = CONFIG.SECTION_FILL_EMPTY
        }
      }
    }

    for (var sectionId in this.ticketsBySectionId) {
      if (this.ticketsBySectionId.hasOwnProperty(sectionId)) {
        // Recolor the sections that contain tickets.
        var pathElement = this.pathElementsBySectionId[sectionId]
        if (typeof pathElement !== 'undefined') {
          this.stylePathElement(pathElement, sectionId, maxRoomToDarken, darkenPerDollar, sqrtSpread)
        }

        // Reactivate sections that were active and still contain tickets.
        if (previouslyActiveSections[sectionId]) {
          this.activateSection(sectionId)
        }
      }
    }
  }

  // EVENTS ////////////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.addEventListener = function(eventName, callback) {
    // We just need to drive all events through a DOM element since only they have the API for it.
    return this.container.addEventListener(eventName, callback)
  }

  InteractiveSeating.prototype.triggerEvent = function(eventName, eventData) {
    if (window.CustomEvent) {
      var event = new CustomEvent(eventName, eventData)
    } else {
      var event = document.createEvent('CustomEvent')
      event.initCustomEvent(eventName, true, true, eventData)
    }
    // TODO:
    // You must trigger the event from the context of the including page for it to be heard.
    this.container.dispatchEvent(event)
  }

  // MOUSE EVENTS //////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.onSectionMouseover = function(path, suppressEvents) {
    var element = d3.select(path)
    var datum = element.datum()
    var sectionId = datum.sectionId
    this.hoveredSection = sectionId
    var hasTickets = this.ticketsBySectionId[sectionId]
    if (hasTickets) {
      var isActive = this.activeSections[sectionId]
      if (!isActive) {
        element.attr({
          fill: CONFIG.HOVERED_SECTION_FILL_COLOR,
          stroke: CONFIG.HOVERED_SECTION_STROKE_COLOR,
          'stroke-width': CONFIG.HOVERED_SECTION_STROKE_WIDTH
        })
      }
      this.displayTooltip(path, sectionId, suppressEvents)
    } else {
      if (this.currentTooltip) {
        this.currentTooltip.remove()
      }
    }
  }

  InteractiveSeating.prototype.onSectionMouseout = function(path) {
    var element = d3.select(path)
    var datum = element.datum()
    var sectionId = datum.sectionId
    this.hoveredSection = null
    var isActive = this.activeSections[sectionId]
    if (!isActive) {
      element.attr({
        fill: this.originalFillColors[sectionId],
        stroke: CONFIG.SECTION_STROKE_COLOR,
        'stroke-width': CONFIG.SECTION_STROKE_WIDTH
      })
    }
  }

  InteractiveSeating.prototype.onSectionClick = function(path) {
    var element = d3.select(path)
    var datum = element.datum()
    var sectionId = datum.sectionId
    this.toggleSection(sectionId)
  }

  // FILTERING //////////////////////////////////////////////////////////////////

  // Note, this will NOT trigger EVENTS.ON_SELECTED_SECTIONS_CHANGE
  //  InteractiveSeating.prototype.setActiveSectionNumbers = function(sectionNumbers) {
  //    var that = this;
  //    this.deactivateAllSections();
  //    sectionNumbers.forEach(function(sectionNumber) {
  //      that.activateSectionNumber(sectionNumber);
  //    });
  //  };

  InteractiveSeating.prototype.deactivateAllSections = function() {
    var that = this
    for (var sectionId in this.activeSections) {
      if (this.activeSections.hasOwnProperty(sectionId)) {
        that.deactivateSection(sectionId)
      }
    }
  }

  // Note, this will NOT trigger EVENTS.ON_SELECTED_SECTIONS_CHANGE
  InteractiveSeating.prototype.activateSectionNumber = function(sectionNumber) {
    var that = this
    var suppressEvents = true
    var sectionsContainingThisNumber = this.sectionIdsBySectionNumber[sectionNumber]
    sectionsContainingThisNumber.forEach(function(sectionId, index) {
      that.activateSection(sectionId, suppressEvents)
    })
  }

  InteractiveSeating.prototype.activateSection = function(sectionId) {
    var pathElement = this.pathElementsBySectionId[sectionId]
    var hasTickets = this.ticketsBySectionId[sectionId]
    if (hasTickets) {
      this.activeSections[sectionId] = pathElement
      pathElement.attr({
        fill: CONFIG.ACTIVE_SECTION_FILL_COLOR,
        stroke: CONFIG.ACTIVE_SECTION_STROKE_COLOR,
        'stroke-width': CONFIG.ACTIVE_SECTION_STROKE_WIDTH
      })
    }
  }

  InteractiveSeating.prototype.deactivateSection = function(sectionId) {
    var pathElement = this.pathElementsBySectionId[sectionId]
    var hasTickets = this.ticketsBySectionId[sectionId]
    if (hasTickets) {
      delete this.activeSections[sectionId]
      if (sectionId == this.hoveredSection) {
        pathElement.attr({
          fill: CONFIG.HOVERED_SECTION_FILL_COLOR,
          stroke: CONFIG.HOVERED_SECTION_STROKE_COLOR,
          'stroke-width': CONFIG.HOVERED_SECTION_STROKE_WIDTH
        })
      } else {
        pathElement.attr({
          fill: this.originalFillColors[sectionId],
          stroke: CONFIG.SECTION_STROKE_COLOR,
          'stroke-width': CONFIG.SECTION_STROKE_WIDTH
        })
      }
    }
    this.triggerEvent(EVENTS.ON_SELECTED_SECTIONS_CHANGE, { detail: [] })
  }

  InteractiveSeating.prototype.toggleSection = function(sectionId) {
    var hasTickets = this.ticketsBySectionId[sectionId]
    if (hasTickets) {
      var isActive = this.activeSections[sectionId]
      if (isActive) {
        this.deactivateSection(sectionId)
      } else {
        this.activateSection(sectionId)
      }
      var activeArray = []
      for (var sectionId in this.activeSections) {
        if (this.activeSections.hasOwnProperty(sectionId)) {
          activeArray.push(sectionId)
        }
      }
      this.triggerEvent(EVENTS.ON_SELECTED_SECTIONS_CHANGE, {
        detail: activeArray
      })
    }
  }

  InteractiveSeating.prototype.indexSectionId = function(sectionId) {
    var sectionNumber = getSectionNumberFromSectionId(sectionId)
    var arrayOfSectionIds = this.sectionIdsBySectionNumber[sectionNumber]
    arrayOfSectionIds = arrayOfSectionIds || []
    arrayOfSectionIds.push(sectionId)
    this.sectionIdsBySectionNumber[sectionNumber] = arrayOfSectionIds
  }

  // SCALING & TRANSLATING /////////////////////////////////////////////////////
  InteractiveSeating.prototype.attachZoomAndPan = function() {
    var that = this
    var stadiumBoundingBox = that.rootElement.node().getBBox()

    var zoomHandler = function() {
      var translate = d3.event.translate // Already scaled.
      var scale = d3.event.scale

      if (isNaN(translate[0]) || isNaN(translate[1]) || isNaN(scale)) {
        return
      }

      var stadiumLeft = translate[0] + scale * stadiumBoundingBox.x
      var stadiumRight = stadiumLeft + scale * stadiumBoundingBox.width
      var stadiumTop = translate[1] + scale * stadiumBoundingBox.y
      var stadiumBottom = stadiumTop + scale * stadiumBoundingBox.height

      // Left constraint.
      if (stadiumRight < CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX) {
        translate[0] += CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX - stadiumRight
      }
      // Right constraint.
      if (stadiumLeft > that.width - CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX) {
        translate[0] += that.width - CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX - stadiumLeft
      }

      // Top constraint.
      if (stadiumBottom < CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX) {
        translate[1] += CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX - stadiumBottom
      }
      // Bottom constraint
      if (stadiumTop > that.height - CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX) {
        translate[1] += that.height - CONFIG.ZOOM_CONSTRAIN_MIN_VISIBLE_PX - stadiumTop
      }

      that.zoom.translate([translate[0], translate[1]])
      that.rootElement.attr('transform', 'translate(' + translate[0] + ',' + translate[1] + ') scale(' + scale + ')')
    }
    this.zoom = d3.behavior
      .zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', zoomHandler)
    this.svgContainer.call(this.zoom)
  }

  InteractiveSeating.prototype.translateAndScale = function(x, y, scale) {
    if (isNaN(x) || isNaN(y) || isNaN(scale)) {
      return
    }

    if (this.zoom) {
      this.zoom.translate([x, y])
      this.zoom.scale(scale)

      this.rootElement
        .transition()
        .duration(CONFIG.ZOOM_ANIMATION_DURATION)
        .call(this.zoom.event)
    }
  }

  InteractiveSeating.prototype.zoomByFactor = function(factor) {
    // http://stackoverflow.com/questions/25333309/d3-js-how-to-add-zoom-button-with-the-default-wheelmouse-zoom-behavior
    var currentTranslate = this.zoom.translate()
    var currentScale = this.zoom.scale()
    var newScale = this.zoom.scale() * factor

    var x = currentTranslate[0]
    var y = currentTranslate[1]
    var centerX = this.width / 2
    var centerY = this.height / 2
    x = (x - centerX) * factor + centerX
    y = (y - centerY) * factor + centerY

    this.translateAndScale(x, y, newScale)
  }

  InteractiveSeating.prototype.zoomToFit = function() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.svgContainer.attr({
      width: this.width,
      height: this.height
    })

    var containerWidth = this.width
    var containerHeight = this.height

    // WARNING: Tooltips will affect the rootElement bounding box!
    if (this.currentTooltip) {
      this.currentTooltip.remove()
    }

    var stadiumBoundingBox = this.rootElement.node().getBBox()
    var stadiumWidth = stadiumBoundingBox.width
    var stadiumHeight = stadiumBoundingBox.height

    var xScale = containerWidth / stadiumWidth
    var yScale = containerHeight / stadiumHeight
    var scale = Math.min(xScale, yScale)

    scale *= CONFIG.INITIAL_SCALE

    // stadiumBoundingBox.x & stadiumBoundingBox.y is some fake padding screwing up our measurements.
    var xOffset = 0 - stadiumBoundingBox.x * scale
    var yOffset = 0 - stadiumBoundingBox.y * scale

    var emptyXSpace = containerWidth - stadiumWidth * scale
    var xOffset = emptyXSpace / 2 + xOffset

    var emptyYSpace = containerHeight - stadiumHeight * scale
    var yOffset = emptyYSpace / 2 + yOffset

    // Note that the rootElement contains white space to the left of the stadium.
    // So to 'center' the stadium, we end up giving rootElement a negative x translate.
    // So rootElement goes off the screen into the negative left portion of svgContainer.
    // That is what this xOffset does.

    this.translateAndScale(xOffset, yOffset, scale)
  }

  InteractiveSeating.prototype.attachResizeListener = function() {
    var that = this
    var resizeTimeout = null
    var resizeListener = function() {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      // We wait for user to stop resizing before calling zoomToFit.
      resizeTimeout = setTimeout(function() {
        // See if the chart is still in the DOM.
        if (document.getElementById(that.containerId)) {
          that.zoomToFit(that.svgContainer)
        } else {
          // If not, stop listening to window resize.
          window.removeEventListener('resize', resizeListener)
        }
      }, CONFIG.RESIZE_DELAY)
    }
    window.addEventListener('resize', resizeListener)
  }

  // STYLING ///////////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.createDropShadow = function() {
    var defs = this.svgContainer.append('defs')
    var filter = defs.append('filter').attr({
      id: 'drop-shadow',
      height: '200%',
      width: '200%'
    })
    filter.append('feOffset').attr({
      in: 'SourceAlpha',
      dx: 1,
      dy: 1,
      result: 'offsetOut'
    })
    filter.append('feGaussianBlur').attr({
      in: 'offsetOut',
      stdDeviation: 1.8,
      result: 'blurOut'
    })
    filter.append('feBlend').attr({
      in: 'SourceGraphic',
      in2: 'blurOut',
      mode: 'normal',
      result: 'blendOut'
    })
    var feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'blendOut')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    var lightFill =
      '#' +
      // The 0 + & slice(-2) combo ensures we always have 2 digits ('a' becomes '0a').
      ('0' + CONFIG.SECTION_FILL_LIGHTEST.r.toString(16)).slice(-2) +
      ('0' + CONFIG.SECTION_FILL_LIGHTEST.g.toString(16)).slice(-2) +
      ('0' + CONFIG.SECTION_FILL_LIGHTEST.b.toString(16)).slice(-2)
    var darkFill =
      '#' +
      ('0' + CONFIG.SECTION_FILL_DARKEST.r.toString(16)).slice(-2) +
      ('0' + CONFIG.SECTION_FILL_DARKEST.g.toString(16)).slice(-2) +
      ('0' + CONFIG.SECTION_FILL_DARKEST.b.toString(16)).slice(-2)

    var priceGradient = defs.append('linearGradient').attr({
      id: 'priceGradient',
      x1: '0%',
      x2: '100%',
      y1: '0%',
      y2: '0%'
    })
    priceGradient.append('stop').attr({
      offset: '0%',
      style: 'stop-color: ' + lightFill + '; stop-opacity: 1;'
    })
    priceGradient.append('stop').attr({
      offset: '100%',
      style: 'stop-color: ' + darkFill + '; stop-opacity: 1;'
    })
  }

  InteractiveSeating.prototype.drawLegend = function(isInteractive) {
    var that = this

    var boundingBox = this.rootElement.node().getBBox()

    // Legend container.
    var legend = this.svgContainer.append('g').attr({
      id: 'legend',
      x: 0,
      y: 0
    })

    // Zoom in button.
    var zoomInButton = legend
      .append('g')
      .attr({
        x: 10,
        y: 10,
        width: CONFIG.ZOOM_BUTTON_SIZE,
        height: CONFIG.ZOOM_BUTTON_SIZE,
        cursor: 'pointer'
      })
      .on('click', function(e) {
        that.zoomByFactor(CONFIG.ZOOM_IN_FACTOR)
        d3.event.stopPropagation()
        return false
      })
      .on('dblclick', function(e) {
        // Prevent double click zoom behavior.
        d3.event.stopPropagation()
        return false
      })
    zoomInButton.append('rect').attr({
      x: 10,
      y: 10,
      width: CONFIG.ZOOM_BUTTON_SIZE,
      height: CONFIG.ZOOM_BUTTON_SIZE,
      fill: CONFIG.TOOLTIP_FILL_COLOR,
      stroke: CONFIG.TEXT_STROKE_COLOR,
      'stroke-width': 1.0
    })
    zoomInButton
      .append('text')
      .attr({
        x: 15,
        y: 29,
        'font-family': CONFIG.TEXT_FONT,
        'font-size': '25px',
        'font-weight': 500,
        fill: CONFIG.TEXT_STROKE_COLOR,
        'pointer-events': 'none'
      })
      .text('+')

    // Zoom out button.
    var zoomOutButton = legend
      .append('g')
      .attr({
        x: 10,
        y: 10 + CONFIG.ZOOM_BUTTON_SIZE,
        width: CONFIG.ZOOM_BUTTON_SIZE,
        width: CONFIG.ZOOM_BUTTON_SIZE,
        cursor: 'pointer'
      })
      .on('click', function(e) {
        that.zoomByFactor(1 / CONFIG.ZOOM_IN_FACTOR)
        d3.event.stopPropagation()
        return false
      })
      .on('dblclick', function(e) {
        // Prevent double click zoom behavior.
        d3.event.stopPropagation()
        return false
      })
    zoomOutButton.append('rect').attr({
      x: 10,
      y: 10 + CONFIG.ZOOM_BUTTON_SIZE,
      width: CONFIG.ZOOM_BUTTON_SIZE,
      height: CONFIG.ZOOM_BUTTON_SIZE,
      fill: CONFIG.TOOLTIP_FILL_COLOR,
      stroke: CONFIG.TEXT_STROKE_COLOR,
      'stroke-width': 1.0
    })
    zoomOutButton
      .append('text')
      .attr({
        x: 15,
        y: 53,
        'font-family': CONFIG.TEXT_FONT,
        'font-size': '24px',
        'font-weight': 700,
        fill: CONFIG.TEXT_STROKE_COLOR,
        'pointer-events': 'none'
      })
      .text('\u2013') // The longer '-' symbol.

    // Reset button
    var yOffset = 10 + CONFIG.ZOOM_BUTTON_SIZE
    if (!this.showPriceLegend) {
      yOffset = 10
    }
    var resetButton = legend
      .append('g')
      .attr({
        x: 10 + CONFIG.ZOOM_BUTTON_SIZE,
        y: yOffset,
        width: 42,
        height: CONFIG.ZOOM_BUTTON_SIZE,
        cursor: 'pointer'
      })
      .on('click', function(e) {
        that.zoomToFit()
        d3.event.stopPropagation()
        return false
      })
      .on('dblclick', function(e) {
        // Prevent double click zoom behavior.
        d3.event.stopPropagation()
        return false
      })
    resetButton.append('rect').attr({
      x: 10 + CONFIG.ZOOM_BUTTON_SIZE,
      y: yOffset,
      width: CONFIG.ZOOM_BUTTON_SIZE * 3,
      height: CONFIG.ZOOM_BUTTON_SIZE,
      fill: CONFIG.TOOLTIP_FILL_COLOR,
      stroke: CONFIG.TEXT_STROKE_COLOR,
      'stroke-width': 1.0
    })
    resetButton
      .append('text')
      .attr({
        x: 10 + 6 + CONFIG.ZOOM_BUTTON_SIZE,
        y: yOffset + 16,
        'font-family': CONFIG.TEXT_FONT,
        'font-size': '10.5px',
        'font-weight': 500,
        fill: CONFIG.TEXT_STROKE_COLOR,
        'pointer-events': 'none'
      })
      .text('Reset Zoom')

    if (isInteractive && this.showPriceLegend) {
      // Price key.
      var priceKey = legend.append('g').attr({
        x: 10 + CONFIG.ZOOM_BUTTON_SIZE,
        y: 10,
        width: CONFIG.ZOOM_BUTTON_SIZE * 8,
        height: CONFIG.ZOOM_BUTTON_SIZE
      })
      priceKey.append('rect').attr({
        x: 10 + CONFIG.ZOOM_BUTTON_SIZE,
        y: 10,
        width: CONFIG.ZOOM_BUTTON_SIZE * 8,
        height: CONFIG.ZOOM_BUTTON_SIZE,
        fill: 'url(#priceGradient)',
        stroke: CONFIG.TEXT_STROKE_COLOR,
        'stroke-width': 1.0
      })
      /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // clear button
      var clearButton = legend
        .append('g')
        .attr({
          x: 10 + CONFIG.ZOOM_BUTTON_SIZE * 4,
          y: yOffset,
          width: CONFIG.ZOOM_BUTTON_SIZE * 3,
          height: CONFIG.ZOOM_BUTTON_SIZE,
          cursor: 'pointer'
        })
        .on('click', function(e) {
          that.triggerEvent(EVENTS.ON_CLEAR_BUTTON_CLICK)
          // d3.event.stopPropagation();
          return false
        })
        .on('dblclick', function(e) {
          // Prevent double click zoom behavior.
          d3.event.stopPropagation()
          return false
        })
      clearButton.append('rect').attr({
        x: 10 + CONFIG.ZOOM_BUTTON_SIZE * 4,
        y: yOffset,
        width: CONFIG.ZOOM_BUTTON_SIZE * 3,
        height: CONFIG.ZOOM_BUTTON_SIZE,
        fill: CONFIG.TOOLTIP_FILL_COLOR,
        stroke: CONFIG.TEXT_STROKE_COLOR,
        'stroke-width': 1.0
      })
      clearButton
        .append('text')
        .attr({
          x: 10 + 12 + CONFIG.ZOOM_BUTTON_SIZE * 4,
          y: yOffset + 16,
          'font-family': CONFIG.TEXT_FONT,
          'font-size': '10.5px',
          'font-weight': 500,
          fill: CONFIG.TEXT_STROKE_COLOR,
          'pointer-events': 'none'
        })
        .text('Clear All')

      // Min price label.
      priceKey
        .append('text')
        .attr({
          x: 10 + 10 + CONFIG.ZOOM_BUTTON_SIZE,
          y: 28,
          fill: CONFIG.TEXT_FILL_COLOR,
          'font-family': CONFIG.TEXT_FONT, // We're going to override the provided fonts (var fontFamily).
          'font-size': 16,
          'font-weight': CONFIG.TEXT_FONT_WEIGHT,
          stroke: CONFIG.TEXT_STROKE_COLOR,
          'stroke-width': 1.0,
          'stroke-linecap': 'butt',
          'stroke-linejoin': 'miter',
          'stroke-opacity': 1.0,
          'paint-order': 'stroke'
        })
        .text('$' + commaSeparateNumber(this.pricingData.minPrice.toFixed(0)))

      // Max price label.
      priceKey
        .append('text')
        .attr({
          x: 10 + 10 + CONFIG.ZOOM_BUTTON_SIZE * 4,
          y: 28,
          fill: CONFIG.TEXT_FILL_COLOR,
          'font-family': CONFIG.TEXT_FONT, // We're going to override the provided fonts (var fontFamily).
          'font-size': 16,
          'font-weight': CONFIG.TEXT_FONT_WEIGHT,
          stroke: CONFIG.TEXT_STROKE_COLOR,
          'stroke-width': 1.0,
          'stroke-linecap': 'butt',
          'stroke-linejoin': 'miter',
          'stroke-opacity': 1.0,
          'paint-order': 'stroke'
        })
        .text('$' + commaSeparateNumber(this.pricingData.maxPrice.toFixed(0)))
    }
  }

  // HOVER TOOLTIPS ////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.determineQuadrant = function(coords, width, height) {
    var x = coords[0]
    var y = coords[1]
    var quadrant = []

    if (x < width / 2) {
      quadrant.push(QUADRANTS.LEFT)
    } else {
      quadrant.push(QUADRANTS.RIGHT)
    }

    if (y < height / 2) {
      quadrant.push(QUADRANTS.TOP)
    } else {
      quadrant.push(QUADRANTS.BOTTOM)
    }

    return quadrant
  }

  InteractiveSeating.prototype.displayTooltip = function(element, sectionId, suppressEvents) {
    var that = this

    // A word on all this scaling & transform math.
    // All I can say is the coordinate system is constant regardless of scale.
    // So X & Y coords never change.
    // Widths & Heights never change.
    // If you are applying constant numbers, don't scale them.
    // In this case, we scale the tooltip to keep it constant size regardless of the scaling applied to stadium.
    //  i.e. keep it big enough to read.

    var listingsCount = 0
    var lowestPrice = null
    var tickets = this.ticketsBySectionId[sectionId]
    if (tickets) {
      listingsCount = tickets.length
      lowestPrice = this.pricingData.lowestPriceBySectionId[sectionId]
    }

    if (this.showTooltip) {
      if (this.currentTooltip) {
        this.currentTooltip.remove()
      }
      if (this.autoClearTooltipTimeout) {
        clearTimeout(this.autoClearTooltipTimeout)
      }

      var scale = this.zoom.scale()
      var undoScale = 1 / scale // Used to unscale the tooltips.

      var stadiumBoundingBox = this.rootElement.node().getBBox()
      var stadiumWidth = stadiumBoundingBox.width
      var stadiumHeight = stadiumBoundingBox.height

      var sectionCenter = getCentroid(element)
      // stadiumBoundingBox.x & stadiumBoundingBox.y is some fake padding screwing up our measurements.
      sectionCenter[0] = sectionCenter[0] - stadiumBoundingBox.x
      sectionCenter[1] = sectionCenter[1] - stadiumBoundingBox.y

      var quadrant = this.determineQuadrant(sectionCenter, stadiumWidth, stadiumHeight)

      var deltaX = 30 // Offset the tooltips 30px away from cursor so you can hover off without ending up inside tooltip.
      var deltaY = 30

      var unscaledTooltipWidth = undoScale * CONFIG.TOOLTIP_WIDTH
      var unscaledTooltipHeight = undoScale * CONFIG.TOOLTIP_HEIGHT

      // On top half of stadium, tooltip appears bottom of cursor.
      // On bottom half of stadium, tooltip appears top of cursor.
      if (quadrant[1] == QUADRANTS.BOTTOM) {
        deltaY = 0 - deltaY - unscaledTooltipHeight
      }

      // On left half of stadium, tooltip appears right of cursor.
      // On right half of stadium, tooltip appears left of cursor.
      if (quadrant[0] == QUADRANTS.RIGHT) {
        deltaX = 0 - deltaX - unscaledTooltipWidth
      }

      var startX = sectionCenter[0] + stadiumBoundingBox.x + deltaX
      var startY = sectionCenter[1] + stadiumBoundingBox.y + deltaY

      // Tooltip <g> container.
      this.currentTooltip = this.rootElement.append('g').attr({
        transform: 'translate(' + startX + ',' + startY + ') scale(' + undoScale + ')'
      })
      this.currentTooltip.append('rect').attr({
        width: CONFIG.TOOLTIP_WIDTH,
        height: CONFIG.TOOLTIP_HEIGHT,
        fill: CONFIG.TOOLTIP_FILL_COLOR,
        stroke: CONFIG.TEXT_STROKE_COLOR,
        'stroke-width': 1.0,
        filter: 'url(#drop-shadow)'
      })

      // Section label.
      this.currentTooltip
        .append('text')
        .attr({
          x: 10,
          y: CONFIG.TOOLTIP_HEIGHT - 30,
          'font-family': CONFIG.TEXT_FONT,
          'font-size': '14px',
          fill: '#000'
        })
        .text(function(d) {
          return humanizeSectionId(sectionId)
        })

      // Ticket info.
      this.currentTooltip
        .append('text')
        .attr({
          x: 10,
          y: CONFIG.TOOLTIP_HEIGHT - 10,
          'font-family': CONFIG.TEXT_FONT,
          'font-size': '12px',
          fill: '#555'
        })
        .text(function(d) {
          if (listingsCount) {
            var listings = listingsCount == 1 ? 'Listing' : 'Listings'
            return listingsCount + ' ' + listings
          } else {
            return 'No tickets.'
          }
        })

      this.currentTooltip
        .append('text')
        .attr({
          x: 80,
          y: CONFIG.TOOLTIP_HEIGHT - 10,
          'font-family': CONFIG.TEXT_FONT,
          'font-size': '12px',
          fill: '#555'
        })
        .text(function(d) {
          if (listingsCount) {
            return 'Starting at $' + lowestPrice.toFixed(2)
          }
        })

      this.autoClearTooltipTimeout = setTimeout(function() {
        if (that.currentTooltip) {
          that.currentTooltip.remove()
        }
      }, CONFIG.TOOLTIP_TIMEOUT)
    }

    var data = {
      listingsCount: listingsCount,
      lowestPrice: lowestPrice,
      sectionId: sectionId
    }

    if (!suppressEvents) {
      this.triggerEvent(EVENTS.ON_HOVERED_SECTION_CHANGE, { detail: data })
    }

    this.fetchSeatImageLocation(sectionId)
  }

  InteractiveSeating.prototype.fetchSeatImageLocation = function(sectionId) {
    var alreadyFetchedData = this.seatPreviewCache[sectionId]
    if (alreadyFetchedData) {
      this.triggerEvent(EVENTS.SEAT_PREVIEW_IMAGE_AVAILABLE, {
        detail: alreadyFetchedData
      })
    } else {
      var vid = encodeURIComponent(this.venueId + '_' + this.configurationId)
      var sectionId = encodeURIComponent(sectionId)
      var sectionNumber = encodeURIComponent(getSectionNumberFromSectionId(sectionId))
      var url = URLS.SEAT_PREVIEW + '&vid=' + vid + '&matchedSecId=' + sectionId + '&section_id=' + sectionNumber
      loadScript(url)
    }
  }

  InteractiveSeating.prototype.onSeatImageLocationFound = function(json) {
    json = JSON.parse(json)
    var sectionNumber = json.secid
    var bigImageUrl = json.bimg.replace(/https:\/\//i, 'http://')
    var smallImageUrl = json.simg.replace(/https:\/\//i, 'http://')
    var isAvailable = bigImageUrl != URLS.MISSING_SEAT_PREVIEW
    var data = {
      sectionNumber: sectionNumber,
      isAvailable: isAvailable,
      bigImageUrl: bigImageUrl,
      smallImageUrl: smallImageUrl
    }
    var matches = bigImageUrl.match(SEATVIEW_EXTRACT_SECTION_ID_REGEX)
    if (matches && matches.length > 2) {
      var sectionId = matches[2]
      this.seatPreviewCache[sectionId] = data
    }
    this.triggerEvent(EVENTS.SEAT_PREVIEW_IMAGE_AVAILABLE, { detail: data })
  }

  // RENDER ////////////////////////////////////////////////////////////////////
  InteractiveSeating.prototype.addPathElement = function(sectionId, data) {
    var that = this
    var pathData = data.p
    var attrs = {
      d: pathData
    }
    var pathElement = this.rootElement
      .append('path')
      .attr(attrs)
      .datum({
        sectionId: sectionId
      })
    if (!data.field) {
      pathElement
        .on('mouseover', function() {
          that.onSectionMouseover(this)
        })
        .on('mouseout', function() {
          that.onSectionMouseout(this)
        })
        .on('click', function() {
          that.onSectionClick(this)
        })
    }
    this.pathElementsBySectionId[sectionId] = pathElement
    return pathElement
  }

  InteractiveSeating.prototype.stylePathElement = function(
    pathElement,
    sectionId,
    maxRoomToDarken,
    darkenPerDollar,
    sqrtSpread,
    isField
  ) {
    var fillColor = CONFIG.SECTION_FILL_EMPTY
    if (isField) {
      fillColor = CONFIG.SECTION_FILL_FIELD
    }
    if (this.pricingData.lowestPriceBySectionId[sectionId]) {
      var lowestPriceInSection = this.pricingData.lowestPriceBySectionId[sectionId]

      var sqrtPrice = Math.sqrt(lowestPriceInSection)
      var sqrtMaxPrice = Math.sqrt(this.pricingData.maxPrice)

      var percentOfMax = 1 - (sqrtMaxPrice - sqrtPrice) / sqrtSpread
      var darkenAmount = {
        r: maxRoomToDarken.r * percentOfMax,
        g: maxRoomToDarken.g * percentOfMax,
        b: maxRoomToDarken.b * percentOfMax
      }
      fillColor = {
        r: CONFIG.SECTION_FILL_LIGHTEST.r - darkenAmount.r,
        g: CONFIG.SECTION_FILL_LIGHTEST.g - darkenAmount.g,
        b: CONFIG.SECTION_FILL_LIGHTEST.b - darkenAmount.b
      }
      fillColor =
        '#' +
        // The 0 + & slice(-2) combo ensures we always have 2 digits ('a' becomes '0a').
        ('0' + Math.ceil(fillColor.r).toString(16)).slice(-2) +
        ('0' + Math.ceil(fillColor.g).toString(16)).slice(-2) +
        ('0' + Math.ceil(fillColor.b).toString(16)).slice(-2)
    }
    var attrs = {
      fill: fillColor,
      cursor: 'default',
      stroke: CONFIG.SECTION_STROKE_COLOR,
      'stroke-width': CONFIG.SECTION_STROKE_WIDTH
    }
    var hasTickets = this.ticketsBySectionId[sectionId]
    if (hasTickets) {
      attrs.cursor = 'pointer'
    }
    this.originalFillColors[sectionId] = fillColor
    pathElement.attr(attrs)
  }

  InteractiveSeating.prototype.addTextElement = function(data) {
    var pathData = data.m
    var fontSize = data.s
    var fontFamily = data.f
    var text = data.t.trim()
    var matrixTransform = data.m

    var groupEl = this.rootElement.append('g').attr('transform', 'matrix(' + matrixTransform + ')')

    // Just a fake drop shadow, hence fill is TEXT_STROKE_COLOR
    //    var attrs = {
    //      fill:           CONFIG.TEXT_STROKE_COLOR,
    //      'font-family':  CONFIG.TEXT_FONT, // We're going to override the provided fonts (var fontFamily).
    //      'font-size':    fontSize,
    //      'font-weight':  CONFIG.TEXT_FONT_WEIGHT,
    //      transform:      'translate(0.5, 0.5)'
    //    };

    // The real text element.
    var attrs = {
      fill: CONFIG.TEXT_FILL_COLOR,
      'font-family': CONFIG.TEXT_FONT, // We're going to override the provided fonts (var fontFamily).
      'font-size': fontSize,
      'font-weight': CONFIG.TEXT_FONT_WEIGHT,
      stroke: CONFIG.TEXT_STROKE_COLOR,
      'pointer-events': 'none', // Let people click through text onto sections.
      'stroke-width': 1.0,
      'stroke-linecap': 'butt',
      'stroke-linejoin': 'miter',
      'stroke-opacity': 1.0,
      'paint-order': 'stroke'
    }
    var textEl = groupEl
      .append('text')
      .attr(attrs)
      .text(text)
  }

  InteractiveSeating.prototype.addImageNode = function(data) {
    var folderUrl = encodeURIComponent(this.venueId + '_' + this.configurationId)
    var src = URLS.IMAGE_PREFIX + folderUrl + '/' + data.src
    var width = data.w
    var height = data.h
    var matrixTransform = data.m
    var groupEl = this.rootElement.append('g').attr('transform', 'matrix(' + matrixTransform + ')')
    var attrs = {
      x: 0,
      y: 0,
      width: width,
      height: height,
      stroke: CONFIG.SECTION_STROKE_COLOR,
      'stroke-width': CONFIG.SECTION_STROKE_WIDTH,
      'xlink:href': src
    }
    var imageEl = groupEl.append('image').attr(attrs)
  }

  InteractiveSeating.prototype.renderError = function(message) {
    hideLoading()
    this.rootElement
      .append('text')
      .attr({
        x: 20,
        y: 30,
        'font-family': CONFIG.TEXT_FONT,
        'font-size': '20px',
        'font-weight': 700,
        fill: '#000'
      })
      .text(message)
  }

  InteractiveSeating.prototype.renderLoading = function() {
    this.rootElement
      .append('text')
      .attr({
        id: 'loading',
        x: 20,
        y: 30,
        'font-family': CONFIG.TEXT_FONT,
        'font-size': '20px',
        'font-weight': 700,
        fill: '#000'
      })
      .text('Loading...')
  }

  InteractiveSeating.prototype.renderInteractive = function() {
    var that = this

    var onceMapIsDownloadedCallback = function() {
      // If no geometry available.
      if (typeof seatingChart === 'undefined') {
        that.renderStatic()
        return
      }

      var geometry = seatingChart // seatingChart is defined in map_shapes.js
      var tickets = that.tickets
      that.ticketsBySectionId = getTicketsBySectionId(tickets)
      that.pricingData = getLowestPriceBySectionId(that.ticketsBySectionId)
      var maxRoomToDarken = getMaxRoomToDarken()

      var sqrtMaxPrice = Math.sqrt(that.pricingData.maxPrice)
      var sqrtMinPrice = Math.sqrt(that.pricingData.minPrice)
      var sqrtSpread = Math.max(sqrtMaxPrice - sqrtMinPrice, 1)

      var darkenPerDollar = getDarkenPerDollar(maxRoomToDarken, sqrtSpread)

      hideLoading()
      for (var mapShapeId in geometry) {
        var data = geometry[mapShapeId]
        var tagType = data.type

        if (tagType == SVG_TAGS.PATH) {
          var sectionId = getSectionIdFromMapShapeId(mapShapeId)
          that.indexSectionId(sectionId)
          var pathElement = that.addPathElement(sectionId, data)
          var isField = data.field
          that.stylePathElement(pathElement, sectionId, maxRoomToDarken, darkenPerDollar, sqrtSpread, isField)
        } else if (tagType == SVG_TAGS.TEXT) {
          that.addTextElement(data)
        } else if (tagType == SVG_TAGS.IMAGE) {
          that.addImageNode(data)
        }
      }

      var isInteractive = true
      that.attachZoomAndPan()
      that.createDropShadow()
      that.drawLegend(isInteractive)
      that.zoomToFit()
      that.attachResizeListener()

      that.triggerEvent(EVENTS.INTERACTIVE_READY)
    }

    getMapGeometry(this.venueId, this.configurationId, onceMapIsDownloadedCallback)
  }

  InteractiveSeating.prototype.renderContainer = function() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.svgContainer = d3
      .select(this.container)
      .append('svg')
      .attr({
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        xmlns: 'http://www.w3.org/2000/svg'
      })
    this.rootElement = this.svgContainer.append('g').attr({
      id: 'rootElement',
      x: 0,
      y: 0
    })
  }

  InteractiveSeating.prototype.renderStatic = function() {
    var that = this
    var vid = encodeURIComponent(this.venueId + '_' + this.configurationId)
    var src = URLS.STATIC + vid + '.jpg'
    var img = new Image()

    img.onload = function() {
      hideLoading()
      var groupEl = that.rootElement.append('g')
      var attrs = {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
        'xlink:href': src
      }
      var imageEl = groupEl.append('image').attr(attrs)

      var isInteractive = false
      that.attachZoomAndPan()
      that.createDropShadow()
      that.drawLegend(isInteractive)
      that.zoomToFit()
    }
    img.onerror = function() {
      that.renderError('Seating chart unavailable.')
    }

    img.crossOrigin = 'anonymous'
    img.src = src
  }

  /// ///////////////////////////////////////////////////////////////////////////
  // STATIC METHODS
  /// ///////////////////////////////////////////////////////////////////////////
  InteractiveSeating.doesInteractiveExist = function(options) {
    var venueId = options.venueId
    var configurationId = options.configurationId
    var callback = options.callback
    checkIfInteractiveExists(venueId, configurationId, callback)
  }

  InteractiveSeating.getSectionsByZoneStatic = function(options) {
    var venueId = options.venueId
    var configurationId = options.configurationId
    var tickets = options.tickets
    var callback = options.callback
    var getSectionsByZone = this.prototype.getSectionsByZone

    getSectionMatching(venueId, configurationId, tickets, getSectionsByZone, callback)
  }

  return InteractiveSeating
})(window)

module.exports = InteractiveSeating
