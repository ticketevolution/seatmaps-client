import Adapter from 'enzyme-adapter-react-16'
import { ShallowWrapper } from 'enzyme'
const Enzyme = require('enzyme')

ShallowWrapper.prototype.instance = function () {
  if (this.root !== this) {
    throw new Error('ShallowWrapper::instance() can only be called on the root')
  }
  return this.renderer._instance ? this.renderer._instance : null
}

Enzyme.configure({ adapter: new Adapter() })
