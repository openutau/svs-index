import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSoftware } from './software-validation.js';

/** A Software entry that satisfies every rule. Each test mutates a clone. */
function validSoftware() {
  return {
    id: 'test-software',
    names: { en: 'Test Software' },
    category: 'host_extension',
    developers: ['Dev'],
    homepage_url: 'https://example.com',
    download_page_url: null,
    tags: ['oudep'],
    versions: [
      {
        version: '1.0',
        mirrors: [
          {
            url: 'https://example.com/thing_v1.0.oudep',
            hash: 'sha256:abc',
          },
        ],
      },
    ],
  };
}

const codes = (errors) => errors.map((e) => e.code);
const hasCode = (errors, code) => codes(errors).includes(code);

test('a fully valid Software produces no errors', () => {
  assert.deepEqual(validateSoftware(validSoftware()), []);
});

test('missing id is a schema.required error', () => {
  const s = validSoftware();
  delete s.id;
  const errors = validateSoftware(s);
  assert.ok(errors.some((e) => e.code === 'schema.required' && e.path === 'id'));
});

test('missing names.en is a schema.required error on names.en', () => {
  const s = validSoftware();
  s.names = {};
  const errors = validateSoftware(s);
  assert.ok(errors.some((e) => e.code === 'schema.required' && e.path === 'names.en'));
});

test('an unknown category is a schema.enum error', () => {
  const s = validSoftware();
  s.category = 'not-a-category';
  const errors = validateSoftware(s);
  assert.ok(errors.some((e) => e.code === 'schema.enum' && e.path === 'category'));
});

test('vocoder is an accepted category', () => {
  const s = validSoftware();
  s.category = 'vocoder';
  assert.deepEqual(validateSoftware(s), []);
});

test('the relaxed id pattern accepts underscores and dots', () => {
  const s = validSoftware();
  s.id = 'pc_nsf_hifigan_44.1k_hop512_128bin_2025.02';
  assert.deepEqual(validateSoftware(s), []);
});

test('an uppercase id is a schema.pattern error', () => {
  const s = validSoftware();
  s.id = 'Test-Software';
  const errors = validateSoftware(s);
  assert.ok(errors.some((e) => e.code === 'schema.pattern' && e.path === 'id'));
});

test('a version mirror without a hash is a schema.required error', () => {
  const s = validSoftware();
  delete s.versions[0].mirrors[0].hash;
  const errors = validateSoftware(s);
  assert.ok(hasCode(errors, 'schema.required'));
  assert.ok(errors.some((e) => e.path === 'versions.0.mirrors.0.hash'));
});

test('uniqueness fires only when the id is already published', () => {
  const s = validSoftware();
  assert.ok(!hasCode(validateSoftware(s, { existingIds: new Set(['other']) }), 'software.id.exists'));
  assert.ok(hasCode(validateSoftware(s, { existingIds: new Set(['test-software']) }), 'software.id.exists'));
});
