import React from 'react'
import { shallow } from 'enzyme'
import Tooltip, { formatCurrency, defaultDirection } from './index'

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

  it('renders price', () => {
    const tooltip = shallow<Tooltip>(<Tooltip ticketGroups={[
      { section: '', price: 123.45 }
    ]} />)

    expect(tooltip.exists()).toBeTruthy()
    expect(tooltip.text().includes(
      formatCurrency(tooltip.instance().props.ticketGroups[0].price)
    )).toBeTruthy()
  })

  describe('direction()', () => {
    it('returns the default direction when the container html element is not mounted', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />)

      tooltip.instance().container = {
        current: null
      }

      expect(tooltip.instance().direction()).toEqual(defaultDirection)
    })

    it('returns the default direction when rendered outside of an html element', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />)

      tooltip.instance().container = {
        current: {
          parentElement: null
        }
      } as any

      expect(tooltip.instance().direction()).toEqual(defaultDirection)
    })

    it('returns left when the right side of the container is clipped and the tooltip is at the x origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip x={0}/>)

      tooltip.instance().container = {
        current: {
          clientWidth: 10,
          parentElement: {
            clientWidth: 5
          }
        }
      } as any

      expect(tooltip.instance().direction()[1]).toEqual('left')
    })

    it('returns left when the right side of the container is clipped and the tooltip is not at the x origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip x={1}/>)

      tooltip.instance().container = {
        current: {
          clientWidth: 5,
          parentElement: {
            clientWidth: 5
          }
        }
      } as any

      expect(tooltip.instance().direction()[1]).toEqual('left')
    })

    it('returns down when the top of the container is clipped and the tooltip is at the y origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip y={0}/>)

      tooltip.instance().container = {
        current: {
          clientHeight: 5,
          parentElement: {}
        }
      } as any

      expect(tooltip.instance().direction()[0]).toEqual('down')
    })
  })
})
