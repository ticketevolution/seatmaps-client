import React from 'react'
import { shallow, ShallowWrapper } from 'enzyme'

import Tooltip, { Props } from './index'

describe('Tooltip', () => {
  let wrapper: ShallowWrapper<Props>

  beforeEach(() => {
    wrapper = shallow(<Tooltip />)
  })

  it('renders', () => {
    expect(wrapper.exists()).toBe(true)
  })
})
