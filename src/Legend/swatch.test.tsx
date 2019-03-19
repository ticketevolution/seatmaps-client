import React from 'react'
import { shallow, ShallowWrapper } from 'enzyme'

import Swatch, { Props } from './swatch'

describe('Swatch', () => {
  let wrapper: ShallowWrapper<Props>
  let props: Props

  beforeEach(() => {
    props = {
      color: '#c00'
    }
    wrapper = shallow(<Swatch {...props} />)
  })

  it('renders without a style prop', () => {
    expect(wrapper.exists()).toBe(true)
  })
})
