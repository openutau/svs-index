import { promises as fs } from 'fs';
import path from 'path';
import { createGzip, createBrotliCompress } from 'zlib';
import { pipeline } from 'stream/promises';

const root = path.resolve(process.cwd());
const dataDir = path.join(root, 'data');
const distDir = path.join(root, 'dist');
const outBase = path.join(distDir, 'registry', 'v1');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath) {
  const txt = await fs.readFile(filePath, 'utf8');
  return JSON.parse(txt);
}

function normalizeSinger(s) {
  // Keep original; ensure minimal shape for consumers
  return s;
}

function normalizeSoftware(s) {
  return s;
}

async function buildAggregatedSingers() {
  const singersDir = path.join(dataDir, 'singers');
  const files = (await fs.readdir(singersDir)).filter((f) => f.endsWith('.json'));
  const all = [];

  for (const file of files) {
    const arr = await readJson(path.join(singersDir, file));
    if (!Array.isArray(arr)) continue;
    for (const s of arr) all.push(normalizeSinger(s));
  }

  // Sort by id for determinism
  all.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const singersBase = path.join(outBase, 'singers');
  await ensureDir(singersBase);

  const allPath = path.join(singersBase, 'all.json');
  await fs.writeFile(allPath, JSON.stringify({ registry: 'svs-index', kind: 'singers-all', version: 1, count: all.length, items: all }, null, 2), 'utf8');

  // Create gzip and brotli compressed copies
  await compressFile(allPath, allPath + '.gz', 'gzip');
  await compressFile(allPath, allPath + '.br', 'br');

  return { count: all.length, allPath };
}

async function buildAggregatedSoftwares() {
  const softwaresDir = path.join(dataDir, 'softwares');
  try {
    const files = (await fs.readdir(softwaresDir)).filter((f) => f.endsWith('.json'));
    const all = [];
    for (const file of files) {
      const arr = await readJson(path.join(softwaresDir, file));
      if (!Array.isArray(arr)) continue;
      for (const s of arr) all.push(normalizeSoftware(s));
    }
    all.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const softBase = path.join(outBase, 'softwares');
    await ensureDir(softBase);
    const allPath = path.join(softBase, 'all.json');
    await fs.writeFile(
      allPath,
      JSON.stringify({ registry: 'svs-index', kind: 'softwares-all', version: 1, count: all.length, items: all }, null, 2),
      'utf8'
    );
    await compressFile(allPath, allPath + '.gz', 'gzip');
    await compressFile(allPath, allPath + '.br', 'br');
    return { count: all.length, allPath };
  } catch (e) {
    // Directory may not exist yet; skip gracefully
    return { count: 0, allPath: '' };
  }
}

async function compressFile(src, dest, method = 'gzip') {
  const inF = await fs.open(src, 'r');
  const outF = await fs.open(dest, 'w');
  try {
    const readStream = inF.createReadStream();
    const writeStream = outF.createWriteStream();
    const compressor = method === 'br' ? createBrotliCompress() : createGzip({ level: 9 });
    await pipeline(readStream, compressor, writeStream);
  } finally {
    await inF.close();
    await outF.close();
  }
}

async function main() {
  await ensureDir(outBase);
  const singers = await buildAggregatedSingers();
  console.log(`✅ Aggregated singers: ${singers.count} -> ${path.relative(root, singers.allPath)} (.gz/.br)`);
  const softwares = await buildAggregatedSoftwares();
  console.log(`✅ Aggregated softwares: ${softwares.count}${softwares.allPath ? ' -> ' + path.relative(root, softwares.allPath) : ''} (.gz/.br)`);
}

main().catch((err) => {
  console.error('build-registry failed:', err);
  process.exit(1);
});
