import 'regenerator-runtime/runtime'
import chai from 'chai'
import assertJsx, { options } from 'preact-jsx-chai'
global.window._ticketEvolution = {
  configurationId: '110_8888881',
  containerId: 'root',
  containerWidth: '700',
  theme: 'dark',
  isZoneDefault: true,
  emptySectionFill: '',
  primarySectionFill: '',
  cheapSectionFill: '',
  expensiveSectionFill: '',
  selectedSectionFill: '',
  hoverSectionFill: '',
  mapFontFamily: 'courier',
  showTooltip: true,
  selectedSections: [],
  onSelection: function(sectionsSelected) {
    console.log('sections selected: ', sectionsSelected)
  },
}

// when checking VDOM assertions, don't compare functions, just nodes and attributes:
options.functions = false

// activate the JSX assertion extension:
chai.use(assertJsx)

global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
