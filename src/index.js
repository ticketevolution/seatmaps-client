/* @flow */

import React from 'react'
import { h, render } from 'preact' /** @jsx h */
import TicketMap from './ticketmap'
import { COLOR_VARIABLES, LIGHT_THEME, DARK_THEME } from './ticketmap/themes'

(function (factory) {
    // $FlowFixMe
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        window.Seatmap = factory();
    }
}(function () {
    return class Seatmaps {
        static requiredConfigKeys = [
            'venueId',
            'configurationId'
        ];

        static optionalConfigKeys = [
            'containerWidth',
            'theme',
            'isZoneDefault',
            'emptySectionFill',
            'primarySectionFill',
            'cheapSectionFill',
            'expensiveSectionFill',
            'selectedSectionFill',
            'hoverSectionFill',
            'mapFontFamily',
            'showTooltip',
            'selectedSections',
            'onSelection'
        ];

        constructor(options = {}) {
            this.validateOptions(options);
            this.configuration = this.extractConfigurationFromOptions(options);
        }

        extractConfigurationFromOptions(options) {
            return Object.keys(options).reduce((memo, key) => [...Seatmap.requiredConfigKeys, ...Seatmap.optionalConfigKeys].includes(key) ? { ...memo, [key]: options[key] } : memo, {});
        }

        validateOptions(options) {
            for (let key of Seatmap.requiredConfigKeys) {
                if (!options.hasOwnProperty(key)) {
                    throw new Error(`Seatmap configuration requires a '${key}' value.`);
                }
            }
        }

        init(rootElement: Element) {
            if (!rootElement) {
                throw new Error('Seatmaps must be initialized with a DOM element.')
            }
            const props = this.configuration;

            COLOR_VARIABLES.forEach(colorVar => {
                if (!props[colorVar]) {
                    props[colorVar] = props.theme === 'dark' ? DARK_THEME[colorVar] : LIGHT_THEME[colorVar]
                }
            })

            render(<TicketMap {...this.configuration} />, rootElement)
        }
    }
}));