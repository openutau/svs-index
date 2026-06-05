// Shared Singer-validity module.
//
// Single source of truth for "what is a valid Singer", used by two adapters:
//   - the browser editor (src/submit.ts), and
//   - the CI submission pipeline (scripts/process-issue.js).
//
// Plain ESM JavaScript on purpose: the scripts run uncompiled via `node`, so a
// shared `.ts` would not be importable without giving them a build step. Vite
// bundles this file for the browser; Node imports it directly.
//
// The schema (data/singer-schema.json) carries every rule it can express. The
// rules it cannot — cross-field constraints, the external tag whitelist, and id
// uniqueness — live in the rule layer below. Uniqueness and the whitelist are
// environment-bound, so they are injected rather than read here.

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../data/singer-schema.json' with { type: 'json' };

/**
 * @typedef {import('../src/types').Singer} Singer
 *
 * @typedef {object} ValidationError
 * @property {string} path   Dot path to the offending value (e.g. "variants.0.id").
 * @property {string} code   Stable machine code; adapters map it to a message.
 * @property {object} [params] Extra context for formatting (index, id, tag, …).
 */

// The file schema is an array; a single Singer is validated against its items.
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema.items);

/** Convert an Ajv instancePath ("/variants/0/id") to a dot path ("variants.0.id"). */
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

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG_MAX_LENGTH = 16;

/**
 * Validate a (possibly partial) Singer.
 *
 * @param {Singer | Record<string, any>} singer
 * @param {{ existingIds?: Set<string>, tagWhitelist?: Set<string> }} [ctx]
 * @returns {ValidationError[]} Empty array means valid.
 */
export function validateSinger(singer, ctx = {}) {
  const errors = [];
  const obj = singer || {};

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

  // 2. Cross-field rules the schema cannot express.
  const singerId = typeof obj.id === 'string' ? obj.id : '';
  const variants = Array.isArray(obj.variants) ? obj.variants : [];
  const seenVariantIds = new Set();

  variants.forEach((variant, index) => {
    const v = variant || {};
    const vid = typeof v.id === 'string' ? v.id : '';

    // Variant id must start with the singer id prefix.
    if (singerId && ID_PATTERN.test(singerId) && vid && !vid.startsWith(singerId + '-')) {
      errors.push({
        path: `variants.${index}.id`,
        code: 'variant.id.prefix',
        params: { index, singerId },
      });
    }

    // Variant ids must be unique within the Singer.
    if (vid) {
      if (seenVariantIds.has(vid)) {
        errors.push({
          path: `variants.${index}.id`,
          code: 'variant.id.duplicate',
          params: { index, id: vid },
        });
      }
      seenVariantIds.add(vid);
    }

    // Tags over the length limit must be whitelisted.
    if (Array.isArray(v.tags)) {
      v.tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.length > TAG_MAX_LENGTH && !ctx.tagWhitelist?.has(tag)) {
          errors.push({
            path: `variants.${index}.tags`,
            code: 'tag.tooLong',
            params: { index, tag, max: TAG_MAX_LENGTH },
          });
        }
      });
    }
  });

  // 3. Uniqueness — the id must not already be published.
  if (singerId && ctx.existingIds?.has(singerId)) {
    errors.push({
      path: 'id',
      code: 'singer.id.exists',
      params: { id: singerId },
    });
  }

  return errors;
}
