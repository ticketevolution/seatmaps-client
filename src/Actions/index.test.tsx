import 'jest-enzyme'

import React from 'react'
import { mount, ReactWrapper } from 'enzyme'

import Actions, { Props } from './index'
import ActionGroup from './ActionGroup'
import Button from '../Button'
import Legend from '../Legend'

const zoomIn = jest.fn()
const zoomOut = jest.fn()
const reset = jest.fn()

jest.mock('svg-pan-zoom/src/svg-pan-zoom.js', () => jest.fn(() => ({ zoomIn, zoomOut, reset })))

describe('Actions', () => {
  let wrapper: ReactWrapper<Props>
  let props: Props

  beforeEach(() => {
    props = {
      mapSvg: <svg /> as unknown as SVGSVGElement,
      ranges: [],
      onClearSelection: jest.fn()
    }
    wrapper = mount(<Actions {...props} />)
  })

  it('renders', () => {
    expect(wrapper).toExist()
  })

  it('renders all in the same action group on small screens', () => {
    wrapper.setState({ isMobile: true })
    const actionGroup = wrapper.find(ActionGroup)
    expect(actionGroup).toHaveLength(1)
    expect(actionGroup.at(0).find(Button)).toHaveLength(5)
  })

  it('renders the legend in a separate action group on large screens', () => {
    wrapper.setProps({ showLegend: true })
    wrapper.setState({ isMobile: false })
    const actionGroup = wrapper.find(ActionGroup)
    expect(actionGroup).toHaveLength(2)
    expect(actionGroup.at(1).find(Legend)).toHaveLength(1)
  })

  it('renders a button to zoom in', () => {
    wrapper.find(Button).forEach(button => button.simulate('click'))
    expect(zoomIn).toHaveBeenCalled()
  })

  it('renders a button to zoom out', () => {
    wrapper.find(Button).forEach(button => button.simulate('click'))
    expect(zoomOut).toHaveBeenCalled()
  })

  it('renders a button to reset', () => {
    wrapper.find(Button).forEach(button => button.simulate('click'))
    expect(reset).toHaveBeenCalled()
  })

  it('renders a button to clear selections', () => {
    wrapper.find(Button).forEach(button => button.simulate('click'))
    expect(props.onClearSelection).toHaveBeenCalled()
  })
})
