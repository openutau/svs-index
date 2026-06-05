// Shared Software-validity module.
//
// Single source of truth for "what is a valid Software entry", used by:
//   - the CI submission pipeline (scripts/process-issue.js), and
//   - the pull-request data validator (scripts/validate-data.js).
//
// Mirrors shared/singer-validation.js. Plain ESM JavaScript on purpose: the
// scripts run uncompiled via `node`, so a shared `.ts` would not be importable
// without giving them a build step.
//
// The schema (data/software-schema.json) carries every rule it can express. The
// only rule it cannot — id uniqueness — lives in the rule layer below. Uniqueness
// is environment-bound, so it is injected rather than read here.
//
// Unlike singers, software tags are NOT subjected to a length/whitelist rule:
// software has always stayed on the direct-schema path, and tags such as
// "synthesizer-v" / "diffsinger" are expected to pass.

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../data/software-schema.json' with { type: 'json' };

/**
 * @typedef {object} ValidationError
 * @property {string} path   Dot path to the offending value (e.g. "versions.0.mirrors.0.hash").
 * @property {string} code   Stable machine code; adapters map it to a message.
 * @property {object} [params] Extra context for formatting (id, …).
 */

// The file schema is an array; a single Software is validated against its items.
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema.items);

/** Convert an Ajv instancePath ("/versions/0/mirrors/0/hash") to a dot path. */
function toDotPath(instancePath, params) {
  const base = (instancePath || '')
    .replace(/^\//, '')
    .replace(/\//g, '.')
    .trim();
  if (params && params.missingProperty) {
    return (base ? base + '.' : '') + params.missingProperty;
  }
  return base || '<root>';
}

/**
 * Validate a (possibly partial) Software entry.
 *
 * @param {Record<string, any>} software
 * @param {{ existingIds?: Set<string> }} [ctx]
 * @returns {ValidationError[]} Empty array means valid.
 */
export function validateSoftware(software, ctx = {}) {
  const errors = [];
  const obj = software || {};

  // 1. Schema pass — everything the JSON Schema can express.
  if (!validateSchema(obj)) {
    for (const err of validateSchema.errors || []) {
      errors.push({
        path: toDotPath(err.instancePath, err.params),
        code: `schema.${err.keyword}`,
        params: { ...err.params, message: err.message },
      });
    }
  }

  // 2. Uniqueness — the id must not already be published.
  const id = typeof obj.id === 'string' ? obj.id : '';
  if (id && ctx.existingIds?.has(id)) {
    errors.push({
      path: 'id',
      code: 'software.id.exists',
      params: { id },
    });
  }

  return errors;
}
