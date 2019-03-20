import React from 'react'
import { shallow, ShallowWrapper } from 'enzyme'

import Tooltip, { Props } from './index'

describe('Tooltip', () => {
  let wrapper: ShallowWrapper<Props>
  let props: Props

  beforeEach(() => {
    props = {
      isActive: false,
      ticketGroups: [],
      x: 0,
      y: 0,
      name: '',
      color: ''
    }

    wrapper = shallow(<Tooltip {...props} />)
  })

  it('renders', () => {
    expect(wrapper.exists()).toBe(true)
  })
})
