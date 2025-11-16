import './style.css';
import type { Category, Singer, Software } from './types';
import { loadAllData } from './data';
import {
  getCurrentLanguage,
  setLanguage,
  getTranslations,
  createLanguageSelector,
} from './i18n';

type State = {
  category: Category;
  singers: Singer[];
  softwares: Software[];
  query: string;
};

const app = document.querySelector<HTMLDivElement>('#app')!;

const state: State = {
  category: 'singer',
  singers: [],
  softwares: [],
  query: '',
};

function renderApp() {
  const t = getTranslations();

  // Check if data is already loaded
  const dataLoaded = state.singers.length > 0 || state.softwares.length > 0;
  const statusText = dataLoaded
    ? t.statusLoadedTemplate
        .replace('{0}', state.singers.length.toString())
        .replace('{1}', state.softwares.length.toString())
    : t.loading;

  app.innerHTML = `
    <header class="container header-main">
      <div class="header-content">
        <h1>${t.appTitle}</h1>
        <p class="subtitle">${t.appSubtitle}</p>
        <div class="header-links">
          <a href="submit.html">${t.submitSinger}</a>
          <span class="separator">|</span>
          <a href="https://github.com/openutau/svs-index/issues/new?template=software-submission.yml" target="_blank">${t.submitSoftware}</a>
        </div>
      </div>
      <div id="language-selector-container"></div>
    </header>
    <section class="container controls">
      <div class="category-selector">
        <button data-category="singer" class="active">${t.singers}</button>
        <button data-category="software">${t.softwares}</button>
      </div>
      <div class="search-control">
        <input id="search" type="search" placeholder="${t.searchPlaceholder}" autocomplete="off" />
      </div>
    </section>
    <section class="container">
      <div id="status" class="status">${statusText}</div>
      <div id="results" class="results"></div>
    </section>
  `;

  // Add language selector
  const langContainer = document.getElementById('language-selector-container')!;
  langContainer.appendChild(
    createLanguageSelector((lang) => {
      setLanguage(lang);
      renderApp();
      wireEvents();
      render();
    })
  );
}

// Initial render
setLanguage(getCurrentLanguage());
renderApp();

function normalize(str: string): string {
  return str.toLowerCase();
}

function formatAllNames(names: Record<string, string>): string {
  const values = Object.values(names);
  return values.length > 1 ? values.join(' / ') : '';
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
  const resultsEl = document.getElementById('results') as HTMLDivElement;
  const q = normalize(state.query);
  if (state.category === 'singer') {
    const filtered = state.singers.filter((s) => singerMatches(s, q));
    resultsEl.innerHTML = filtered
      .map((s) => {
        const name = s.names.en || Object.values(s.names)[0] || s.id;
        const allNames = formatAllNames(s.names);
        const detailUrl = `detail.html?category=singer&id=${encodeURIComponent(s.id)}`;

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
          ${allNames ? `<div class="card-all-names">${allNames}</div>` : ''}
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
        const allNames = formatAllNames(s.names);
        const detailUrl = `detail.html?category=software&id=${encodeURIComponent(s.id)}`;

        const tags = (s.tags || [])
          .map((t) => `<span class="tag">${t}</span>`)
          .join('');

        return `<div class="card">
          <div class="card-header">
            <a href="${detailUrl}" class="card-title">${name}</a>
            <span class="card-id">@${s.id}</span>
          </div>
          ${allNames ? `<div class="card-all-names">${allNames}</div>` : ''}
          ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        </div>`;
      })
      .join('');
  }
}

function wireEvents() {
  const categorySelector = document.querySelector(
    '.category-selector'
  ) as HTMLDivElement;
  const searchEl = document.getElementById('search') as HTMLInputElement;

  const categoryButtons = categorySelector.querySelectorAll('button');
  categoryButtons.forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', () => {
      categoryButtons.forEach((btn: HTMLButtonElement) =>
        btn.classList.remove('active')
      );
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
  const t = getTranslations();
  wireEvents();
  const statusEl = document.getElementById('status') as HTMLDivElement;
  try {
    const { singers, softwares } = await loadAllData();
    state.singers = singers;
    state.softwares = softwares;
    statusEl.textContent = t.statusLoadedTemplate
      .replace('{0}', singers.length.toString())
      .replace('{1}', softwares.length.toString());
    render();
  } catch (e) {
    statusEl.textContent = t.loadFailed;
    console.error(e);
  }
}

boot();
