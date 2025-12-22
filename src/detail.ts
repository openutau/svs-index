import './style.css';
import type { Category, Singer, Software } from './types';
import { getSingerById, getSoftwareById } from './db';
import { loadCategory } from './data';
import {
  getCurrentLanguage,
  setLanguage,
  getTranslations,
  createLanguageSelector,
} from './i18n';

const app = document.querySelector<HTMLDivElement>('#app')!;

function getParams(): { category: Category; id: string } {
  const sp = new URLSearchParams(location.search);
  const category = (sp.get('category') || 'singer') as Category;
  const id = sp.get('id') || '';
  return { category, id };
}

function link(url?: string | null): string {
  return url ? `<a href="${url}" target="_blank">${url}</a>` : '';
}

function formatAllNames(names: Record<string, string>): string {
  const values = Object.values(names);
  return values.length > 1 ? values.join(' / ') : '';
}

function renderSinger(s: Singer) {
  const t = getTranslations();
  const namesList = Object.entries(s.names)
    .map(([k, v]) => `<div><strong>${k}</strong></div><div>${v}</div>`)
    .join('');
  const variants = s.variants
    .map((v) => {
      const vName = v.names.en || Object.values(v.names)[0] || v.id;
      const vAllNames = formatAllNames(v.names);
      return `<div class="variant-card">
        <div class="variant-card-header">${vName}</div>
        ${vAllNames ? `<div class="variant-card-all-names">${vAllNames}</div>` : ''}
        <div class="variant-meta">
          ${v.tags && v.tags.length ? `<div class="variant-meta-item">${t.tags}: ${v.tags.map((t) => `<span class="tag">${t}</span>`).join(' ')}</div>` : ''}
          ${v.download_page_url ? `<div class="variant-meta-item">${t.downloadPage}: ${link(v.download_page_url)}</div>` : ''}
          ${v.file_url ? `<div class="variant-meta-item">${t.directDownload}: ${link(v.file_url)}</div>` : ''}
        </div>
      </div>`;
    })
    .join('');

  app.innerHTML = `
    <header class="container detail-header">
      <div class="detail-header-top">
        <a href="./" class="back-link">${t.backToIndex}</a>
        <div id="language-selector-container"></div>
      </div>
      <h1>${s.names.en || s.id} <span class="card-id">@${s.id}</span></h1>
    </header>
    <section class="container">
      ${
        s.profile_image_url
          ? `<div class="profile-image-container">
        <img src="${s.profile_image_url}" alt="${s.names.en || s.id}" class="profile-image" />
      </div>`
          : ''
      }
      <div class="detail-card">
        <h3>${t.details}</h3>
        <div class="kv-list">
          <div><strong>${t.homepage}</strong></div><div>${link(s.homepage_url)}</div>
          <div><strong>${t.owners}</strong></div><div>${s.owners.join(', ')}</div>
          <div><strong>${t.authors}</strong></div><div>${s.authors.join(', ')}</div>
        </div>
      </div>
      <div class="detail-card">
        <h3>${t.names}</h3>
        <div class="kv-list">${namesList}</div>
      </div>
      <h3>${t.variants}</h3>
      ${variants}
    </section>
  `;

  // Add language selector
  const langContainer = document.getElementById('language-selector-container')!;
  langContainer.appendChild(
    createLanguageSelector((lang) => {
      setLanguage(lang);
      boot();
    })
  );
}

function renderSoftware(s: Software) {
  const t = getTranslations();
  const namesList = Object.entries(s.names)
    .map(([k, v]) => `<div><strong>${k}</strong></div><div>${v}</div>`)
    .join('');

  // Render versions with mirrors (if available)
  const versionsHtml =
    s.versions && s.versions.length > 0
      ? s.versions
          .map((ver) => {
            const mirrorsHtml = ver.mirrors
              .map(
                (mirror) => `
          <div class="mirror-item">
            <div class="mirror-url">${link(mirror.url)}</div>
            ${mirror.hash ? `<div class="mirror-hash"><small>SHA256: ${mirror.hash}</small></div>` : ''}
          </div>
        `
              )
              .join('');

            const depsHtml =
              ver.dependencies && ver.dependencies.length > 0
                ? `<div class="dependencies">
             <strong>${t.dependencies}:</strong>
             <ul>
               ${ver.dependencies.map((dep) => `<li>${dep.id} (v${dep.min_version})</li>`).join('')}
             </ul>
           </div>`
                : '';

            return `
        <div class="version-card">
          <div class="version-header">${t.version} ${ver.version}</div>
          <div class="version-content">
            <div class="mirrors-section">
              <strong>${t.mirrors}:</strong>
              ${mirrorsHtml}
            </div>
            ${depsHtml}
          </div>
        </div>
      `;
          })
          .join('')
      : '';

  app.innerHTML = `
    <header class="container detail-header">
      <div class="detail-header-top">
        <a href="./" class="back-link">${t.backToIndex}</a>
        <div id="language-selector-container"></div>
      </div>
      <h1>${s.names.en || s.id} <span class="card-id">@${s.id}</span></h1>
    </header>
    <section class="container">
      <div class="detail-card">
        <h3>${t.details}</h3>
        <div class="kv-list">
          <div><strong>${t.homepage}</strong></div><div>${link(s.homepage_url)}</div>
          <div><strong>${t.category}</strong></div><div>${s.category}</div>
          <div><strong>${t.developers}</strong></div><div>${s.developers.join(', ')}</div>
          ${s.tags?.length ? `<div><strong>${t.tags}</strong></div><div>${s.tags.map((t) => `<span class="tag">${t}</span>`).join(' ')}</div>` : ''}
          ${s.download_page_url ? `<div><strong>${t.downloadPage}</strong></div><div>${link(s.download_page_url)}</div>` : ''}
        </div>
      </div>
      <div class="detail-card">
        <h3>${t.names}</h3>
        <div class="kv-list">${namesList}</div>
      </div>
      ${
        versionsHtml
          ? `<h3>${t.versions}</h3>
      ${versionsHtml}`
          : ''
      }
    </section>
  `;

  // Add language selector
  const langContainer = document.getElementById('language-selector-container')!;
  langContainer.appendChild(
    createLanguageSelector((lang) => {
      setLanguage(lang);
      boot();
    })
  );
}

async function boot() {
  // Set language
  setLanguage(getCurrentLanguage());

  const { category, id } = getParams();
  const t = getTranslations();

  if (!id) {
    app.innerHTML = '<p class="container">Missing id.</p>';
    return;
  }
  try {
    if (category === 'singer') {
      let item = await getSingerById(id);
      if (!item) {
        await loadCategory('singer');
        item = await getSingerById(id);
      }
      if (!item) throw new Error('Singer not found');
      renderSinger(item);
    } else {
      let item = await getSoftwareById(id);
      if (!item) {
        await loadCategory('software');
        item = await getSoftwareById(id);
      }
      if (!item) throw new Error('Software not found');
      renderSoftware(item);
    }
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="container">${t.loadFailed}</p>`;
  }
}

boot();
