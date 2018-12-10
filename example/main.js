import '@babel/polyfill'
import Tevomaps from '../lib/index'

window.addEventListener('load', function () {
  new Tevomaps({
    venueId: '896',
    configurationId: '14341',
    mapFontFamily: 'Open Sans',
    onSelection: sections => console.log('sections selected: ', sections)
  }).build('root');
});