/**
 * @module ol/has
 */

const ua = typeof navigator !== 'undefined' ?
  navigator.userAgent.toLowerCase() : '';

/**
 * User agent string says we are dealing with Firefox as browser.
 * @type {boolean}
 */
export const FIREFOX = ua.indexOf('firefox') !== -1;

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
export const SAFARI = ua.indexOf('safari') !== -1 && ua.indexOf('chrom') == -1;

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
export const WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
export const MAC = ua.indexOf('macintosh') !== -1;

export {HAS as WEBGL} from './webgl.js';
