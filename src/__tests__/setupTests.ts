import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { GlobalWithFetchMock } from 'jest-fetch-mock'

const customGlobal: GlobalWithFetchMock = global as unknown as GlobalWithFetchMock
customGlobal.fetch = require('jest-fetch-mock')
customGlobal.fetchMock = customGlobal.fetch

configure({ adapter: new Adapter() })
