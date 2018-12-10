/* @flow */

import { h, render } from 'preact' /** @jsx h */
import TicketMap from './ticketmap'

export default class SeatmapFactory {
    configuration: any;

    static requiredConfigKeys = [
        'venueId',
        'configurationId'
    ];

    static optionalConfigKeys = [
        'isZoneDefault',
        'mapFontFamily',
        'selectedSections',
        'onSelection',
        'ticketGroups',
        'sectionPercentiles',
        'mapsDomain'
    ];

    constructor(options = {}) {
        this.validateOptions(options);
        this.configuration = this.extractConfigurationFromOptions(options);
    }

    extractConfigurationFromOptions(options) {
        return Object.keys(options).reduce((memo, key) => [...SeatmapFactory.requiredConfigKeys, ...SeatmapFactory.optionalConfigKeys].includes(key) ? { ...memo, [key]: options[key] } : memo, {});
    }

    validateOptions(options) {
        for (let key of SeatmapFactory.requiredConfigKeys) {
            if (!options.hasOwnProperty(key)) {
                throw new Error(`Seatmap configuration requires a '${key}' value.`);
            }
        }
    }

    build(rootElementId: string) {
        if (!rootElementId) {
            throw new Error('Seatmaps must be initialized with a DOM element.')
        }

        const rootElement = document.getElementById(rootElementId);
        if (!rootElement) {
            throw new Error('Seatmaps must be initialized with a DOM element.')
        }

        let componentRef;
        render(<TicketMap {...this.configuration} ref={component => componentRef = component} />, rootElement);

        return componentRef.publicApi;
    }
}
