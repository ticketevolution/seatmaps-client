import React from 'react'
import { shallow, ShallowWrapper } from 'enzyme'

import Legend, { Props, Range } from './index'
import Button from '../Button'
import Swatch from './swatch'

describe('Legend', () => {
  let wrapper: ShallowWrapper<Props>
  let props: Props
  let rangeMock: Range

  beforeEach(() => {
    rangeMock = {
      color: '#c00',
      min: 0,
      max: 10
    }
    props = {
      ranges: []
    }
    wrapper = shallow(<Legend {...props} />)
  })

  it('renders a button', () => {
    expect(wrapper.find(Button)).toHaveLength(1)
  })

  describe('Button', () => {
    it('toggles the dropdown open/closed', () => {
      wrapper.setState({ isOpen: false })
      wrapper.find(Button).simulate('click')
      expect(wrapper.state('isOpen')).toBe(true)
    })
  })

  describe('Dropdown', () => {
    it('is closed by default', () => {
      expect(wrapper.children().filterWhere(node => node.type() !== Button)).toHaveLength(0)
    })

    it('does not render if there are no ranges', () => {
      wrapper.setProps({ ranges: [] })
      wrapper.setState({ isOpen: true })
      expect(wrapper.children().filterWhere(node => node.type() !== Button)).toHaveLength(0)
    })

    it('does not render if the legend is not open', () => {
      wrapper.setProps({ ranges: [ rangeMock ] })
      wrapper.setState({ isOpen: false })
      expect(wrapper.children().filterWhere(node => node.type() !== Button)).toHaveLength(0)
    })

    it('renders if there are ranges and the legend is open', () => {
      wrapper.setProps({ ranges: [ rangeMock ] })
      wrapper.setState({ isOpen: true })
      expect(wrapper.children().filterWhere(node => node.type() !== Button)).toHaveLength(1)
    })

    it('renders a swatch for each range', () => {
      wrapper.setProps({ ranges: [ rangeMock ] })
      wrapper.setState({ isOpen: true })
      expect(wrapper.find(Swatch)).toHaveLength(1)
      expect(wrapper.find(Swatch).prop('color')).toBe(rangeMock.color)
    })
  })
})
