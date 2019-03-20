import React from 'react'
import { shallow } from 'enzyme'
import Tooltip from './index'

describe('Tooltip', () => {
  it('renders', () => {
    expect(shallow(<Tooltip />).exists()).toBe(true)
  })

  it('renders a transparent element when isActive is false', () => {
    const tooltip = shallow(<Tooltip isActive={false} />)

    expect(tooltip.exists()).toBeTruthy()
    expect(tooltip.getElement().props.style.opacity).toEqual(0)
  })

  it('renders an opaque element when isActive is true', () => {
    const tooltip = shallow(<Tooltip isActive />)

    expect(tooltip.exists()).toBeTruthy()
    expect(tooltip.getElement().props.style.opacity).toEqual(1)
  })

  it('renders name', () => {
    const tooltip = shallow<Tooltip>(<Tooltip name={'example-name'} />)

    expect(tooltip.exists()).toBeTruthy()
    expect(tooltip.text().includes(tooltip.instance().props.name)).toBeTruthy()
  })
})
