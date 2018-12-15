// import TicketMap from './index';

// describe('getSectionColor', () => {
//     let context;
//     let getSectionColor;

//     beforeEach(() => {
//         context = {
//             props: {
//                 venueId: '896',
//                 configurationId: '14341',
//             }
//         };
//         console.log(TicketMap);
//         getSectionColor = TicketMap.getSectionColor.bind(context);
//     });

//     it('returns the color associated with the closest ascending percentile', () => {
//         expect(getSectionColor(10)).toBe('red');
//         expect(getSectionColor(12)).toBe('red');
//         expect(getSectionColor(30)).toBe('red');
//         expect(getSectionColor(35)).toBe('blue');
//         expect(getSectionColor(54)).toBe('blue');
//         expect(getSectionColor(56)).toBe('green');
//         expect(getSectionColor(77)).toBe('green');
//         expect(getSectionColor(78)).toBe('yellow');
//         expect(getSectionColor(100)).toBe('yellow');
//     });

//     it('can handle any number of sectionPercentile keys', () => {
//         delete context.props.sectionPercentiles[0.75];
//         expect(getSectionColor(10)).toBe('red');
//         expect(getSectionColor(12)).toBe('red');
//         expect(getSectionColor(30)).toBe('red');
//         expect(getSectionColor(35)).toBe('blue');
//         expect(getSectionColor(54)).toBe('blue');
//         expect(getSectionColor(56)).toBe('yellow');
//         expect(getSectionColor(77)).toBe('yellow');
//         expect(getSectionColor(78)).toBe('yellow');
//         expect(getSectionColor(100)).toBe('yellow');
//     });
// });
