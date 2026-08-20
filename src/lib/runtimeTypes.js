// Runtime guards for values returned by Base44 integrations and browser APIs.
// External data remains unknown until it passes one of these checks.

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** @param {unknown} value @param {string} [context='External response'] @returns {Record<string, unknown>} */
export const requireRecord = (value, context = 'External response') => {
  if (!isRecord(value)) throw new TypeError(`${context} must be an object`);
  return value;
};

/** @param {unknown} value @param {string} [fallback=''] */
export const stringValue = (value, fallback = '') => typeof value === 'string' ? value : fallback;

/** @param {unknown} value @param {number} [fallback=0] */
export const numberValue = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** @template T @param {unknown} value @param {(item: unknown) => item is T} guard @returns {T[]} */
export const arrayOf = (value, guard) => Array.isArray(value) ? value.filter(guard) : [];

/** @param {unknown} value @returns {value is string} */
export const isString = (value) => typeof value === 'string';

/** @param {unknown} value @returns {Record<string, unknown>[]} */
export const recordArray = (value) => arrayOf(value, isRecord);
