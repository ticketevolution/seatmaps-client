import React from 'react'
import { shallow } from 'enzyme'
import Tooltip, { formatCurrency, defaultDirection } from './index'

describe('Tooltip', () => {
  describe('render()', () => {
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

    it('renders the ticket group price', () => {
      const tooltip = shallow<Tooltip>(<Tooltip ticketGroups={[
        { section: '', price: 123.45 }
      ]} />)

      expect(tooltip.exists()).toBeTruthy()
      expect(tooltip.text().includes(
        formatCurrency(tooltip.instance().props.ticketGroups[0].price)
      )).toBeTruthy()
    })

    it('renders the lowest ticket group price when the lowest ticket group price is placed first', () => {
      const tooltip = shallow<Tooltip>(<Tooltip ticketGroups={[
        { section: '', price: 123.45 },
        { section: '', price: 678.90 }
      ]} />)

      expect(tooltip.exists()).toBeTruthy()
      expect(tooltip.text().includes(
        formatCurrency(123.45)
      )).toBeTruthy()
    })

    it('renders the lowest ticket group price when the lowest ticket group price is not placed first', () => {
      const tooltip = shallow<Tooltip>(<Tooltip ticketGroups={[
        { section: '', price: 678.90 },
        { section: '', price: 123.45 }
      ]} />)

      expect(tooltip.exists()).toBeTruthy()
      expect(tooltip.text().includes(
        formatCurrency(123.45)
      )).toBeTruthy()
    })
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

  describe('position()', () => {
    it('returns x=x, y=y by default', () => {
      const tooltip = shallow<Tooltip>(<Tooltip/>).instance()

      expect(
        tooltip.position().x
      ).toEqual(
        tooltip.props.x
      )

      expect(
        tooltip.position().y
      ).toEqual(
        tooltip.props.y
      )
    })

    it('returns x=(x - containerWidth) when container is available and direction is left', () => {
      const tooltip = shallow<Tooltip>(<Tooltip/>).instance()

      tooltip.container = {
        current: {
          clientWidth: 10
        }
      } as any

      tooltip.direction = jest.fn(() => (['up', 'left']))

      expect(
        tooltip.position().x
      ).toEqual(
        tooltip.props.x - tooltip.container.current!.clientWidth
      )
    })

    it('returns y=(y - containerHeight) when container is available and direction is up', () => {
      const tooltip = shallow<Tooltip>(<Tooltip/>).instance()

      tooltip.container = {
        current: {
          clientHeight: 10
        }
      } as any

      tooltip.direction = jest.fn(() => (['up', 'right']))

      expect(
        tooltip.position().y
      ).toEqual(
        tooltip.props.y - tooltip.container.current!.clientHeight
      )
    })
  })

  describe('tipStyle()', () => {
    it('should return a unique style for each direction', () => {
      const tooltips = Array.from(new Array(4))
        .map(() => shallow<Tooltip>(<Tooltip/>).instance())

      tooltips[0].direction = jest.fn(() => (['up', 'left']))
      tooltips[1].direction = jest.fn(() => (['up', 'right']))
      tooltips[2].direction = jest.fn(() => (['down', 'left']))
      tooltips[3].direction = jest.fn(() => (['down', 'right']))

      const tipStyles = tooltips.map(tooltip => tooltip.tipStyle())
      const uniqueTipStyles = Array.from(new Set(tipStyles))

      expect(
        uniqueTipStyles.length
      ).toEqual(
        tipStyles.length
      )
    })
  })
})
