import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import RJSON from 'relaxed-json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub context from environment
const issueBody = process.env.ISSUE_BODY || '';
const issueTitle = process.env.ISSUE_TITLE || '';
const issueNumber = process.env.ISSUE_NUMBER || '';
const githubRepo = process.env.GITHUB_REPOSITORY || '';
const githubToken = process.env.GITHUB_TOKEN || '';

function parseIssueForm(body) {
  const data = {};
  const lines = body.split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    const headerMatch = line.match(/^### (.+)$/);
    if (headerMatch) {
      if (currentKey) {
        data[currentKey] = currentValue.join('\n').trim();
      }
      currentKey = headerMatch[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      currentValue = [];
    } else if (currentKey) {
      currentValue.push(line);
    }
  }
  if (currentKey) {
    data[currentKey] = currentValue.join('\n').trim();
  }
  return data;
}

function cleanOptional(raw) {
  if (raw == null) return undefined;
  const val = String(raw).trim();
  if (!val) return undefined;
  const lower = val.replaceAll('_', '').toLowerCase();
  // Common placeholders from GitHub issue forms
  if (
    lower === 'no response' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none' ||
    lower === 'null'
  ) {
    return undefined;
  }
  return val;
}

function buildSingerObject(data) {
  function stripCodeFence(raw) {
    if (!raw) return raw;
    const s = String(raw).trim();
    // Match ```json\n...\n``` or ```\n...\n```
    const fenceMatch = s.match(/^```[a-zA-Z0-9]*\r?\n([\s\S]*?)\r?\n```\s*$/);
    if (fenceMatch) {
      return fenceMatch[1].trim();
    }
    return s;
  }

  // Names (set only when meaningful; drop "_No response_")
  const enName = cleanOptional(data.name_english || data.name_en);
  const names = {};
  if (enName) names.en = enName;
  const jaName = cleanOptional(data.name_japanese || data.name_ja);
  if (jaName) names.ja = jaName;
  const zhName = cleanOptional(data.name_chinese || data.name_zh);
  if (zhName) names.zh = zhName;

  // Owners / Authors lists, filter placeholders
  const owners = (data.owners || '')
    .split('\n')
    .map((s) => cleanOptional(s))
    .filter(Boolean);
  const authors = (data.authors || '')
    .split('\n')
    .map((s) => cleanOptional(s))
    .filter(Boolean);

  // Variants JSON (strip code fences)
  let variants;
  try {
    const raw = data.variants_json || data.variants || '[]';
    const cleaned = stripCodeFence(raw);
    variants = RJSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      'Invalid JSON in "Variants" field. Ensure it is valid JSON (usually an array). Example: [\n  { "id": "eng", "names": { "en": "English" } }\n]\nOriginal error: ' +
        (e && e.message ? e.message : String(e))
    );
  }

  const obj = {
    id: cleanOptional(data.unique_id) || cleanOptional(data.id),
    names,
    owners,
    authors,
    variants,
  };

  if (!obj.id) {
    throw new Error('Missing required field: id (Unique ID). Please provide a stable identifier.');
  }
  if (!obj.names || !obj.names.en) {
    throw new Error('Missing required field: names.en (English name).');
  }

  const homepage = cleanOptional(data.homepage_url);
  if (homepage) obj.homepage_url = homepage;
  const profile = cleanOptional(data.profile_image_url);
  if (profile) obj.profile_image_url = profile;

  return obj;
}

function buildSoftwareObject(data) {
  // Names (set only when meaningful)
  const enName = cleanOptional(data.name_english || data.name_en);
  const names = {};
  if (enName) names.en = enName;
  const jaName = cleanOptional(data.name_japanese || data.name_ja);
  if (jaName) names.ja = jaName;
  const zhName = cleanOptional(data.name_chinese || data.name_zh);
  if (zhName) names.zh = zhName;

  const developers = (data.developers || '')
    .split('\n')
    .map((s) => cleanOptional(s))
    .filter(Boolean);

  const obj = {
    id: cleanOptional(data.unique_id) || cleanOptional(data.id),
    names,
    category: cleanOptional(data.category),
    developers,
  };

  if (!obj.id) {
    throw new Error('Missing required field: id (Unique ID). Please provide a stable identifier.');
  }
  if (!obj.names || !obj.names.en) {
    throw new Error('Missing required field: names.en (English name).');
  }
  if (!obj.category) {
    throw new Error('Missing required field: category.');
  }

  const homepage = cleanOptional(data.homepage_url);
  if (homepage) obj.homepage_url = homepage;
  const dl = cleanOptional(data.download_url);
  if (dl) obj.download_url = dl;
  const mdl = cleanOptional(data.manual_download_url);
  if (mdl) obj.manual_download_url = mdl;
  if (data.tags) {
    obj.tags = data.tags
      .split(',')
      .map((s) => cleanOptional(s))
      .filter(Boolean);
  }

  return obj;
}

function toDotPath(instancePath, params) {
  // Convert Ajv instancePath "/names/en" to "names.en" and handle required
  const base = (instancePath || '/')
    .replace(/^\//, '')
    .replace(/\//g, '.')
    .trim();
  if (params && params.missingProperty) {
    return (base ? base + '.' : '') + params.missingProperty;
  }
  return base || '<root>';
}

function formatAjvErrors(errors) {
  return (errors || [])
    .map((err) => {
      const path = toDotPath(err.instancePath, err.params);
      const details = err.params ? ` (${JSON.stringify(err.params)})` : '';
      return `- ${path}: ${err.message}${details}`;
    })
    .join('\n');
}

function validateSchema(obj, schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ strict: false });
  addFormats(ajv);

  // Validate single item against the schema's items definition
  const itemSchema = schema.items || schema;
  const validate = ajv.compile(itemSchema);
  const valid = validate(obj);

  if (!valid) {
    const formatted = formatAjvErrors(validate.errors);
    // Emit GitHub Actions annotations for each error
    for (const err of validate.errors || []) {
      const p = toDotPath(err.instancePath, err.params);
      const msg = `${err.message}${err.params ? ' ' + JSON.stringify(err.params) : ''}`;
      console.log(`::error title=Schema validation failed,path=${p}::${msg}`);
    }
    const err = new Error(
      'Schema validation failed. Please correct the following:\n' +
      formatted +
      '\n\nSee the schema file and README for required fields.'
    );
    err.details = {
      formatted,
      errors: (validate.errors || []).map(e => ({
        path: toDotPath(e.instancePath, e.params),
        message: e.message,
        params: e.params || {}
      }))
    };
    throw err;
  }
}

async function postIssueComment(body) {
  if (!githubToken || !githubRepo || !issueNumber) return;
  const url = `https://api.github.com/repos/${githubRepo}/issues/${issueNumber}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('Failed to comment on issue:', res.status, txt);
  }
}

async function getIssueLabels() {
  if (!githubToken || !githubRepo || !issueNumber) return [];
  const url = `https://api.github.com/repos/${githubRepo}/issues/${issueNumber}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  const labels = Array.isArray(data?.labels) ? data.labels : [];
  return labels.map((l) => (typeof l === 'string' ? l : l?.name || '')).filter(Boolean);
}

async function detectCategory() {
  // Prefer labels when available
  try {
    const labels = (await getIssueLabels()).map((s) => String(s).toLowerCase());
    if (labels.includes('singer')) return 'singer';
    if (labels.includes('software')) return 'software';
  } catch { }
  // Fallback: title heuristic
  const t = issueTitle.toLowerCase();
  if (/(^|\b)singer(\b|$)/.test(t)) return 'singer';
  if (/(^|\b)software(\b|$)/.test(t)) return 'software';
  // Last resort: infer from form fields
  const data = parseIssueForm(issueBody);
  if (data.category || data.developers) return 'software';
  return 'singer';
}

async function main() {
  const category = await detectCategory();
  const dataDir = path.join(__dirname, '..', 'data', `${category}s`);
  const schemaPath = path.join(__dirname, '..', 'data', `${category}-schema.json`);

  const parsedData = parseIssueForm(issueBody);
  const obj = category === 'singer' ? buildSingerObject(parsedData) : buildSoftwareObject(parsedData);

  // Optional lightweight direct download URL validation (no full download)
  // Enable with VALIDATE_LINKS=1. Fail (instead of warn) with STRICT_DOWNLOAD_CHECK=1.
  const shouldValidate = process.env.VALIDATE_LINKS === '1';
  const strictMode = process.env.STRICT_DOWNLOAD_CHECK === '1';
  const linkIssues = [];

  async function probe(url) {
    if (!url) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      // First try HEAD request
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      if (!res.ok || res.status === 405) {
        // Fallback: range GET (first byte)
        res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow', signal: controller.signal });
      }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const disp = res.headers.get('content-disposition') || '';
      const len = res.headers.get('content-length');
      return { status: res.status, contentType: ct, contentDisposition: disp, contentLength: len };
    } catch (e) {
      return { error: e && e.message ? e.message : String(e) };
    } finally {
      clearTimeout(timeout);
    }
  }

  function isLikelyFile(meta, url) {
    if (!meta) return false;
    if (meta.error) return false; // treat unreachable as not verified
    const ct = meta.contentType;
    if (!ct) return false;
    // Accept common archive/audio/binary types
    if (/application\/(zip|x-zip-compressed|octet-stream|x-rar-compressed|x-7z-compressed)/.test(ct)) return true;
    if (/audio\//.test(ct)) return true;
    if (/image\//.test(ct)) return true; // Some voicebanks may zip images? allow images when direct.
    if (/text\/plain/.test(ct) && /\.(ini|txt|ust|svs|vsqx)$/i.test(url)) return true;
    if (/application\/json/.test(ct) && /\.json$/i.test(url)) return true;
    // If content-disposition suggests attachment
    if (meta.contentDisposition && /attachment/i.test(meta.contentDisposition)) return true;
    // Heuristic: URL ends with archive/audio extension
    if (/\.(zip|rar|7z|wav|ogg|mp3|ust|svs|vsqx)$/i.test(url)) return true;
    return false;
  }

  async function validateLink(url, label) {
    if (!url) return;
    const meta = await probe(url);
    if (meta && meta.error) {
      linkIssues.push({ url, label, type: 'unreachable', detail: meta.error });
      return;
    }
    if (!isLikelyFile(meta, url)) {
      linkIssues.push({ url, label, type: 'not-file', detail: meta });
    }
  }

  if (shouldValidate) {
    if (category === 'software') {
      // Only validate direct download_url; manual link may be a landing page
      await validateLink(obj.download_url, 'software.download_url');
    } else {
      // Singer: check variant URLs
      for (let i = 0; i < (obj.variants || []).length; i++) {
        const v = obj.variants[i];
        await validateLink(v.download_url, `variants[${i}].download_url`);
      }
    }
  }

  if (linkIssues.length) {
    const lines = linkIssues.map(li => `| ${li.label} | ${li.url} | ${li.type} | ${typeof li.detail === 'string' ? li.detail : (li.detail && li.detail.contentType) || ''} |`).join('\n');
    const table = '\n#### Link Validation\n\n| Field | URL | Status | Detail |\n|-------|-----|--------|--------|\n' + lines + '\n';
    // If strict mode and any non-file issue
    if (strictMode && linkIssues.some(li => li.type !== 'file')) {
      const err = new Error('One or more download links appear to be web pages or unreachable. Please provide a direct file URL.');
      err.details = { linkIssues };
      throw err;
    } else {
      // Print a warning annotation for each issue
      linkIssues.forEach(li => {
        console.log(`::warning title=Link validation ${li.type}::${li.label} => ${li.url}`);
      });
      // Append to console for workflow logs
      console.log(table);
    }
  }

  // Validate
  validateSchema(obj, schemaPath);

  // Determine target file
  const firstLetter = obj.id[0].toLowerCase();
  const targetFile = path.join(dataDir, `${firstLetter}.json`);

  // Check if id already exists
  let existing = [];
  if (fs.existsSync(targetFile)) {
    existing = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
    if (existing.some((item) => item.id === obj.id)) {
      throw new Error(`ID "${obj.id}" already exists in ${firstLetter}.json`);
    }
  }

  // Append and write
  existing.push(obj);
  fs.writeFileSync(targetFile, JSON.stringify(existing, null, 2) + '\n', 'utf8');

  console.log(`✅ Successfully added ${category} "${obj.id}" to ${firstLetter}.json`);
  console.log(JSON.stringify(obj, null, 2));
}

async function run() {
  try {
    await main();
  } catch (error) {
    // Also print a GitHub Actions error annotation for better visibility
    const msg = error && error.message ? error.message : String(error);
    console.log(`::error title=Issue processing failed::${msg}`);
    console.error('❌ Error:', msg);
    // Attempt to report back to the originating issue
    const header = '### ❌ Submission failed validation';
    const advice = '\nIf you believe this is a mistake, please update your issue with corrections and re-run the workflow.';
    let detailsMd = '';
    if (error && error.details && error.details.errors) {
      const list = error.details.errors.map(e => `| ${e.path} | ${e.message} | ${JSON.stringify(e.params)} |`).join('\n');
      detailsMd = '\n#### Validation Details\n\n| Path | Message | Params |\n|------|---------|--------|\n' + list + '\n';
      detailsMd += '\n<details><summary>Formatted List</summary>\n\n' + error.details.formatted + '\n\n</details>\n';
    }
    if (error && error.details && error.details.linkIssues) {
      const li = error.details.linkIssues;
      if (li.length) {
        const lines = li.map(x => `| ${x.label} | ${x.url} | ${x.type} | ${typeof x.detail === 'string' ? x.detail : (x.detail && x.detail.contentType) || ''} |`).join('\n');
        detailsMd += '\n#### Link Validation (strict mode)\n\n| Field | URL | Status | Detail |\n|-------|-----|--------|--------|\n' + lines + '\n';
      }
    }
    await postIssueComment(`${header}\n\n${msg}${detailsMd}${advice}`);
    process.exit(1);
  }
}

run();
