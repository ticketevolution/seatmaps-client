import { h, render } from 'preact' /** @jsx h */
import { expect } from 'chai'

import Seatmap from '../index'

describe('Seatmap', () => {
  let scratch

  beforeAll(() => {
    scratch = document.createElement('div')
    ;(document.body || document.documentElement).appendChild(scratch)
  })

  beforeEach(() => {
    scratch.innerHTML = ''
  })

  afterAll(() => {
    scratch.parentNode.removeChild(scratch)
    scratch = null
  })

  describe('Controls', () => {
    it('should render the Section/Zone Toggle', () => {
      render(<Seatmap />, scratch)

      expect(scratch.innerHTML).to.contain('Section')
      expect(scratch.innerHTML).to.contain('Zone')
      expect(scratch.innerHTML).to.contain('id="sectionZone"')
    })

    it('should render the mapRoot', () => {
      render(<Seatmap />, scratch)

      expect(scratch.innerHTML).to.contain('id="mapRoot"')
    })
  })
})
