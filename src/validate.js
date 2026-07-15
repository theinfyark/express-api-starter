import { AppError } from './errors.js';

/**
 * @typedef {'string' | 'number' | 'boolean' | 'email' | 'array' | 'object'} FieldType
 */

/**
 * @typedef {object} FieldRule
 * @property {FieldType} [type]
 * @property {boolean} [required]
 * @property {number} [min]
 * @property {number} [max]
 * @property {RegExp | string} [pattern]
 * @property {unknown[]} [enum]
 * @property {(value: unknown, body: Record<string, unknown>) => string | null | undefined} [validate]
 */

/**
 * @param {unknown} value
 * @param {FieldRule} rule
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @returns {string[]}
 */
function validateValue(value, rule, path, body) {
  /** @type {string[]} */
  const issues = [];
  const required = rule.required !== false;

  if (value === undefined || value === null || value === '') {
    if (required) issues.push(`${path} is required`);
    return issues;
  }

  if (rule.type === 'string' && typeof value !== 'string') {
    issues.push(`${path} must be a string`);
  }
  if (rule.type === 'number' && typeof value !== 'number') {
    issues.push(`${path} must be a number`);
  }
  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    issues.push(`${path} must be a boolean`);
  }
  if (rule.type === 'array' && !Array.isArray(value)) {
    issues.push(`${path} must be an array`);
  }
  if (
    rule.type === 'object' &&
    (typeof value !== 'object' || value === null || Array.isArray(value))
  ) {
    issues.push(`${path} must be an object`);
  }
  if (rule.type === 'email') {
    if (
      typeof value !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      issues.push(`${path} must be a valid email`);
    }
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    Array.isArray(value)
  ) {
    const size =
      typeof value === 'number'
        ? value
        : /** @type {string | unknown[]} */ (value).length;
    if (rule.min !== undefined && size < rule.min) {
      issues.push(`${path} must be >= ${rule.min}`);
    }
    if (rule.max !== undefined && size > rule.max) {
      issues.push(`${path} must be <= ${rule.max}`);
    }
  }

  if (rule.pattern) {
    const re =
      typeof rule.pattern === 'string'
        ? new RegExp(rule.pattern)
        : rule.pattern;
    if (typeof value !== 'string' || !re.test(value)) {
      issues.push(`${path} is invalid`);
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    issues.push(`${path} must be one of: ${rule.enum.join(', ')}`);
  }

  if (typeof rule.validate === 'function') {
    const custom = rule.validate(value, body);
    if (custom) issues.push(custom);
  }

  return issues;
}

/**
 * Body/query/params validation middleware.
 *
 * @param {Record<string, FieldRule>} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 * @returns {import('express').RequestHandler}
 *
 * @example
 * app.post('/users', validate({
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 18 },
 * }), handler)
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const data = /** @type {Record<string, unknown>} */ (req[source] ?? {});
    /** @type {string[]} */
    const issues = [];

    for (const [key, rule] of Object.entries(schema)) {
      issues.push(...validateValue(data[key], rule, key, data));
    }

    if (issues.length > 0) {
      return next(new AppError('Validation failed', 400, issues));
    }
    return next();
  };
}
