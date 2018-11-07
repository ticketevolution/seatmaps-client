import { getSectionColor } from './themes';

describe('getSectionColor', () => {
    let context;

    beforeEach(() => {
        context = {
            state: {
                lowerPriceBound: 10,
                upperPriceBound: 100
            },
            props: {
                sectionPercentiles: {
                    0.25: 'red',
                    0.5: 'blue',
                    0.75: 'green',
                    1: 'yellow'
                }
            }
        }
    });

    it('returns the color associated with the closest ascending percentile', () => {
        expect(getSectionColor.call(context, 10)).toBe('red');
        expect(getSectionColor.call(context, 12)).toBe('red');
        expect(getSectionColor.call(context, 30)).toBe('red');
        expect(getSectionColor.call(context, 35)).toBe('blue');
        expect(getSectionColor.call(context, 54)).toBe('blue');
        expect(getSectionColor.call(context, 56)).toBe('green');
        expect(getSectionColor.call(context, 77)).toBe('green');
        expect(getSectionColor.call(context, 78)).toBe('yellow');
        expect(getSectionColor.call(context, 100)).toBe('yellow');
    });

    it('can handle any number of sectionPercentile keys', () => {
        delete context.props.sectionPercentiles[0.75];
        expect(getSectionColor.call(context, 10)).toBe('red');
        expect(getSectionColor.call(context, 12)).toBe('red');
        expect(getSectionColor.call(context, 30)).toBe('red');
        expect(getSectionColor.call(context, 35)).toBe('blue');
        expect(getSectionColor.call(context, 54)).toBe('blue');
        expect(getSectionColor.call(context, 56)).toBe('yellow');
        expect(getSectionColor.call(context, 77)).toBe('yellow');
        expect(getSectionColor.call(context, 78)).toBe('yellow');
        expect(getSectionColor.call(context, 100)).toBe('yellow');
    });
});