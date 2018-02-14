'use strict'
var _typeof =
  'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
    ? function(e) {
        return typeof e
      }
    : function(e) {
        return e &&
          'function' == typeof Symbol &&
          e.constructor === Symbol &&
          e !== Symbol.prototype
          ? 'symbol'
          : typeof e
      }
'undefined' == typeof seatsio &&
  (function() {
    var e,
      t,
      i,
      n,
      o,
      r,
      s,
      a = 'https://cdn.seats.io',
      h = 'https://data.seats.io'
    if (
      ((o = 'chart.js'),
      (r = 'seats.io'),
      (s = document.getElementsByTagName('script')),
      !(function(e, t, i) {
        for (var n = 0; n < i.length; ++n) {
          var o = i[n],
            r = o.src
          if (r && -1 != r.toLowerCase().indexOf(t) && -1 != r.indexOf(e))
            return !0
        }
        return !1
      })(o, r, s))
    )
      return (
        (e = 'CHART_RENDERING_ERROR'),
        (t = { error: 'CHARTJS_LOADED_FROM_INVALID_DOMAIN' }),
        (i = h),
        (n = new XMLHttpRequest()).open('POST', i + '/events'),
        n.setRequestHeader('Content-Type', 'application/json'),
        n.send(
          JSON.stringify({ eventType: e, metadata: t, url: document.URL })
        ),
        void console.error(
          'chart.js does not appear to have been loaded from the seats.io domain. Please load it from ' +
            a +
            '/chart.js'
        )
      )
    var c = {}
    function l(e, t) {
      window.addEventListener
        ? window.addEventListener(e, t)
        : window.attachEvent('on' + e, t)
    }
    ;(c.onLoad = function(e) {
      e()
    }),
      (c.charts = []),
      (c.CHART_ID = 0),
      (c.v2Url = 'https://api.seats.io'),
      (c.CDNUrl = a),
      (c.CDNStaticFilesUrl = 'https://cdn.seats.io/static/version/v186'),
      (c.dataCollectorUrl = h),
      (c.ablySubscribeKey = 'hnsCTA.N9m7fg:y3JI9JQ1krTED-b9'),
      (c.getChart = function(e) {
        for (var t = 0; t < this.charts.length; ++t) {
          var i = this.charts[t].iframe
          if (i && i.contentWindow === e) return this.charts[t]
        }
      }),
      (c.destroyCharts = function() {
        c.charts.slice().forEach(function(e) {
          e.destroy()
        })
      }),
      (c.DOMElementListener = function() {
        ;(this.elementFetcher = null),
          (this.widthChangedListener = null),
          (this.dimensionsChangedListener = null),
          (this.positionInViewportChangedListener = null),
          (this.lastDimensions = null),
          (this.lastPositionInViewport = null),
          (this.stopRequested = !1)
      }),
      (c.DOMElementListener.prototype.withElementFetcher = function(e) {
        return (this.elementFetcher = e), this
      }),
      (c.DOMElementListener.prototype.onInitialDimensionsDetermined = function(
        e
      ) {
        return (this.initialDimensionsDeterminedListener = e), this
      }),
      (c.DOMElementListener.prototype.onWidthChanged = function(e) {
        return (this.widthChangedListener = e), this
      }),
      (c.DOMElementListener.prototype.onDimensionsChanged = function(e) {
        return (this.dimensionsChangedListener = e), this
      }),
      (c.DOMElementListener.prototype.onPositionInViewportChanged = function(
        e
      ) {
        return (this.positionInViewportChangedListener = e), this
      }),
      (c.DOMElementListener.prototype.start = function() {
        return this.listenForChanges(), this
      }),
      (c.DOMElementListener.prototype.stop = function() {
        return (this.stopRequested = !0), this
      }),
      (c.DOMElementListener.prototype.listenForChanges = function() {
        this.shouldStop() ||
          (null === this.lastDimensions
            ? (this.lastDimensions = this.determineInitialDimensions())
            : this.invokeDimensionsChangedListenerIfNeeded(),
          this.invokePositionInViewportChangedListenerIfNeeded()),
          this.relistenForChanges()
      }),
      (c.DOMElementListener.prototype.relistenForChanges = function() {
        window.requestAnimationFrame(this.listenForChanges.bind(this))
      }),
      (c.DOMElementListener.prototype.determineInitialDimensions = function() {
        var e = this.elementDimensions()
        return 0 === e.width && 0 === e.height
          ? null
          : (this.initialDimensionsDeterminedListener &&
              this.initialDimensionsDeterminedListener(e.width, e.height),
            e)
      }),
      (c.DOMElementListener.prototype.shouldStop = function() {
        return !this.elementFetcher() || this.stopRequested
      }),
      (c.DOMElementListener.prototype.invokeDimensionsChangedListenerIfNeeded = function() {
        var e = this.elementDimensions()
        this.checkForWidthChanges(e),
          this.checkForDimensionChanges(e),
          (this.lastDimensions = e)
      }),
      (c.DOMElementListener.prototype.invokePositionInViewportChangedListenerIfNeeded = function() {
        var e = new c.Element(this.elementFetcher()).getPositionInViewport(),
          t = !this.positionsInViewportAreEqual(this.lastPositionInViewport, e),
          i = !this.viewportSizesAreEqual(
            this.lastViewportWidth,
            this.lastViewportHeight,
            window.innerWidth,
            window.innerHeight
          )
        ;(t || i) &&
          ((this.lastPositionInViewport = e),
          (this.lastViewportWidth = window.innerWidth),
          (this.lastViewportHeight = window.innerHeight),
          this.invokePositionInViewportChangedListener.apply(this))
      }),
      (c.DOMElementListener.prototype.invokePositionInViewportChangedListener = function() {
        this.positionInViewportChangedListener &&
          this.positionInViewportChangedListener(this.lastPositionInViewport)
      }),
      (c.DOMElementListener.prototype.onChartRendered = function() {
        this.invokePositionInViewportChangedListener()
      }),
      (c.DOMElementListener.prototype.resetCurrentDimensions = function() {
        var e = this.elementDimensions()
        ;(this.lastDimensions = e),
          (this.lastPositionInViewport = new c.Element(
            this.elementFetcher()
          ).getPositionInViewport())
      }),
      (c.DOMElementListener.prototype.checkForWidthChanges = function(e) {
        e.width !== this.lastDimensions.width &&
          this.widthChangedListener &&
          this.widthChangedListener(e.width)
      }),
      (c.DOMElementListener.prototype.checkForDimensionChanges = function(e) {
        ;(e.width === this.lastDimensions.width &&
          e.height === this.lastDimensions.height) ||
          (this.dimensionsChangedListener &&
            this.dimensionsChangedListener(e.width, e.height))
      }),
      (c.DOMElementListener.prototype.elementDimensions = function() {
        var e = new c.Element(this.elementFetcher())
        return { width: e.getContentWidth(), height: e.getContentHeight() }
      }),
      (c.DOMElementListener.prototype.positionsInViewportAreEqual = function(
        e,
        t
      ) {
        return (
          e &&
          t &&
          e.top === t.top &&
          e.right === t.right &&
          e.bottom === t.bottom &&
          e.left === t.left
        )
      }),
      (c.DOMElementListener.prototype.viewportSizesAreEqual = function(
        e,
        t,
        i,
        n
      ) {
        return e == i && t == n
      }),
      (c.Element = function(e) {
        this.element = e
      }),
      (c.Element.prototype.getPositionInViewport = function() {
        var e = this.element.getBoundingClientRect()
        return { top: e.top, bottom: e.bottom, right: e.right, left: e.left }
      }),
      (c.Element.prototype.getContentHeight = function() {
        var e = getComputedStyle(this.element),
          t = c.Element.pixelsToNumber(e.height)
        return 'border-box' === e['box-sizing']
          ? t - c.Element.verticalPaddingAndBorder(e)
          : t
      }),
      (c.Element.prototype.getContentWidth = function() {
        var e = getComputedStyle(this.element),
          t = c.Element.pixelsToNumber(e.width)
        return 'border-box' === e['box-sizing']
          ? t - c.Element.horizontalPaddingAndBorder(e)
          : t
      }),
      (c.Element.pixelsToNumber = function(e) {
        return 'auto' === e ? 0 : parseFloat(e)
      }),
      (c.Element.horizontalPaddingAndBorder = function(e) {
        return (
          c.Element.pixelsToNumber(e['border-left-width']) +
          c.Element.pixelsToNumber(e['border-right-width']) +
          c.Element.pixelsToNumber(e['padding-left']) +
          c.Element.pixelsToNumber(e['padding-right'])
        )
      }),
      (c.Element.verticalPaddingAndBorder = function(e) {
        return (
          c.Element.pixelsToNumber(e['border-top-width']) +
          c.Element.pixelsToNumber(e['border-bottom-width']) +
          c.Element.pixelsToNumber(e['padding-top']) +
          c.Element.pixelsToNumber(e['padding-bottom'])
        )
      }),
      (c.Embeddable = function() {}),
      (c.Embeddable.prototype.init = function(e) {
        this.validateConfig(e),
          e || (e = {}),
          (e.configKeys = Object.keys(e)),
          e.divId || (e.divId = 'chart'),
          e.loading ||
            (e.loading =
              '<div class="spinner-loader"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'),
          (this.config = e),
          (this.iframe = null)
      }),
      (c.Embeddable.prototype.validateConfig = function(e) {}),
      (c.Embeddable.prototype.container = function() {
        return document.getElementById(this.config.divId)
      }),
      (c.Embeddable.prototype.createIframe = function(e) {
        ;(this.iframe = document.createElement('iframe')),
          (this.iframe.style.border = 'none'),
          (this.iframe.scrolling = 'no'),
          (this.iframe.frameBorder = 0),
          (this.iframe.src = e),
          (this.iframe.style.width = '100%'),
          (this.iframe.style.height = '100%'),
          (this.iframe.style.display = 'block'),
          (this.iframe.style.visibility = 'hidden'),
          this.container().appendChild(this.iframe)
      }),
      (c.Embeddable.prototype.removeIframe = function() {
        this.iframe &&
          (this.container().removeChild(this.iframe), (this.iframe = null))
      }),
      (c.Embeddable.prototype.createLoadingDiv = function() {
        ;(this.loadingDiv = document.createElement('div')),
          (this.loadingDiv.style.textAlign = 'center'),
          (this.loadingDiv.style.padding = '20px 0'),
          (this.loadingDiv.innerHTML = this.config.loading),
          this.container().appendChild(this.loadingDiv)
      }),
      (c.Embeddable.prototype.removeLoadingDiv = function() {
        this.loadingDiv &&
          (this.container().removeChild(this.loadingDiv),
          (this.loadingDiv = null))
      }),
      (c.Embeddable.prototype.sendMsgToIframe = function(e) {
        this.iframe &&
          this.iframe.contentWindow.postMessage(JSON.stringify(e), '*')
      })
    var d,
      u = 16
    function g(e) {
      this.val = e
    }
    function f(e) {
      return new g(e)
    }
    function p(e) {
      for (var t = 0; t < c.charts.length; ++t) c.charts[t].handleKey(e)
    }
    ;(c.Embeddable.prototype.handleKey = function(e) {
      e.keyCode === u &&
        this.sendMsgToIframe({ type: e.type, keyCode: e.keyCode })
    }),
      (c.SeatingChart = function(e) {
        c.charts.push(this),
          (this.chartId = c.CHART_ID++),
          this.init(e),
          (this.selectedObjectsInput = null),
          (this.storage = c.SeatsioStorage.create(this.chartId)),
          (this.config.maxSelectedObjects = f(
            this.config.maxSelectedObjects
          ).orElse(this.config.maxSelectedSeats)),
          (this.config.objectColor = f(this.config.objectColor).orElse(
            this.config.seatColor
          )),
          (this.config.objectLabel = f(this.config.objectLabel).orElse(
            this.config.seatLabel
          )),
          (this.config.objectIcon = f(this.config.objectIcon).orElse(
            this.config.seatIcon
          )),
          (this.config.selectedObjectsInputName = f(
            this.config.selectedObjectsInputName
          ).orElse(this.config.selectedSeatsInputName)),
          (this.config.selectedObjects = f(this.config.selectedObjects).orElse(
            this.config.selectedSeats
          )),
          (this.config.onObjectSelected = f(
            this.config.onObjectSelected
          ).orElse(this.config.onSeatSelected)),
          (this.config.onObjectDeselected = f(
            this.config.onObjectDeselected
          ).orElse(this.config.onSeatDeselected)),
          (this.config.onObjectMouseOver = f(
            this.config.onObjectMouseOver
          ).orElse(this.config.onSeatMouseOver)),
          (this.config.onObjectMouseOut = f(
            this.config.onObjectMouseOut
          ).orElse(this.config.onSeatMouseOut)),
          (this.config.onSelectedObjectBooked = f(
            this.config.onSelectedObjectBooked
          ).orElse(this.config.onSelectedSeatBooked)),
          (this.config.onBestAvailableSelected = f(
            this.config.onBestAvailableSelected
          ).orElse(this.config.onBestAvailableSeatsSelected)),
          (this.config.onBestAvailableSelectionFailed = f(
            this.config.onBestAvailableSelectionFailed
          ).orElse(this.config.onBestAvailableSeatsSelectionFailed)),
          (this.config.holdOnSelect = f(this.config.holdOnSelect).orElse(
            this.config.reserveOnSelect
          )),
          (this.config.regenerateHoldToken = f(
            this.config.regenerateHoldToken
          ).orElse(this.config.regenerateReservationToken)),
          (this.config.holdToken = f(this.config.holdToken).orElse(
            this.config.reservationToken
          )),
          (this.config.holdTokenInputName = f(
            this.config.holdTokenInputName
          ).orElse(this.config.reservationTokenInputName)),
          (this.config.onHoldSucceeded = f(this.config.onHoldSucceeded).orElse(
            this.config.onReservationSucceeded
          )),
          (this.config.onHoldFailed = f(this.config.onHoldFailed).orElse(
            this.config.onReservationFailed
          )),
          (this.config.onReleaseHoldSucceeded = f(
            this.config.onReleaseHoldSucceeded
          ).orElse(this.config.onUnreservationSucceeded)),
          (this.config.onReleaseHoldFailed = f(
            this.config.onReleaseHoldFailed
          ).orElse(this.config.onUnreservationFailed)),
          this.config.holdOnSelect &&
            !this.config.regenerateHoldToken &&
            (this.config.holdToken = f(this.config.holdToken).orElse(
              this.fetchStoredHoldToken()
            )),
          (this.config.v2Url = c.v2Url),
          (this.config.CDNUrl = c.CDNUrl),
          (this.config.CDNStaticFilesUrl = c.CDNStaticFilesUrl),
          (this.config.dataCollectorUrl = c.dataCollectorUrl),
          (this.config.ablySubscribeKey = c.ablySubscribeKey),
          (this.selectedObjects = this.selectedSeats = []),
          (this.holdToken = null),
          (this.reservationToken = null),
          (this.requestIdCtr = 0),
          (this.requestCallbacks = {}),
          (this.requestErrorCallbacks = {}),
          (this.state = 'INITIAL'),
          (this.initialContainerDimensions = null),
          (this.domElementListener = null),
          (this.errorSentToDataCollector = !1)
      }),
      (c.SeatingChart.prototype = new c.Embeddable()),
      (c.SeatingChart.prototype.render = function() {
        var e = this
        if ('DESTROYED' === this.state)
          throw new Error('Cannot render a chart that has been destroyed')
        var t = this
        return (
          (this.state = 'RENDERING'),
          (this.domElementListener = new c.DOMElementListener()
            .withElementFetcher(function() {
              return t.container()
            })
            .onInitialDimensionsDetermined(function(e, i) {
              t.renderChartInitially(e, i)
            })
            .onWidthChanged(function(e) {
              t.fitsToWidth() && t.renderChart(e)
            })
            .onDimensionsChanged(function(e, i) {
              t.fitsToWidthAndHeight() && t.renderChart(e, i)
            })
            .onPositionInViewportChanged(function(t) {
              e.sendMsgToIframe({
                type: 'onPositionInViewportChanged',
                positionInViewport: t,
                viewportSize: {
                  width: window.innerWidth,
                  height: window.innerHeight
                }
              })
            })
            .start()),
          this
        )
      }),
      (c.SeatingChart.prototype.destroy = function() {
        if ('DESTROYED' === this.state)
          throw new Error(
            'Cannot destroy a chart that has already been destroyed'
          )
        this.unrender(),
          (this.state = 'DESTROYED'),
          c.removeFromArray(this, c.charts)
      }),
      (c.SeatingChart.prototype.unrender = function() {
        this.domElementListener && this.domElementListener.stop(),
          this.removeIframe(),
          this.removeLoadingDiv(),
          this.removeSelectedObjectsInput(),
          this.removeHoldTokenInput(),
          (this.state = 'INITIAL')
      }),
      (c.SeatingChart.prototype.renderChartInitially = function(e, t) {
        ;(this.renderingStart = new Date()),
          (this.initialContainerDimensions = { width: e, height: t }),
          this.createLoadingDiv(),
          this.positionLoadingDivAbsolutelyToFixContainerDivMinHeightIssueOnIOS(
            e
          ),
          this.createIframe(
            c.CDNStaticFilesUrl + '/chart-renderer/chartRendererIframe.html'
          ),
          this.createSelectedObjectsInput(),
          this.createHoldTokenInput()
      }),
      (c.SeatingChart.prototype.positionLoadingDivAbsolutelyToFixContainerDivMinHeightIssueOnIOS = function(
        e
      ) {
        ;(this.loadingDiv.style.position = 'absolute'),
          (this.loadingDiv.style.width = e + 'px')
      }),
      (c.SeatingChart.prototype.renderChart = function(e, t) {
        this.fitsToWidth() && e
          ? this.sendMsgToIframe({ type: 'render', dimensions: { width: e } })
          : this.fitsToWidthAndHeight() &&
            e &&
            t &&
            this.sendMsgToIframe({
              type: 'render',
              dimensions: { width: e, height: t }
            })
      }),
      (c.SeatingChart.prototype.validateConfig = function(e) {
        new c.SeatingChartConfigValidator(e).validate()
      }),
      (c.SeatingChart.prototype.fitsToWidth = function() {
        return 'width' === this.determineFitTo()
      }),
      (c.SeatingChart.prototype.fitsToWidthAndHeight = function() {
        return 'widthAndHeight' === this.determineFitTo()
      }),
      (c.SeatingChart.prototype.determineFitTo = function() {
        return this.config.fitTo
          ? this.config.fitTo
          : this.initialContainerDimensions.width &&
            this.initialContainerDimensions.height
            ? 'widthAndHeight'
            : 'width'
      }),
      (c.SeatingChart.prototype.configured = function() {
        this.renderChart(
          this.domElementListener.lastDimensions.width,
          this.domElementListener.lastDimensions.height
        )
      }),
      (c.SeatingChart.prototype.rendered = function(e, t) {
        ;(this.state = 'RENDERED'),
          this.showIframe(),
          this.resized(e, t),
          this.hideLoadingDiv(),
          this.domElementListener.onChartRendered(),
          this.config.onChartRendered && this.config.onChartRendered(this),
          'function' == typeof window.callPhantom &&
            window.callPhantom('chartRendered')
      }),
      (c.SeatingChart.prototype.rerendered = function(e, t) {
        this.resized(e, t),
          this.config.onChartRerendered && this.config.onChartRerendered(this)
      }),
      (c.SeatingChart.prototype.resized = function(e, t) {
        ;(this.iframe.style.width = e + 'px'),
          (this.iframe.style.height = t + 'px'),
          this.domElementListener.resetCurrentDimensions()
      }),
      (c.SeatingChart.prototype.createSelectedObjectsInput = function() {
        this.config.selectedObjectsInputName &&
          ((this.selectedObjectsInput = document.createElement('input')),
          (this.selectedObjectsInput.type = 'hidden'),
          (this.selectedObjectsInput.name = this.config.selectedObjectsInputName),
          this.container().appendChild(this.selectedObjectsInput))
      }),
      (c.SeatingChart.prototype.removeSelectedObjectsInput = function() {
        this.selectedObjectsInput &&
          (this.container().removeChild(this.selectedObjectsInput),
          (this.selectedObjectsInput = null))
      }),
      (c.SeatingChart.prototype.createHoldTokenInput = function() {
        if (this.config.holdTokenInputName) {
          var e = document.createElement('input')
          ;(e.type = 'hidden'),
            (e.name = this.config.holdTokenInputName),
            this.container().appendChild(e),
            (this.holdTokenInput = e)
        }
      }),
      (c.SeatingChart.prototype.removeHoldTokenInput = function() {
        this.holdTokenInput &&
          (this.container().removeChild(this.holdTokenInput),
          (this.holdTokenInput = null))
      }),
      (c.SeatingChart.prototype.updateSelectedObjectsInputValue = function() {
        this.selectedObjectsInput &&
          (this.selectedObjectsInput.value = this.selectedObjects)
      }),
      (c.SeatingChart.prototype.objectSelected = function(e) {
        this.selectedObjects.push(this.uuidOrLabel(e)),
          this.updateSelectedObjectsInputValue()
      }),
      (c.SeatingChart.prototype.objectDeselected = function(e) {
        for (var t = 0; t < this.selectedObjects.length; ++t)
          if (this.uuidOrLabel(e) == this.selectedObjects[t]) {
            this.selectedObjects.splice(t, 1)
            break
          }
        this.updateSelectedObjectsInputValue()
      }),
      (c.SeatingChart.prototype.setHoldToken = function(e) {
        ;(this.reservationToken = e),
          (this.holdToken = e),
          this.storage.store('holdToken', e),
          this.holdTokenInput && (this.holdTokenInput.value = e)
      }),
      (c.SeatingChart.prototype.fetchStoredHoldToken = function() {
        return this.storage.fetch('holdToken')
      }),
      (c.SeatingChart.prototype.formatPrices = function(e) {
        var t = {}
        return (
          e.forEach(
            function(e) {
              t[e] = this.config.priceFormatter(e)
            }.bind(this)
          ),
          t
        )
      }),
      (c.SeatingChart.prototype.uuidOrLabel = function(e) {
        return this.config.useObjectUuidsInsteadOfLabels ? e.uuid : e.label
      }),
      (c.SeatingChart.prototype.onError = function(e, t) {
        this.sendErrorToDataCollector(e, t),
          'RENDERING' === this.state && this.onRenderingFailed()
      }),
      (c.SeatingChart.prototype.sendErrorToDataCollector = function(e, t) {
        if (!this.errorSentToDataCollector) {
          var i = new XMLHttpRequest()
          i.open('POST', this.config.dataCollectorUrl + '/events'),
            i.setRequestHeader('Content-type', 'application/json')
          var n = {
            eventType: 'CHART_RENDERING_ERROR',
            publicKey: this.config.publicKey,
            metadata: {
              events: this.config.events,
              error: e,
              browser: t,
              configKeys: this.config.configKeys
            },
            url: window.location.href
          }
          i.send(JSON.stringify(n)), (this.errorSentToDataCollector = !0)
        }
      }),
      (c.SeatingChart.prototype.onRenderingFailed = function() {
        ;(this.state = 'RENDERING_FAILED'),
          this.showIframe(),
          this.hideLoadingDiv(),
          this.config.onChartRenderingFailed &&
            this.config.onChartRenderingFailed()
      }),
      (c.SeatingChart.prototype.showIframe = function() {
        this.iframe.style.visibility = 'visible'
      }),
      (c.SeatingChart.prototype.hideLoadingDiv = function() {
        this.loadingDiv.style.display = 'none'
      }),
      (c.SeatingChart.prototype.selectBestAvailable = function(e) {
        this.sendMsgToIframe({
          type: 'selectBestAvailable',
          bestAvailableConfig: e
        })
      }),
      (c.SeatingChart.prototype.setUnavailableCategories = function(e) {
        this.sendMsgToIframe({
          type: 'setUnavailableCategories',
          unavailableCategories: e
        })
      }),
      (c.SeatingChart.prototype.changeConfig = function(e) {
        this.sendMsgToIframe({
          type: 'changeConfig',
          config: c.SeatingChart.serializeConfig(e)
        })
      }),
      (c.SeatingChart.prototype.clearSelection = function(e, t) {
        this.asyncRequest({ type: 'clearSelection' }, e, t)
      }),
      (c.SeatingChart.prototype.findObject = function(e, t, i) {
        var n = this
        this.asyncRequest(
          { type: 'findObject', objectUuidOrLabel: e },
          function(e) {
            return t(n.objectFromJson(e))
          },
          i
        )
      }),
      (c.SeatingChart.prototype.listCategories = function(e) {
        this.asyncRequest({ type: 'listCategories' }, e)
      }),
      (c.SeatingChart.prototype.selectObjects = c.SeatingChart.prototype.selectSeats = function(
        e
      ) {
        this.sendMsgToIframe({ type: 'selectObjects', objectUuidsOrLabels: e })
      }),
      (c.SeatingChart.prototype.deselectObjects = c.SeatingChart.prototype.deselectSeats = function(
        e
      ) {
        this.sendMsgToIframe({
          type: 'deselectObjects',
          objectUuidsOrLabels: e
        })
      }),
      (c.SeatingChart.prototype.selectCategories = function(e) {
        this.sendMsgToIframe({ type: 'selectCategories', ids: e })
      }),
      (c.SeatingChart.prototype.highlightObjects = function(e) {
        this.sendMsgToIframe({
          type: 'highlightObjects',
          objectUuidsOrLabels: e
        })
      }),
      (c.SeatingChart.prototype.unhighlightObjects = function(e) {
        this.sendMsgToIframe({
          type: 'unhighlightObjects',
          objectUuidsOrLabels: e
        })
      }),
      (c.SeatingChart.prototype.pulse = function(e) {
        this.sendMsgToIframe({ type: 'pulseObjects', objectUuidsOrLabels: e })
      }),
      (c.SeatingChart.prototype.unpulse = function(e) {
        this.sendMsgToIframe({ type: 'unpulseObjects', objectUuidsOrLabels: e })
      }),
      (c.SeatingChart.prototype.zoomToSelectedObjects = function() {
        this.sendMsgToIframe({ type: 'zoomToSelectedObjects' })
      }),
      (c.SeatingChart.prototype.asyncRequest = function(e, t, i) {
        ;(e.requestId = ++this.requestIdCtr),
          this.sendMsgToIframe(e),
          (this.requestCallbacks[this.requestIdCtr] = t),
          (this.requestErrorCallbacks[this.requestIdCtr] = i)
      }),
      (c.SeatingChart.prototype.asyncCallSuccess = function(e, t) {
        this.requestCallbacks[e] &&
          (this.requestCallbacks[e](t), (this.requestCallbacks[e] = void 0))
      }),
      (c.SeatingChart.prototype.asyncCallError = function(e) {
        this.requestErrorCallbacks[e] &&
          (this.requestErrorCallbacks[e](),
          (this.requestErrorCallbacks[e] = void 0))
      }),
      (c.SeatingChart.serializeConfig = function(e) {
        return (
          e.tooltipText && (e.customTooltipText = !0),
          e.onBestAvailableSelected &&
            (e.onBestAvailableSelectedCallbackImplemented = !0),
          e.onBestAvailableSelectionFailed &&
            (e.onBestAvailableSelectionFailedCallbackImplemented = !0),
          e.objectColor && (e.objectColor = e.objectColor.toString()),
          e.sectionColor && (e.sectionColor = e.sectionColor.toString()),
          e.objectLabel && (e.objectLabel = e.objectLabel.toString()),
          e.objectIcon && (e.objectIcon = e.objectIcon.toString()),
          e.priceFormatter && (e.priceFormatterUsed = !0),
          e.isObjectSelectable &&
            (e.isObjectSelectable = e.isObjectSelectable.toString()),
          e.canGASelectionBeIncreased &&
            (e.canGASelectionBeIncreased = e.canGASelectionBeIncreased.toString()),
          e.isObjectVisible &&
            (e.isObjectVisible = e.isObjectVisible.toString()),
          e.objectCategory && (e.objectCategory = e.objectCategory.toString()),
          e.onObjectStatusChanged &&
            (e.onObjectStatusChangedCallbackImplemented = !0),
          e
        )
      }),
      (c.SeatingChart.prototype.objectFromJson = function(e) {
        var t = this
        return (
          'section' !== e.objectType &&
            ((e.select = function() {
              t.selectObjects([t.uuidOrLabel(e)])
            }),
            (e.deselect = function() {
              t.deselectObjects([t.uuidOrLabel(e)])
            }),
            (e.highlight = function() {
              t.highlightObjects([t.uuidOrLabel(e)])
            }),
            (e.unhighlight = function() {
              t.unhighlightObjects([t.uuidOrLabel(e)])
            }),
            (e.pulse = function() {
              t.pulse([t.uuidOrLabel(e)])
            }),
            (e.unpulse = function() {
              t.unpulse([t.uuidOrLabel(e)])
            }),
            (e.seatId = e.id)),
          (e.chart = this),
          e
        )
      }),
      (c.SeatingChart.prototype.objectsFromJson = function(e) {
        var t = this
        return e.map(function(e) {
          return t.objectFromJson(e)
        })
      }),
      (c.SeatingChart.prototype.rerender = function() {
        this.unrender(), this.render()
      }),
      (c.SeatingChart.prototype.messageHandlers = {
        seatsioLoaded: function(e, t, i) {
          var n = c.SeatingChart.serializeConfig(t.config)
          ;(n.renderingStartMillis = t.renderingStart.getTime()),
            (n.hostPageUrl = window.location.href),
            t.sendMsgToIframe({ type: 'configure', configuration: n })
        },
        onError: function(e, t, i) {
          t.onError(i.message, i.browser)
        },
        configured: function(e, t, i) {
          t.configured()
        },
        onChartRendered: function(e, t, i) {
          t.rendered(i.width, i.height)
        },
        onChartRerendered: function(e, t, i) {
          t.rerendered(i.width, i.height)
        },
        onOrphanSeatsChanged: function(e, t, i) {
          t.config.onOrphanSeatsChanged &&
            t.config.onOrphanSeatsChanged(i.orphans, i.action)
        },
        bookableObjectEvent: function(e, t, i) {
          var n = t.objectFromJson(i.object)
          if ('onObjectSelected' == i.subtype) t.objectSelected(n, i.priceLevel)
          else if ('onObjectDeselected' == i.subtype)
            t.objectDeselected(n, i.priceLevel)
          else if (
            'onObjectStatusChanged' == i.subtype &&
            'RENDERED' !== t.state
          )
            return
          t.config[i.subtype] && t.config[i.subtype](n, i.priceLevel)
        },
        dragStarted: function(e, t) {
          t.smoothener = new c.iOSScrollSmoothener()
        },
        dragScrollOutOfBounds: function(e, t, i) {
          var n = t.smoothener.smoothen(i.amount)
          t.config.onScrolledOutOfBoundsVertically
            ? t.config.onScrolledOutOfBoundsVertically(n)
            : window.scrollBy(0, n)
        },
        holdTokenChanged: function(e, t, i) {
          t.setHoldToken(i.token)
        },
        tooltipTextRequested: function(e, t, i) {
          t.sendMsgToIframe({
            type: 'tooltipTextGenerated',
            text: t.config.tooltipText(t.objectFromJson(i.object))
          })
        },
        onBestAvailableSelected: function(e, t, i) {
          t.config.onBestAvailableSelected &&
            t.config.onBestAvailableSelected(
              t.objectsFromJson(i.result.objects),
              i.result.nextToEachOther
            )
        },
        onBestAvailableSelectionFailed: function(e, t, i) {
          t.config.onBestAvailableSelectionFailed &&
            t.config.onBestAvailableSelectionFailed()
        },
        onHoldSucceeded: function(e, t, i) {
          t.config.onHoldSucceeded &&
            t.config.onHoldSucceeded(t.objectsFromJson(i.objects))
        },
        onHoldFailed: function(e, t, i) {
          t.config.onHoldFailed &&
            t.config.onHoldFailed(t.objectsFromJson(i.objects))
        },
        onReleaseHoldSucceeded: function(e, t, i) {
          t.config.onReleaseHoldSucceeded &&
            t.config.onReleaseHoldSucceeded(t.objectsFromJson(i.objects))
        },
        onReleaseHoldFailed: function(e, t, i) {
          t.config.onReleaseHoldFailed &&
            t.config.onReleaseHoldFailed(t.objectsFromJson(i.objects))
        },
        priceFormattingRequested: function(e, t, i) {
          t.sendMsgToIframe({
            type: 'pricesFormatted',
            formattedPrices: t.formatPrices(i.prices)
          })
        },
        asyncCallSuccess: function(e, t, i) {
          t.asyncCallSuccess(i.requestId, i.data)
        },
        asyncCallError: function(e, t, i) {
          t.asyncCallError(i.requestId)
        },
        tryAgainAfterError: function(e, t) {
          t.rerender()
        }
      }),
      (c.iOSScrollSmoothener = function() {
        this.previousScrollAmount = 0
      }),
      (c.iOSScrollSmoothener.prototype.smoothen = function(e) {
        return c.iOSScrollSmoothener.differentSigns(
          e,
          this.previousScrollAmount
        )
          ? ((this.previousScrollAmount = e), 0)
          : ((this.previousScrollAmount = e), e)
      }),
      (c.iOSScrollSmoothener.differentSigns = function(e, t) {
        return (e < 0 && t > 0) || (e > 0 && t < 0)
      }),
      (c.SeatingChartConfigValidator = function(e) {
        this.config = e
      }),
      (c.SeatingChartConfigValidator.prototype.validate = function() {
        this.config.fitTo &&
          'width' !== this.config.fitTo &&
          'widthAndHeight' !== this.config.fitTo &&
          c.SeatingChartConfigValidator.error(
            'fitTo should be either width or widthAndHeight'
          )
      }),
      (c.SeatingChartConfigValidator.error = function(e) {
        throw new Error('Invalid seats.io config: ' + e)
      }),
      (c.SeatingChartDesigner = function(e) {
        c.charts.push(this),
          (this.chartId = c.CHART_ID++),
          this.init(e),
          (this.isRendered = !1),
          (this.isDestroyed = !1)
      }),
      (c.SeatingChartDesigner.prototype = new c.Embeddable()),
      (c.SeatingChartDesigner.prototype.render = function(e) {
        if (this.isDestroyed)
          throw new Error('Cannot render a chart that has been destroyed')
        return (
          (this.renderedCallback = e),
          this.createLoadingDiv(),
          this.createIframe(this.iframeUrl()),
          (this.iframe.scrolling = 'yes'),
          this
        )
      }),
      (c.SeatingChartDesigner.prototype.iframeUrl = function() {
        return this.config.v2
          ? c.CDNStaticFilesUrl + '/chart-designer-v2/chartDesignerIframe.html'
          : c.CDNStaticFilesUrl + '/chart-designer/chartDesignerIframe.html'
      }),
      (c.SeatingChartDesigner.prototype.rerender = function() {
        ;(this.isRendered = !1), this.iframe.remove(), this.render()
      }),
      (c.SeatingChartDesigner.prototype.serializeConfig = function() {
        var e = JSON.parse(JSON.stringify(this.config))
        return this.config.onExitRequested && (e.showExitButton = !0), e
      }),
      (c.SeatingChartDesigner.prototype.messageHandlers = {
        seatsioLoaded: function(e, t) {
          t.sendMsgToIframe({
            type: 'render',
            configuration: t.serializeConfig(),
            v2Url: c.v2Url,
            CDNUrl: c.CDNUrl
          })
        },
        seatsioRendered: function(e, t) {
          t.container().removeChild(t.loadingDiv),
            (t.iframe.style.visibility = 'visible'),
            t.renderedCallback && t.renderedCallback(),
            t.config.onDesignerRendered && t.config.onDesignerRendered(this),
            (t.isRendered = !0)
        },
        chartCreated: function(e, t, i) {
          ;(t.config.chartKey = i.data),
            t.config.onChartCreated && t.config.onChartCreated(i.data)
        },
        chartUpdated: function(e, t) {
          t.config.onChartUpdated && t.config.onChartUpdated(t.config.chartKey)
        },
        chartPublished: function(e, t) {
          t.config.onChartPublished &&
            t.config.onChartPublished(t.config.chartKey)
        },
        statusChanged: function(e, t, i) {
          if (t.config.onStatusChanged) {
            var n = i.data
            t.config.onStatusChanged(n, t.config.chartKey)
          }
        },
        exitRequested: function(e, t) {
          t.config.onExitRequested()
        }
      }),
      (c.SeatingChartDesigner.prototype.destroy = function() {
        if (this.isDestroyed)
          throw new Error(
            'Cannot destroy a chart that has already been destroyed'
          )
        this.removeIframe(),
          c.removeFromArray(this, c.charts),
          (this.isRendered = !1),
          (this.isDestroyed = !0)
      }),
      (c.SeatsioSessionStorage = function(e) {
        this.chartId = e
      }),
      (c.SeatsioSessionStorage.prototype.fetch = function(e) {
        return this.getStoreForChart()[e]
      }),
      (c.SeatsioSessionStorage.prototype.store = function(e, t) {
        var i = this.getStoreForChart()
        ;(i[e] = t), this.setStoreForChart(i)
      }),
      (c.SeatsioSessionStorage.prototype.getStoreForChart = function() {
        var e = this.getStoreForAllCharts()['chart-' + this.chartId]
        return e || {}
      }),
      (c.SeatsioSessionStorage.prototype.setStoreForChart = function(e) {
        var t = this.getStoreForAllCharts()
        ;(t['chart-' + this.chartId] = e), this.setStoreForAllCharts(t)
      }),
      (c.SeatsioSessionStorage.prototype.getStoreForAllCharts = function() {
        var e = sessionStorage.getItem('seatsio')
        return e ? JSON.parse(e) : {}
      }),
      (c.SeatsioSessionStorage.prototype.setStoreForAllCharts = function(e) {
        sessionStorage.setItem('seatsio', JSON.stringify(e))
      }),
      (c.SeatsioSessionStorage.isSupported = function() {
        try {
          return (
            sessionStorage.setItem('sessionStorageSupportedTest', 'x'),
            sessionStorage.removeItem('sessionStorageSupportedTest'),
            !0
          )
        } catch (e) {
          if ('QuotaExceededError' === e.name || 'SecurityError' === e.name)
            return !1
          throw e
        }
      }),
      (c.SeatsioDummyStorage = function() {}),
      (c.SeatsioDummyStorage.prototype.fetch = function(e) {}),
      (c.SeatsioDummyStorage.prototype.store = function(e, t) {}),
      (c.SeatsioStorage = {}),
      (c.SeatsioStorage.create = function(e) {
        return c.SeatsioSessionStorage.isSupported()
          ? new c.SeatsioSessionStorage(e)
          : (c.warn(
              'Session storage not supported; stored data (e.g. hold token) will be lost after page refresh'
            ),
            new c.SeatsioDummyStorage())
      }),
      Array.prototype.indexOf ||
        (Array.prototype.indexOf = function(e, t) {
          for (var i = t || 0, n = this.length; i < n; i++)
            if (this[i] === e) return i
          return -1
        }),
      (c.removeFromArray = function(e, t) {
        var i = t.indexOf(e)
        i > -1 && t.splice(i, 1)
      }),
      (g.prototype.orElse = function(e) {
        return void 0 === this.val || null == this.val ? e : this.val
      }),
      (c.warn = function(e) {
        'undefined' != typeof console && console.warn(e)
      }),
      (c.error = function(e) {
        'undefined' != typeof console && console.error(e)
      }),
      l('message', function(e) {
        var t = c.getChart(e.source)
        if (t) {
          var i = JSON.parse(e.data)
          t.messageHandlers[i.type] && t.messageHandlers[i.type](e, t, i)
        }
      }),
      l('keydown', p),
      l('keyup', p),
      ((d = document.createElement('link')).href =
        c.CDNStaticFilesUrl + '/chart-js/spinner.css'),
      (d.type = 'text/css'),
      (d.rel = 'stylesheet'),
      document.getElementsByTagName('head')[0].appendChild(d),
      'function' == typeof define &&
      'object' == _typeof(define.amd) &&
      define.amd
        ? define([], function() {
            return c
          })
        : (window.seatsio = c)
  })()
