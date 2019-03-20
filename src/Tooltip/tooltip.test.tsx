import React from 'react'
import { shallow } from 'enzyme'
import Tooltip from './index'

describe('Tooltip', () => {
  it('renders', () => {
    expect(shallow(<Tooltip />).exists()).toBe(true)
  })
})
