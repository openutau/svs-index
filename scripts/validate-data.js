// Validate svs-index data files against the shared validation authority.
//
// Usage:
//   node scripts/validate-data.js <file...>   Validate just those data files.
//   node scripts/validate-data.js             Validate every data file.
//
// The CI pull-request check (.github/workflows/validate-data.yml) passes the data
// files changed in the PR; with no arguments the script validates the whole data
// set, which is handy locally (`npm run validate`).
//
// Per item it runs the same module the issue pipeline and browser editor use
// (shared/singer-validation.js / shared/software-validation.js), plus two checks
// that depend on file layout rather than entity validity: cross-file id
// uniqueness and letter-bucket placement (an id in `g.json` must start with `g`).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSinger } from '../shared/singer-validation.js';
import { validateSoftware } from '../shared/software-validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataRoot = path.join(__dirname, '..', 'data');

function loadTagWhitelist() {
  try {
    const p = path.join(dataRoot, 'tag-whitelist.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return new Set(Array.isArray(data.tags) ? data.tags : []);
  } catch {
    return new Set();
  }
}

// "data/singers/a.json" / absolute path -> "singer" | "software" | null
function kindOf(file) {
  const norm = file.replace(/\\/g, '/');
  if (/\/data\/singers\/[^/]+\.json$/.test(norm) || /^data\/singers\//.test(norm)) return 'singer';
  if (/\/data\/softwares\/[^/]+\.json$/.test(norm) || /^data\/softwares\//.test(norm)) return 'software';
  return null;
}

function listAllDataFiles() {
  const files = [];
  for (const [kind, dir] of [
    ['singer', path.join(dataRoot, 'singers')],
    ['software', path.join(dataRoot, 'softwares')],
  ]) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) files.push({ kind, file: path.join(dir, f) });
    }
  }
  return files;
}

// All published ids of a kind, so a changed item that collides with anything
// (in another file or earlier in its own file) is caught.
function collectIds(kind) {
  const dir = path.join(dataRoot, `${kind}s`);
  const ids = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch {
      continue; // parse errors are reported per-file when that file is validated
    }
    if (Array.isArray(arr)) {
      for (const item of arr) if (item && typeof item.id === 'string') ids.add(item.id);
    }
  }
  return ids;
}

const tagWhitelist = loadTagWhitelist();

const inActions = !!process.env.GITHUB_ACTIONS;

function annotate(file, id, e) {
  const where = id ? ` id=${id}` : '';
  // GitHub Actions annotation (only useful in CI; noise in a local terminal).
  if (inActions) {
    console.log(`::error title=Data validation failed,file=${file}::${file}${where} ${e.path}: ${e.message}`);
  }
  console.error(`  - ${file}${where} ${e.path}: ${e.message}`);
}

// Render a structured error's English message. Each code carries its details in
// `params`; surface them so the contributor sees *what* is wrong, not just a code.
function messageFor(e) {
  const p = e.params || {};
  switch (e.code) {
    case 'singer.id.exists':
    case 'software.id.exists':
      return `id "${p.id}" already exists in the registry`;
    case 'variant.id.prefix':
      return `variant id must start with the singer id prefix "${p.singerId}-"`;
    case 'variant.id.duplicate':
      return `duplicate variant id "${p.id}" within the singer`;
    case 'tag.tooLong':
      return `tag "${p.tag}" is ${p.tag ? p.tag.length : '?'} chars, over the ${p.max}-char limit, and is not in the tag whitelist (data/tag-whitelist.json)`;
    case 'letter.bucket':
      return `id must start with "${p.expected}" to live in ${p.file} (got "${p.id}")`;
    default:
      // Schema errors (code "schema.<keyword>") carry Ajv's message in params.
      return p.message || e.code;
  }
}

function validateFile({ kind, file }) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (inActions) {
      console.log(`::error title=Data validation failed,file=${file}::${file} is not valid JSON: ${err.message}`);
    }
    console.error(`  - ${file}: invalid JSON: ${err.message}`);
    return 1;
  }
  if (!Array.isArray(arr)) {
    const e = { path: '<root>', message: 'file must contain a JSON array' };
    annotate(file, '', e);
    return 1;
  }

  const letter = path.basename(file, '.json').toLowerCase();
  // existingIds = every id of this kind except the ones declared in this file,
  // plus ids seen earlier in this file (to catch in-file duplicates).
  const allIds = collectIds(kind);
  const thisFileIds = new Set(
    arr.filter((i) => i && typeof i.id === 'string').map((i) => i.id)
  );
  const baseIds = new Set([...allIds].filter((id) => !thisFileIds.has(id)));
  const seen = new Set();

  let failures = 0;
  arr.forEach((item) => {
    const id = item && typeof item.id === 'string' ? item.id : '';
    const existingIds = new Set([...baseIds, ...seen]);
    const errors =
      kind === 'singer'
        ? validateSinger(item, { existingIds, tagWhitelist })
        : validateSoftware(item, { existingIds });

    // Letter-bucket placement (depends on the file name, not the entity itself).
    if (id) {
      const first = id[0].toLowerCase();
      if (first !== letter) {
        errors.push({
          path: 'id',
          code: 'letter.bucket',
          params: { id, file: path.basename(file), expected: first },
        });
      }
    }

    if (errors.length) {
      for (const e of errors) annotate(file, id, { path: e.path, message: messageFor(e) });
      failures += errors.length;
    }
    if (id) seen.add(id);
  });

  return failures ? 1 : 0;
}

function main() {
  const args = process.argv.slice(2);
  let targets;
  if (args.length) {
    targets = [];
    for (const a of args) {
      const kind = kindOf(a);
      if (!kind) {
        console.error(`Skipping non-data file: ${a}`);
        continue;
      }
      targets.push({ kind, file: path.resolve(a) });
    }
  } else {
    targets = listAllDataFiles();
  }

  if (!targets.length) {
    console.log('No data files to validate.');
    return 0;
  }

  let status = 0;
  for (const t of targets) {
    status |= validateFile(t);
  }

  if (status) {
    console.error('\n❌ Data validation failed. See the errors above.');
  } else {
    console.log(`✅ Validated ${targets.length} data file(s); no problems found.`);
  }
  return status;
}

process.exit(main());
