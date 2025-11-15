import './style.css';
import type { Category, Singer, Software } from './types';
import { loadAllData } from './data';

type State = {
  category: Category;
  singers: Singer[];
  softwares: Software[];
  query: string;
};

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="container header-main">
    <div class="header-content">
      <h1>SVS Index</h1>
      <p class="subtitle">Index of Singing Voice Synthesis singers and softwares</p>
      <div class="header-links">
        <a href="https://github.com/openutau/svs-index/issues/new?template=singer-submission.yml" target="_blank">Submit Singer</a>
        <span class="separator">|</span>
        <a href="https://github.com/openutau/svs-index/issues/new?template=software-submission.yml" target="_blank">Submit Software</a>
      </div>
    </div>
  </header>
  <section class="container controls">
    <div class="category-selector">
      <button data-category="singer" class="active">Singers</button>
      <button data-category="software">Softwares</button>
    </div>
    <div class="search-control">
      <input id="search" type="search" placeholder="Type to filter by id, names, tags" autocomplete="off" />
    </div>
  </section>
  <section class="container">
    <div id="status" class="status">Loading data…</div>
    <div id="results" class="results"></div>
  </section>
`;

const categorySelector = document.querySelector(
  '.category-selector'
) as HTMLDivElement;
const searchEl = document.getElementById('search') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const resultsEl = document.getElementById('results') as HTMLDivElement;

const state: State = {
  category: 'singer',
  singers: [],
  softwares: [],
  query: '',
};

function normalize(str: string): string {
  return str.toLowerCase();
}

function singerMatches(s: Singer, q: string): boolean {
  if (!q) return true;
  const n = normalize(q);
  // If query starts with @, only match IDs
  if (q.startsWith('@')) {
    const idQuery = n.substring(1);
    return s.id.includes(idQuery);
  }
  if (s.id.includes(n)) return true;
  for (const val of Object.values(s.names))
    if (normalize(val).includes(n)) return true;
  // tags across variants
  const tags = new Set<string>();
  for (const v of s.variants) (v.tags || []).forEach((t) => tags.add(t));
  for (const t of tags) if (normalize(t).includes(n)) return true;
  return false;
}

function softwareMatches(s: Software, q: string): boolean {
  if (!q) return true;
  const n = normalize(q);
  // If query starts with @, only match IDs
  if (q.startsWith('@')) {
    const idQuery = n.substring(1);
    return s.id.includes(idQuery);
  }
  if (s.id.includes(n)) return true;
  for (const val of Object.values(s.names))
    if (normalize(val).includes(n)) return true;
  for (const t of s.tags || []) if (normalize(t).includes(n)) return true;
  return false;
}

function render() {
  const q = normalize(state.query);
  if (state.category === 'singer') {
    const filtered = state.singers.filter((s) => singerMatches(s, q));
    resultsEl.innerHTML = filtered
      .map((s) => {
        const name = s.names.en || Object.values(s.names)[0] || s.id;
        const detailUrl = `/detail.html?category=singer&id=${encodeURIComponent(s.id)}`;

        // Collect all unique tags from variants
        const tagSet = new Set<string>();
        s.variants.forEach((v) => (v.tags || []).forEach((t) => tagSet.add(t)));
        const tags = Array.from(tagSet)
          .map((t) => `<span class="tag">${t}</span>`)
          .join('');

        // Render variant names
        const variants = s.variants
          .map((v) => {
            const vName = v.names.en || Object.values(v.names)[0] || v.id;
            return `<span class="variant">${vName}</span>`;
          })
          .join('');

        return `<div class="card">
          <div class="card-header">
            <a href="${detailUrl}" class="card-title">${name}</a>
            <span class="card-id">@${s.id}</span>
          </div>
          ${variants ? `<div class="card-variants">${variants}</div>` : ''}
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>`;
      })
      .join('');
  } else {
    const filtered = state.softwares.filter((s) => softwareMatches(s, q));
    resultsEl.innerHTML = filtered
      .map((s) => {
        const name = s.names.en || Object.values(s.names)[0] || s.id;
        const detailUrl = `/detail.html?category=software&id=${encodeURIComponent(s.id)}`;

        const tags = (s.tags || [])
          .map((t) => `<span class="tag">${t}</span>`)
          .join('');

        return `<div class="card">
          <div class="card-header">
            <a href="${detailUrl}" class="card-title">${name}</a>
            <span class="card-id">@${s.id}</span>
          </div>
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>`;
      })
      .join('');
  }
}

function wireEvents() {
  const categoryButtons = categorySelector.querySelectorAll('button');
  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      categoryButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      state.category = button.dataset.category as Category;
      render();
    });
  });

  searchEl.addEventListener('keyup', () => {
    state.query = searchEl.value;
    render();
  });
}

async function boot() {
  wireEvents();
  try {
    const { singers, softwares } = await loadAllData();
    state.singers = singers;
    state.softwares = softwares;
    statusEl.textContent = `${singers.length} singers, ${softwares.length} softwares loaded.`;
    render();
  } catch (e) {
    statusEl.textContent = 'Failed to load data.';
    console.error(e);
  }
}

boot();
