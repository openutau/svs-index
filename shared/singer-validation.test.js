import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSinger } from './singer-validation.js';

/** A Singer that satisfies every rule. Each test mutates a clone. */
function validSinger() {
  return {
    id: 'test-singer',
    names: { en: 'Test Singer' },
    owners: ['Owner'],
    authors: ['Author'],
    variants: [
      {
        id: 'test-singer-v1',
        names: { en: 'Variant 1' },
        file_url: 'https://example.com/v1.zip',
        download_page_url: null,
      },
    ],
  };
}

const codes = (errors) => errors.map((e) => e.code);
const hasCode = (errors, code) => codes(errors).includes(code);

test('a fully valid Singer produces no errors', () => {
  assert.deepEqual(validateSinger(validSinger()), []);
});

test('missing id is a schema.required error', () => {
  const s = validSinger();
  delete s.id;
  const errors = validateSinger(s);
  assert.ok(hasCode(errors, 'schema.required'));
  assert.ok(errors.some((e) => e.path === 'id'));
});

test('id shorter than 5 chars is a schema.minLength error', () => {
  const s = validSinger();
  s.id = 'ab';
  // variant prefix would also fail; assert the id-length error specifically.
  const errors = validateSinger(s).filter((e) => e.path === 'id');
  assert.ok(hasCode(errors, 'schema.minLength'));
});

test('missing names.en is a schema.required error on names.en', () => {
  const s = validSinger();
  s.names = {};
  const errors = validateSinger(s);
  assert.ok(errors.some((e) => e.code === 'schema.required' && e.path === 'names.en'));
});

test('empty owners and authors are schema.minItems errors', () => {
  const s = validSinger();
  s.owners = [];
  s.authors = [];
  const errors = validateSinger(s);
  assert.ok(errors.some((e) => e.code === 'schema.minItems' && e.path === 'owners'));
  assert.ok(errors.some((e) => e.code === 'schema.minItems' && e.path === 'authors'));
});

test('variant id must start with the singer id prefix', () => {
  const s = validSinger();
  s.variants[0].id = 'wrong-prefix-v1';
  const errors = validateSinger(s);
  assert.ok(hasCode(errors, 'variant.id.prefix'));
  const err = errors.find((e) => e.code === 'variant.id.prefix');
  assert.equal(err.params.singerId, 'test-singer');
});

test('variant needs at least one non-null url', () => {
  const s = validSinger();
  s.variants[0].file_url = null;
  s.variants[0].download_page_url = null;
  assert.ok(hasCode(validateSinger(s), 'variant.url.required'));
});

test('duplicate variant ids are rejected', () => {
  const s = validSinger();
  s.variants.push({ ...s.variants[0] });
  assert.ok(hasCode(validateSinger(s), 'variant.id.duplicate'));
});

test('a long tag fails unless whitelisted', () => {
  const s = validSinger();
  s.variants[0].tags = ['synthesizer-v'];
  assert.ok(hasCode(validateSinger(s), 'tag.tooLong'));

  const whitelisted = validateSinger(s, {
    tagWhitelist: new Set(['synthesizer-v']),
  });
  assert.ok(!hasCode(whitelisted, 'tag.tooLong'));
});

test('a short tag is always allowed', () => {
  const s = validSinger();
  s.variants[0].tags = ['vocaloid'];
  assert.ok(!hasCode(validateSinger(s), 'tag.tooLong'));
});

test('uniqueness fires only when the id is already published', () => {
  const s = validSinger();
  assert.ok(!hasCode(validateSinger(s, { existingIds: new Set(['other']) }), 'singer.id.exists'));
  assert.ok(hasCode(validateSinger(s, { existingIds: new Set(['test-singer']) }), 'singer.id.exists'));
});
