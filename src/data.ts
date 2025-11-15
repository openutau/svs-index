import {
  getAllSingers,
  getAllSoftwares,
  getMeta,
  setMeta,
  putSingers,
  putSoftwares,
} from './db';
import type { Category, DataManifest, Singer, Software } from './types';

// Expose a safe way to read manifest injected by HTML
function getManifest(): DataManifest {
  return (window as any).DATA_MANIFEST as DataManifest;
}

async function fetchJSON<T>(url: string): Promise<T | undefined> {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

async function ensureCategoryUpdated(category: Category): Promise<void> {
  const manifest = getManifest();
  const entries = category === 'singer' ? manifest.singers : manifest.softwares;
  const basePath =
    category === 'singer' ? '/data/singers/' : '/data/softwares/';

  const changedFiles: string[] = [];
  for (const { file, hash } of entries) {
    const metaKey = `${category}:file:${file}`;
    const savedHash = (await getMeta<string>(metaKey)) ?? '';
    if (savedHash !== hash) {
      changedFiles.push(file);
    }
  }

  if (changedFiles.length === 0) return; // up to date

  if (category === 'singer') {
    const allData: Singer[] = [];
    for (const file of changedFiles) {
      const data = await fetchJSON<Singer[]>(basePath + file);
      if (data && Array.isArray(data)) {
        allData.push(...data);
        await setMeta(
          `singer:file:${file}`,
          entries.find((e) => e.file === file)!.hash
        );
      }
    }
    if (allData.length) await putSingers(allData);
  } else {
    const allData: Software[] = [];
    for (const file of changedFiles) {
      const data = await fetchJSON<Software[]>(basePath + file);
      if (data && Array.isArray(data)) {
        allData.push(...data);
        await setMeta(
          `software:file:${file}`,
          entries.find((e) => e.file === file)!.hash
        );
      }
    }
    if (allData.length) await putSoftwares(allData);
  }
}

export async function loadAllData(): Promise<{
  singers: Singer[];
  softwares: Software[];
}> {
  await Promise.all([
    ensureCategoryUpdated('singer'),
    ensureCategoryUpdated('software'),
  ]);
  const [singers, softwares] = await Promise.all([
    getAllSingers(),
    getAllSoftwares(),
  ]);
  return { singers, softwares };
}

export async function loadCategory(
  category: Category
): Promise<Singer[] | Software[]> {
  await ensureCategoryUpdated(category);
  return category === 'singer'
    ? await getAllSingers()
    : await getAllSoftwares();
}
