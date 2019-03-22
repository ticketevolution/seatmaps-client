import 'jest-enzyme'

import React from 'react'
import { shallow } from 'enzyme'
import Tooltip, { formatCurrency, defaultDirection } from './index'

describe('Tooltip', () => {
  describe('render()', () => {
    it('renders', () => {
      expect(shallow(<Tooltip />)).toExist()
    })

    it('renders a transparent element when isActive is false', () => {
      expect(
        shallow(<Tooltip isActive={false} />)
      ).toHaveStyle('opacity', 0)
    })

    it('renders an opaque element when isActive is true', () => {
      expect(
        shallow(<Tooltip isActive />)
      ).toHaveStyle('opacity', 1)
    })

    it('renders name', () => {
      expect(
        shallow(<Tooltip name={'example-name'} />)
      ).toIncludeText(
        'example-name'
      )
    })

    it('renders the ticket group price', () => {
      const tooltip = shallow(<Tooltip ticketGroups={[
        { section: '', price: 123.45 }
      ]} />)

      expect(tooltip).toIncludeText(
        formatCurrency(123.45)
      )
    })

    it('renders the lowest ticket group price when the lowest ticket group price is placed first', () => {
      const tooltip = shallow(<Tooltip ticketGroups={[
        { section: '', price: 123.45 },
        { section: '', price: 678.90 }
      ]} />)

      expect(tooltip).toIncludeText(
        formatCurrency(123.45)
      )

      expect(tooltip).not.toIncludeText(
        formatCurrency(678.90)
      )
    })

    it('renders the lowest ticket group price when the lowest ticket group price is not placed first', () => {
      const tooltip = shallow(<Tooltip ticketGroups={[
        { section: '', price: 678.90 },
        { section: '', price: 123.45 }
      ]} />)

      expect(tooltip).toIncludeText(
        formatCurrency(123.45)
      )

      expect(tooltip).not.toIncludeText(
        formatCurrency(678.90)
      )
    })
  })

  describe('direction()', () => {
    it('returns the default direction when the container html element is not mounted', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />).instance()

      tooltip.container = {
        current: null
      }

      expect(
        tooltip.direction()
      ).toEqual(
        defaultDirection
      )
    })

    it('returns the default direction when rendered outside of an html element', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />).instance()

      tooltip.container = {
        current: {
          parentElement: null
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(
        tooltip.direction()
      ).toEqual(
        defaultDirection
      )
    })

    it('returns left when the right side of the container is clipped and the tooltip is at the x origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip x={0} />).instance()

      tooltip.container = {
        current: {
          clientWidth: 10,
          parentElement: {
            clientWidth: 5
          }
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(
        tooltip.direction()[1]
      ).toEqual(
        'left'
      )
    })

    it('returns left when the right side of the container is clipped and the tooltip is not at the x origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip x={1} />).instance()

      tooltip.container = {
        current: {
          clientWidth: 5,
          parentElement: {
            clientWidth: 5
          }
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(
        tooltip.direction()[1]
      ).toEqual(
        'left'
      )
    })

    it('returns down when the top of the container is clipped and the tooltip is at the y origin', () => {
      const tooltip = shallow<Tooltip>(<Tooltip y={0} />).instance()

      tooltip.container = {
        current: {
          clientHeight: 5,
          parentElement: {}
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(
        tooltip.direction()[0]
      ).toEqual(
        'down'
      )
    })
  })

  describe('position()', () => {
    it('returns x=x, y=y by default', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />).instance()

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
      const tooltip = shallow<Tooltip>(<Tooltip />).instance()

      tooltip.container = {
        current: {
          clientWidth: 10
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      tooltip.direction = jest.fn(() => (['up', 'left']))

      expect(
        tooltip.position().x
      ).toEqual(
        tooltip.props.x - tooltip.container.current!.clientWidth // eslint-disable-line @typescript-eslint/no-non-null-assertion
      )
    })

    it('returns y=(y - containerHeight) when container is available and direction is up', () => {
      const tooltip = shallow<Tooltip>(<Tooltip />).instance()

      tooltip.container = {
        current: {
          clientHeight: 10
        }
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      tooltip.direction = jest.fn(() => (['up', 'right']))

      expect(
        tooltip.position().y
      ).toEqual(
        tooltip.props.y - tooltip.container.current!.clientHeight // eslint-disable-line @typescript-eslint/no-non-null-assertion
      )
    })
  })

  describe('tipStyle()', () => {
    it('should return a unique style for each direction', () => {
      const tooltips = Array.from(new Array(4))
        .map(() => shallow<Tooltip>(<Tooltip />).instance())

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
