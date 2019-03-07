import SeatmapFactory from './index'

describe('SeatmapFactory', () => {
  describe('build', () => {
    it('exists', () => {
      expect(typeof SeatmapFactory.prototype.build).toBe('function')
    })
  })
})
