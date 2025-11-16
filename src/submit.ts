import './style.css';
import {
  getCurrentLanguage,
  setLanguage,
  getTranslations,
  createLanguageSelector,
} from './i18n';

// --- Singer Data ---
interface SingerNames {
  [languageCode: string]: string;
}

let singerId: string = '';
let singerNames: SingerNames = { en: '', ja: '', zh: '' };
let owners: string[] = [];
let authors: string[] = [];
let homepageUrl: string = '';
let profileImageUrl: string = '';
let existingSingerIds: Set<string> = new Set();

async function loadExistingSingerIds() {
  try {
    const res = await fetch('./registry/v1/singers/all.json');
    if (!res.ok) throw new Error('Failed to fetch singers');
    const data = await res.json();
    if (data.items && Array.isArray(data.items)) {
      existingSingerIds = new Set(
        data.items.map((s: any) => s.id).filter(Boolean)
      );
    }
  } catch (err) {
    console.warn(
      'Could not load existing singer IDs; uniqueness check limited.',
      err
    );
  } finally {
    validateSingerId();
    updateOutput();
  }
}

function validateSingerId(): { valid: boolean; messages: string[] } {
  const t = getTranslations();
  const messages: string[] = [];
  const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!singerId) {
    messages.push(t.singerIdRequired);
  } else {
    if (singerId.length < 5) messages.push(t.singerIdMinLength);
    if (!pattern.test(singerId)) messages.push(t.singerIdPattern);
    if (existingSingerIds.has(singerId)) messages.push(t.singerIdExists);
  }
  const valid = messages.length === 0;
  const statusEl = document.getElementById('singer-id-status');
  if (statusEl) {
    statusEl.innerHTML = valid
      ? `<span class="status-valid">${t.singerIdValid}</span>`
      : `<span class="status-invalid">✗ Singer ID issues:</span><ul>${messages
          .map((m) => `<li>${escapeHtml(m)}</li>`)
          .join('')}</ul>`;
  }
  return { valid, messages };
}

// Type definitions based on singer schema
interface VariantNames {
  [languageCode: string]: string;
}

interface Variant {
  id: string;
  names: VariantNames;
  file_url: string | null;
  download_page_url: string | null;
  tags?: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

// State management
let variants: Variant[] = [];
let variantIdCounter = 0;

// Load saved state from localStorage
function loadState(): void {
  const saved = localStorage.getItem('svs-variants-draft');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      variants = parsed.variants || [];
      variantIdCounter = parsed.counter || 0;

      // Re-render all variants
      variants.forEach((variant, index) => {
        addVariantToDOM(index);
        populateVariantFields(index, variant);
      });

      updateOutput();
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  } else {
    // Add one empty variant by default
    addVariant();
  }
}

// Save state to localStorage
function saveState(): void {
  localStorage.setItem(
    'svs-variants-draft',
    JSON.stringify({
      variants,
      counter: variantIdCounter,
    })
  );
}

// Validate a single variant
function validateVariant(
  variant: Variant,
  allVariants: Variant[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Singer ID dependency
  const singerValidation = validateSingerId();
  if (!singerValidation.valid) {
    errors.push({
      field: 'singer_id',
      message: 'Choose a valid singer ID first.',
    });
  }

  // Validate ID pattern
  const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!variant.id) {
    errors.push({ field: 'id', message: 'Variant ID is required' });
  } else if (!idPattern.test(variant.id)) {
    errors.push({
      field: 'id',
      message: 'ID must be lowercase letters and numbers separated by hyphens',
    });
  } else if (singerValidation.valid && !variant.id.startsWith(singerId + '-')) {
    errors.push({
      field: 'id',
      message: `Variant ID must start with singer ID prefix "${singerId}-"`,
    });
  }

  // Variant ID uniqueness among variants
  if (variant.id) {
    const dupCount = allVariants.filter((v) => v.id === variant.id).length;
    if (dupCount > 1) {
      errors.push({
        field: 'id',
        message: 'Variant ID must be unique among variants',
      });
    }
  }

  // Validate names
  if (!variant.names || Object.keys(variant.names).length === 0) {
    errors.push({ field: 'names', message: 'At least one name is required' });
  } else if (!variant.names.en) {
    errors.push({ field: 'names', message: 'English name (en) is required' });
  }

  // Validate URLs if provided (not null)
  if (variant.file_url !== null && variant.file_url) {
    try {
      new URL(variant.file_url);
    } catch {
      errors.push({ field: 'file_url', message: 'Invalid URL format' });
    }
  }

  if (variant.download_page_url !== null && variant.download_page_url) {
    try {
      new URL(variant.download_page_url);
    } catch {
      errors.push({
        field: 'download_page_url',
        message: 'Invalid URL format',
      });
    }
  }

  // Require at least one of file_url or download_page_url
  if (!variant.file_url && !variant.download_page_url) {
    errors.push({
      field: 'urls',
      message: 'Provide at least one of File URL or Download Page URL',
    });
  }

  return errors;
}

// Validate all variants
function validateAllVariants(): {
  isValid: boolean;
  errors: ValidationError[];
} {
  if (variants.length === 0) {
    return {
      isValid: false,
      errors: [
        { field: 'general', message: 'At least one variant is required' },
      ],
    };
  }

  const allErrors: ValidationError[] = [];
  variants.forEach((variant, index) => {
    const errors = validateVariant(variant, variants);
    errors.forEach((error) => {
      allErrors.push({
        ...error,
        field: `Variant ${index + 1}: ${error.field}`,
      });
    });
  });

  // Include singer ID errors separately when not valid but variants attempted
  const singerValidation = validateSingerId();
  if (!singerValidation.valid) {
    singerValidation.messages.forEach((m) =>
      allErrors.unshift({ field: 'Singer ID', message: m })
    );
  }

  return { isValid: allErrors.length === 0, errors: allErrors };
}

// Add a new variant
function addVariant(): void {
  const variant: Variant = {
    id: '',
    names: { en: '', ja: '', zh: '' },
    file_url: null,
    download_page_url: null,
    tags: [],
  };

  variants.push(variant);
  const index = variants.length - 1;
  addVariantToDOM(index);
  saveState();
  updateOutput();
}

// Add variant to DOM
function addVariantToDOM(index: number): void {
  const container = document.getElementById('variants-container')!;
  const variantId = `variant-${variantIdCounter++}`;

  const variantDiv = document.createElement('div');
  variantDiv.className = 'variant-card';
  variantDiv.dataset.index = String(index);
  variantDiv.id = variantId;

  variantDiv.innerHTML = `
    <div class="variant-header">
      <h3>Variant ${index + 1}</h3>
      <button class="btn-icon btn-collapse" data-variant-id="${variantId}" title="Collapse/Expand">▼</button>
      <button class="btn-icon btn-remove" data-index="${index}" title="Remove variant">✕</button>
    </div>
    <div class="variant-content">
      <div class="form-group">
        <label>Variant ID <span class="required">*</span></label>
        <input type="text" class="variant-id" data-index="${index}" placeholder="e.g., hatsune-miku-v4x" />
        <small>Lowercase letters and numbers separated by hyphens</small>
      </div>
      
      <div class="form-group">
        <label>Names <span class="required">*</span></label>
        <div class="names-container" data-index="${index}">
          <div class="name-pair">
            <input type="text" class="name-lang" placeholder="en" value="en" />
            <input type="text" class="name-value" placeholder="English name" />
            <button class="btn-icon btn-remove-name" title="Remove name">✕</button>
          </div>
          <div class="name-pair">
            <input type="text" class="name-lang" placeholder="ja" value="ja" />
            <input type="text" class="name-value" placeholder="Japanese name (optional)" />
            <button class="btn-icon btn-remove-name" title="Remove name">✕</button>
          </div>
          <div class="name-pair">
            <input type="text" class="name-lang" placeholder="zh" value="zh" />
            <input type="text" class="name-value" placeholder="Chinese name (optional)" />
            <button class="btn-icon btn-remove-name" title="Remove name">✕</button>
          </div>
        </div>
        <button class="btn-small btn-add-name" data-index="${index}">+ Add Name</button>
        <small>At least an English name (en) is required; other languages optional.</small>
      </div>
      
      <div class="form-group">
        <label>File URL</label>
        <div class="url-input-group">
          <input type="url" class="variant-file-url" data-index="${index}" placeholder="https://example.com/file.zip" />
          <label class="checkbox-label">
            <input type="checkbox" class="url-null-checkbox" data-index="${index}" data-field="file_url" checked />
            Set to null
          </label>
        </div>
        <small>Direct download link, or check "Set to null" if not applicable</small>
      </div>
      
      <div class="form-group">
        <label>Download Page URL</label>
        <div class="url-input-group">
          <input type="url" class="variant-download-url" data-index="${index}" placeholder="https://example.com/download" />
          <label class="checkbox-label">
            <input type="checkbox" class="url-null-checkbox" data-index="${index}" data-field="download_page_url" checked />
            Set to null
          </label>
        </div>
        <small>Manual download page, or check "Set to null" if not applicable</small>
      </div>
      
      <div class="form-group">
        <label>Tags</label>
        <div class="tags-container" data-index="${index}"></div>
        <button class="btn-small btn-add-tag" data-index="${index}">+ Add Tag</button>
        <small>Optional tags (e.g., "vocaloid4", "bilingual")</small>
      </div>
    </div>
  `;

  container.appendChild(variantDiv);
  attachVariantEventListeners(variantDiv, index);
}

// Populate variant fields with data
function populateVariantFields(index: number, variant: Variant): void {
  const card = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
  if (!card) return;

  // ID
  const idInput = card.querySelector('.variant-id') as HTMLInputElement;
  if (idInput) idInput.value = variant.id;

  // Names
  const namesContainer = card.querySelector('.names-container') as HTMLElement;
  if (namesContainer) {
    namesContainer.innerHTML = '';
    const seen: Set<string> = new Set();
    Object.entries(variant.names).forEach(([lang, name]) => {
      addNamePairToDOM(namesContainer, index, lang, name);
      seen.add(lang);
    });
    ['ja', 'zh'].forEach((l) => {
      if (!seen.has(l)) addNamePairToDOM(namesContainer, index, l, '');
    });
  }

  // URLs
  const fileUrlInput = card.querySelector(
    '.variant-file-url'
  ) as HTMLInputElement;
  const fileUrlCheckbox = card.querySelector(
    '.url-null-checkbox[data-field="file_url"]'
  ) as HTMLInputElement;
  if (fileUrlInput && fileUrlCheckbox) {
    if (variant.file_url === null) {
      fileUrlCheckbox.checked = true;
      fileUrlInput.disabled = true;
      fileUrlInput.value = '';
    } else {
      fileUrlCheckbox.checked = false;
      fileUrlInput.disabled = false;
      fileUrlInput.value = variant.file_url;
    }
  }

  const downloadUrlInput = card.querySelector(
    '.variant-download-url'
  ) as HTMLInputElement;
  const downloadUrlCheckbox = card.querySelector(
    '.url-null-checkbox[data-field="download_page_url"]'
  ) as HTMLInputElement;
  if (downloadUrlInput && downloadUrlCheckbox) {
    if (variant.download_page_url === null) {
      downloadUrlCheckbox.checked = true;
      downloadUrlInput.disabled = true;
      downloadUrlInput.value = '';
    } else {
      downloadUrlCheckbox.checked = false;
      downloadUrlInput.disabled = false;
      downloadUrlInput.value = variant.download_page_url;
    }
  }

  // Tags
  const tagsContainer = card.querySelector('.tags-container') as HTMLElement;
  if (tagsContainer && variant.tags) {
    tagsContainer.innerHTML = '';
    variant.tags.forEach((tag) => {
      addTagToDOM(tagsContainer, index, tag);
    });
  }
}

// Add name pair to DOM
function addNamePairToDOM(
  container: HTMLElement,
  variantIndex: number,
  lang: string = '',
  name: string = ''
): void {
  const pairDiv = document.createElement('div');
  pairDiv.className = 'name-pair';
  pairDiv.innerHTML = `
    <input type="text" class="name-lang" placeholder="en" value="${lang}" />
    <input type="text" class="name-value" placeholder="Name" value="${name}" />
    <button class="btn-icon btn-remove-name" title="Remove name">✕</button>
  `;

  container.appendChild(pairDiv);

  // Attach event listeners
  const inputs = pairDiv.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      updateVariantFromDOM(variantIndex);
    });
  });

  const removeBtn = pairDiv.querySelector('.btn-remove-name');
  removeBtn?.addEventListener('click', () => {
    pairDiv.remove();
    updateVariantFromDOM(variantIndex);
  });
}

// Add tag to DOM
function addTagToDOM(
  container: HTMLElement,
  variantIndex: number,
  tag: string = ''
): void {
  const tagDiv = document.createElement('div');
  tagDiv.className = 'tag-input';
  tagDiv.innerHTML = `
    <input type="text" class="tag-value" placeholder="Tag name" value="${tag}" />
    <button class="btn-icon btn-remove-tag" title="Remove tag">✕</button>
  `;

  container.appendChild(tagDiv);

  // Attach event listeners
  const input = tagDiv.querySelector('.tag-value') as HTMLInputElement;
  input.addEventListener('input', () => {
    updateVariantFromDOM(variantIndex);
  });

  const removeBtn = tagDiv.querySelector('.btn-remove-tag');
  removeBtn?.addEventListener('click', () => {
    tagDiv.remove();
    updateVariantFromDOM(variantIndex);
  });
}

// Attach event listeners to a variant card
function attachVariantEventListeners(card: HTMLElement, index: number): void {
  // Remove variant button
  const removeBtn = card.querySelector('.btn-remove') as HTMLButtonElement;
  removeBtn?.addEventListener('click', () => {
    if (confirm('Remove this variant?')) {
      variants.splice(index, 1);
      card.remove();
      reindexVariants();
      saveState();
      updateOutput();
    }
  });

  // Collapse/expand button
  const collapseBtn = card.querySelector('.btn-collapse') as HTMLButtonElement;
  const content = card.querySelector('.variant-content') as HTMLElement;
  collapseBtn?.addEventListener('click', () => {
    content.classList.toggle('collapsed');
    collapseBtn.textContent = content.classList.contains('collapsed')
      ? '▶'
      : '▼';
  });

  // Variant ID input
  const idInput = card.querySelector('.variant-id') as HTMLInputElement;
  idInput?.addEventListener('input', () => {
    updateVariantFromDOM(index);
  });

  // URL null checkboxes
  const urlCheckboxes = card.querySelectorAll(
    '.url-null-checkbox'
  ) as NodeListOf<HTMLInputElement>;
  urlCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const field = target.dataset.field as 'file_url' | 'download_page_url';
      const urlInput = card.querySelector(
        field === 'file_url' ? '.variant-file-url' : '.variant-download-url'
      ) as HTMLInputElement;

      if (target.checked) {
        urlInput.disabled = true;
        urlInput.value = '';
      } else {
        urlInput.disabled = false;
      }

      updateVariantFromDOM(index);
    });
  });

  // URL inputs
  const fileUrlInput = card.querySelector(
    '.variant-file-url'
  ) as HTMLInputElement;
  const downloadUrlInput = card.querySelector(
    '.variant-download-url'
  ) as HTMLInputElement;
  fileUrlInput?.addEventListener('input', () => updateVariantFromDOM(index));
  downloadUrlInput?.addEventListener('input', () =>
    updateVariantFromDOM(index)
  );

  // Add name button
  const addNameBtn = card.querySelector('.btn-add-name') as HTMLButtonElement;
  addNameBtn?.addEventListener('click', () => {
    const namesContainer = card.querySelector(
      '.names-container'
    ) as HTMLElement;
    addNamePairToDOM(namesContainer, index);
    updateVariantFromDOM(index);
  });

  // Add tag button
  const addTagBtn = card.querySelector('.btn-add-tag') as HTMLButtonElement;
  addTagBtn?.addEventListener('click', () => {
    const tagsContainer = card.querySelector('.tags-container') as HTMLElement;
    addTagToDOM(tagsContainer, index);
    updateVariantFromDOM(index);
  });
}

// Update variant object from DOM
function updateVariantFromDOM(index: number): void {
  const card = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
  if (!card || !variants[index]) return;

  const variant = variants[index];

  // ID
  const idInput = card.querySelector('.variant-id') as HTMLInputElement;
  variant.id = idInput?.value || '';

  // Names
  const namePairs = card.querySelectorAll('.name-pair');
  variant.names = {};
  namePairs.forEach((pair) => {
    const langInput = pair.querySelector('.name-lang') as HTMLInputElement;
    const nameInput = pair.querySelector('.name-value') as HTMLInputElement;
    const lang = langInput.value.trim();
    const name = nameInput.value.trim();
    if (lang && name) {
      variant.names[lang] = name;
    }
  });

  // URLs
  const fileUrlCheckbox = card.querySelector(
    '.url-null-checkbox[data-field="file_url"]'
  ) as HTMLInputElement;
  const fileUrlInput = card.querySelector(
    '.variant-file-url'
  ) as HTMLInputElement;
  variant.file_url = fileUrlCheckbox?.checked
    ? null
    : fileUrlInput?.value || null;

  const downloadUrlCheckbox = card.querySelector(
    '.url-null-checkbox[data-field="download_page_url"]'
  ) as HTMLInputElement;
  const downloadUrlInput = card.querySelector(
    '.variant-download-url'
  ) as HTMLInputElement;
  variant.download_page_url = downloadUrlCheckbox?.checked
    ? null
    : downloadUrlInput?.value || null;

  // Tags
  const tagInputs = card.querySelectorAll(
    '.tag-value'
  ) as NodeListOf<HTMLInputElement>;
  variant.tags = Array.from(tagInputs)
    .map((input) => input.value.trim())
    .filter((tag) => tag.length > 0);

  if (variant.tags.length === 0) {
    delete variant.tags;
  }

  saveState();
  updateOutput();
}

// Reindex variants after removal
function reindexVariants(): void {
  const container = document.getElementById('variants-container')!;
  const cards = container.querySelectorAll('.variant-card');

  cards.forEach((card, newIndex) => {
    card.setAttribute('data-index', String(newIndex));
    const header = card.querySelector('.variant-header h3');
    if (header) header.textContent = `Variant ${newIndex + 1}`;

    // Update all data-index attributes
    card.querySelectorAll('[data-index]').forEach((el) => {
      el.setAttribute('data-index', String(newIndex));
    });
  });
}

// Update JSON output
function updateOutput(): void {
  const outputEl = document.getElementById('json-output')!;
  const statusEl = document.getElementById('validation-status')!;
  const copyBtn = document.getElementById('copy-json') as HTMLButtonElement;

  const singerValid = validateSingerId().valid;
  const validation = validateAllVariants();

  // Validate singer-level fields
  const singerErrors: string[] = [];
  if (!singerNames.en || singerNames.en.trim() === '') {
    singerErrors.push('English name is required');
  }
  if (owners.filter((o) => o.trim()).length === 0) {
    singerErrors.push('At least one owner is required');
  }
  if (authors.filter((a) => a.trim()).length === 0) {
    singerErrors.push('At least one author is required');
  }

  const allValid =
    validation.isValid && singerValid && singerErrors.length === 0;

  if (allValid) {
    // Build full singer object
    const cleanVariants = variants.map((v) => {
      const clean: any = { ...v };
      if (clean.tags && clean.tags.length === 0) {
        delete clean.tags;
      }
      return clean;
    });

    const singer: any = {
      id: singerId,
      names: { ...singerNames },
      owners: owners.filter((o) => o.trim()),
      authors: authors.filter((a) => a.trim()),
      variants: cleanVariants,
    };

    // Add optional fields
    if (homepageUrl && homepageUrl.trim()) {
      singer.homepage_url = homepageUrl.trim();
    }
    if (profileImageUrl && profileImageUrl.trim()) {
      singer.profile_image_url = profileImageUrl.trim();
    }

    // Clean up empty names
    Object.keys(singer.names).forEach((key) => {
      if (!singer.names[key] || singer.names[key].trim() === '') {
        delete singer.names[key];
      }
    });

    const json = JSON.stringify(singer, null, 2);
    outputEl.innerHTML = `<code>${escapeHtml(json)}</code>`;
    statusEl.innerHTML =
      '<span class="status-valid">✓ All fields valid - Ready to copy</span>';
    copyBtn.disabled = false;
  } else {
    outputEl.innerHTML =
      '<code>// Fix validation errors to generate JSON</code>';
    const allErrors = [...validation.errors];
    singerErrors.forEach((err) =>
      allErrors.unshift({ field: 'Singer info', message: err })
    );
    statusEl.innerHTML = `
      <span class="status-invalid">✗ Validation errors:</span>
      <ul>
        ${allErrors.map((err) => `<li>${escapeHtml(err.field)}: ${escapeHtml(err.message)}</li>`).join('')}
      </ul>
    `;
    copyBtn.disabled = true;
  }
}

// Escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy JSON to clipboard
async function copyToClipboard(): Promise<void> {
  // Build full singer object
  const cleanVariants = variants.map((v) => {
    const clean: any = { ...v };
    if (clean.tags && clean.tags.length === 0) {
      delete clean.tags;
    }
    return clean;
  });

  const singer: any = {
    id: singerId,
    names: { ...singerNames },
    owners: owners.filter((o) => o.trim()),
    authors: authors.filter((a) => a.trim()),
    variants: cleanVariants,
  };

  if (homepageUrl && homepageUrl.trim()) {
    singer.homepage_url = homepageUrl.trim();
  }
  if (profileImageUrl && profileImageUrl.trim()) {
    singer.profile_image_url = profileImageUrl.trim();
  }

  Object.keys(singer.names).forEach((key) => {
    if (!singer.names[key] || singer.names[key].trim() === '') {
      delete singer.names[key];
    }
  });

  const json = JSON.stringify(singer, null, 2);
  const t = getTranslations();

  try {
    await navigator.clipboard.writeText(json);
    const btn = document.getElementById('copy-json') as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.textContent = t.jsonCopied;
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (err) {
    alert(
      'Failed to copy to clipboard. Please copy manually from the preview.'
    );
  }
}

// Reset form
function resetForm(): void {
  if (confirm('This will clear all data. Are you sure?')) {
    variants = [];
    variantIdCounter = 0;
    document.getElementById('variants-container')!.innerHTML = '';
    localStorage.removeItem('svs-variants-draft');
    addVariant();
  }
}

// Singer names helpers
function updateSingerNamesFromDOM(): void {
  const container = document.getElementById('singer-names-container');
  if (!container) return;
  singerNames = {};
  const pairs = container.querySelectorAll('.name-pair');
  pairs.forEach((pair) => {
    const lang = (
      pair.querySelector('.singer-name-lang') as HTMLInputElement
    )?.value.trim();
    const name = (
      pair.querySelector('.singer-name-value') as HTMLInputElement
    )?.value.trim();
    if (lang) {
      singerNames[lang] = name;
    }
  });
  updateOutput();
}

function addSingerName(): void {
  const container = document.getElementById('singer-names-container');
  if (!container) return;
  const pair = document.createElement('div');
  pair.className = 'name-pair';
  pair.innerHTML = `
    <input type="text" class="singer-name-lang" placeholder="lang" />
    <input type="text" class="singer-name-value" placeholder="Name" />
    <button class="btn-icon btn-remove-singer-name" title="Remove">✕</button>
  `;
  container.appendChild(pair);
  pair
    .querySelectorAll('input')
    .forEach((inp) => inp.addEventListener('input', updateSingerNamesFromDOM));
  pair
    .querySelector('.btn-remove-singer-name')
    ?.addEventListener('click', () => {
      pair.remove();
      updateSingerNamesFromDOM();
    });
}

// Owners helpers
function updateOwnersFromDOM(): void {
  const container = document.getElementById('owners-container');
  if (!container) return;
  const inputs = container.querySelectorAll(
    'input'
  ) as NodeListOf<HTMLInputElement>;
  owners = Array.from(inputs)
    .map((i) => i.value.trim())
    .filter((v) => v);
  updateOutput();
}

function addOwner(): void {
  const container = document.getElementById('owners-container');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <input type="text" placeholder="Owner name" />
    <button class="btn-icon btn-remove-list-item" title="Remove">✕</button>
  `;
  container.appendChild(item);
  item.querySelector('input')?.addEventListener('input', updateOwnersFromDOM);
  item.querySelector('.btn-remove-list-item')?.addEventListener('click', () => {
    item.remove();
    updateOwnersFromDOM();
  });
}

// Authors helpers
function updateAuthorsFromDOM(): void {
  const container = document.getElementById('authors-container');
  if (!container) return;
  const inputs = container.querySelectorAll(
    'input'
  ) as NodeListOf<HTMLInputElement>;
  authors = Array.from(inputs)
    .map((i) => i.value.trim())
    .filter((v) => v);
  updateOutput();
}

function addAuthor(): void {
  const container = document.getElementById('authors-container');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <input type="text" placeholder="Author name" />
    <button class="btn-icon btn-remove-list-item" title="Remove">✕</button>
  `;
  container.appendChild(item);
  item.querySelector('input')?.addEventListener('input', updateAuthorsFromDOM);
  item.querySelector('.btn-remove-list-item')?.addEventListener('click', () => {
    item.remove();
    updateAuthorsFromDOM();
  });
}

// Update UI text based on current language
function updateUIText() {
  const t = getTranslations();

  // Header
  const h1 = document.querySelector('header h1');
  if (h1) h1.textContent = t.singerEditor;

  const subtitle = document.querySelector('header .subtitle');
  if (subtitle) subtitle.textContent = t.singerEditorSubtitle;

  const backLink = document.querySelector('header a[href="index.html"]');
  if (backLink) backLink.textContent = t.backToIndex;

  const resetBtn = document.getElementById('reset-form');
  if (resetBtn) resetBtn.textContent = t.resetForm;

  // Step 1
  const step1Title = document.querySelector('#step-1 h2');
  if (step1Title) step1Title.textContent = t.step1Title;

  const step1Intro = document.querySelector('#step-1 .step-intro');
  if (step1Intro) step1Intro.textContent = t.step1Intro;

  // Step 1 labels
  const singerIdLabel = document.querySelector('label[for="singer-id"]');
  if (singerIdLabel) {
    singerIdLabel.innerHTML = `${t.singerIdLabel} <span class="required">*</span>`;
  }

  const singerIdHint = document.querySelector('label[for="singer-id"]')
    ?.nextElementSibling?.nextElementSibling;
  if (singerIdHint && singerIdHint.tagName === 'SMALL') {
    singerIdHint.textContent = t.singerIdHint;
  }

  // Update other labels and text as needed
  const addNameBtn = document.getElementById('add-singer-name');
  if (addNameBtn) addNameBtn.textContent = t.addName;

  const addOwnerBtn = document.getElementById('add-owner');
  if (addOwnerBtn) addOwnerBtn.textContent = t.addOwner;

  const addAuthorBtn = document.getElementById('add-author');
  if (addAuthorBtn) addAuthorBtn.textContent = t.addAuthor;

  // Step 2
  const step2Title = document.querySelector('#step-2 h2');
  if (step2Title) step2Title.textContent = t.step2Title;

  const step2Intro = document.querySelector('#step-2 .step-intro');
  if (step2Intro) step2Intro.textContent = t.step2Intro;

  const addVariantBtn = document.getElementById('add-variant');
  if (addVariantBtn) addVariantBtn.textContent = t.addVariant;

  // Step 3
  const step3Title = document.querySelector('#step-3 h2');
  if (step3Title) step3Title.textContent = t.step3Title;

  const step3Intro = document.querySelector('#step-3 .step-intro');
  if (step3Intro) step3Intro.textContent = t.step3Intro;

  const copyBtn = document.getElementById('copy-json');
  if (copyBtn && !copyBtn.textContent?.includes('✓')) {
    copyBtn.textContent = t.copyJson;
  }

  // Revalidate to update validation messages
  validateSingerId();
  updateOutput();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set language
  setLanguage(getCurrentLanguage());

  // Update UI text
  updateUIText();

  // Add language selector
  const langContainer = document.getElementById('language-selector-container');
  if (langContainer) {
    langContainer.appendChild(
      createLanguageSelector((lang) => {
        setLanguage(lang);
        updateUIText();
      })
    );
  }

  // Singer ID input listener
  const singerIdInput = document.getElementById(
    'singer-id'
  ) as HTMLInputElement | null;
  singerIdInput?.addEventListener('input', (e) => {
    singerId = (e.target as HTMLInputElement).value.trim();
    validateSingerId();
    updateOutput();
  });

  // Singer names
  const singerNamesContainer = document.getElementById(
    'singer-names-container'
  );
  singerNamesContainer?.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', updateSingerNamesFromDOM);
  });
  singerNamesContainer
    ?.querySelectorAll('.btn-remove-singer-name')
    .forEach((btn) => {
      btn.addEventListener('click', (e) => {
        (e.target as HTMLElement).closest('.name-pair')?.remove();
        updateSingerNamesFromDOM();
      });
    });
  document
    .getElementById('add-singer-name')
    ?.addEventListener('click', addSingerName);

  // Owners
  document.getElementById('add-owner')?.addEventListener('click', () => {
    addOwner();
  });

  // Authors
  document.getElementById('add-author')?.addEventListener('click', () => {
    addAuthor();
  });

  // Homepage & profile image
  document.getElementById('homepage-url')?.addEventListener('input', (e) => {
    homepageUrl = (e.target as HTMLInputElement).value.trim();
    updateOutput();
  });
  document
    .getElementById('profile-image-url')
    ?.addEventListener('input', (e) => {
      profileImageUrl = (e.target as HTMLInputElement).value.trim();
      updateOutput();
    });

  // Load existing singer IDs
  loadExistingSingerIds();

  loadState();

  // Add variant button
  document.getElementById('add-variant')?.addEventListener('click', addVariant);

  // Copy button
  document
    .getElementById('copy-json')
    ?.addEventListener('click', copyToClipboard);

  // Reset button
  document.getElementById('reset-form')?.addEventListener('click', resetForm);
});
