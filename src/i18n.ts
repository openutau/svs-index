// Internationalization (i18n) utilities for SVS Index

export type Language = 'en' | 'ja' | 'zh';

export interface Translations {
  // Common
  appTitle: string;
  appSubtitle: string;
  backToIndex: string;
  loading: string;
  loadFailed: string;

  // Header links
  submitSinger: string;
  submitSoftware: string;
  submitOpenUtauPackage: string;

  // Category selector
  singers: string;
  softwares: string;

  // Search
  searchPlaceholder: string;

  // Status messages
  statusLoadedTemplate: string; // Template: "{0} singers, {1} softwares loaded."

  // Detail page - Singer
  details: string;
  names: string;
  homepage: string;
  owners: string;
  authors: string;
  variants: string;
  downloadPage: string;
  directDownload: string;
  tags: string;

  // Detail page - Software
  category: string;
  developers: string;
  versions: string;
  version: string;
  mirrors: string;
  dependencies: string;

  // Submit page
  singerEditor: string;
  singerEditorSubtitle: string;
  resetForm: string;

  // Step 1
  step1Title: string;
  step1Intro: string;
  singerIdLabel: string;
  singerIdHint: string;
  singerIdValid: string;
  singerIdRequired: string;
  singerIdMinLength: string;
  singerIdPattern: string;
  singerIdExists: string;

  singerNamesLabel: string;
  singerNamesHint: string;
  addName: string;
  removeName: string;

  ownersLabel: string;
  ownersHint: string;
  addOwner: string;
  removeOwner: string;

  authorsLabel: string;
  authorsHint: string;
  addAuthor: string;
  removeAuthor: string;

  homepageUrlLabel: string;
  homepageUrlHint: string;

  profileImageUrlLabel: string;
  profileImageUrlHint: string;

  // Step 2
  step2Title: string;
  step2Intro: string;
  addVariant: string;
  removeVariant: string;

  variantIdLabel: string;
  variantIdHint: string;

  variantNamesLabel: string;

  fileUrlLabel: string;
  fileUrlHint: string;

  downloadPageUrlLabel: string;
  downloadPageUrlHint: string;

  variantTagsLabel: string;
  variantTagsHint: string;
  addTag: string;
  removeTag: string;

  // Step 3
  step3Title: string;
  step3Intro: string;
  validationPassed: string;
  validationFailed: string;
  copyJson: string;
  jsonCopied: string;
  openIssue: string;

  // Validation messages
  required: string;
  invalidUrl: string;
  atLeastOne: string;
  mustStartWith: string;
  duplicate: string;

  // Misc
  optional: string;
  collapse: string;
  expand: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'SVS Index',
    appSubtitle:
      'Community maintained index of Singing Voice Synthesis singers and softwares',
    backToIndex: '← Back to Index',
    loading: 'Loading data…',
    loadFailed: 'Failed to load data.',

    submitSinger: 'Submit Singer',
    submitSoftware: 'Submit Software',
    submitOpenUtauPackage: 'Submit oudep',

    singers: 'Singers',
    softwares: 'Softwares',

    searchPlaceholder: 'Type to filter by id, names, tags',

    statusLoadedTemplate: '{0} singers, {1} softwares loaded.',

    details: 'Details',
    names: 'Names',
    homepage: 'Homepage',
    owners: 'Owners',
    authors: 'Authors',
    variants: 'Variants',
    downloadPage: 'Download page',
    directDownload: 'Direct download',
    tags: 'Tags',

    category: 'Category',
    developers: 'Developers',
    versions: 'Versions',
    version: 'Version',
    mirrors: 'Mirrors',
    dependencies: 'Dependencies',

    singerEditor: 'Singer Editor',
    singerEditorSubtitle: 'Create complete singer JSON for submission',
    resetForm: '🔄 Reset Form',

    step1Title: 'Singer Information',
    step1Intro: 'Provide the basic information for the new singer.',
    singerIdLabel: 'Singer ID',
    singerIdHint:
      'Lowercase letters and numbers separated by hyphens. Must be at least 5 characters and not already used.',
    singerIdValid: '✓ Singer ID is valid & available',
    singerIdRequired: 'Singer ID is required.',
    singerIdMinLength: 'Must be at least 5 characters.',
    singerIdPattern: 'Use lowercase letters, numbers, hyphen separated.',
    singerIdExists: 'This ID already exists. Pick another.',

    singerNamesLabel: 'Singer Names',
    singerNamesHint:
      'At least English name (en) is required. Add names in other languages as needed.',
    addName: '+ Add Name',
    removeName: 'Remove name',

    ownersLabel: 'Owners',
    ownersHint:
      'Companies or individuals who own the rights to this singer. At least one required.',
    addOwner: '+ Add Owner',
    removeOwner: 'Remove owner',

    authorsLabel: 'Authors',
    authorsHint: 'Voice providers or creators. At least one required.',
    addAuthor: '+ Add Author',
    removeAuthor: 'Remove author',

    homepageUrlLabel: 'Homepage URL',
    homepageUrlHint: 'Official website or product page (optional).',

    profileImageUrlLabel: 'Profile Image URL',
    profileImageUrlHint: 'Direct link to profile image (optional).',

    step2Title: 'Variants',
    step2Intro:
      'Add at least one variant. Each variant represents a specific voicebank or version.',
    addVariant: '+ Add Variant',
    removeVariant: 'Remove Variant',

    variantIdLabel: 'Variant ID',
    variantIdHint:
      'Must start with singer ID followed by a hyphen (e.g., singer-id-v1).',

    variantNamesLabel: 'Variant Names',

    fileUrlLabel: 'File URL',
    fileUrlHint:
      'Direct download link. Leave null if unavailable. At least one of File URL or Download Page URL is required.',

    downloadPageUrlLabel: 'Download Page URL',
    downloadPageUrlHint:
      'Manual download page. Leave null if unavailable. At least one of File URL or Download Page URL is required.',

    variantTagsLabel: 'Tags',
    variantTagsHint: 'Optional tags (e.g., vocaloid4, bilingual, etc.).',
    addTag: '+ Add Tag',
    removeTag: 'Remove tag',

    step3Title: 'Generate & Copy JSON',
    step3Intro:
      'Review the generated JSON and copy it to submit via GitHub Issue.',
    validationPassed: '✓ All validation passed',
    validationFailed: '✗ Fix validation errors above',
    copyJson: '📋 Copy JSON to Clipboard',
    jsonCopied: '✓ Copied!',
    openIssue: 'Open GitHub Issue',

    required: 'required',
    invalidUrl: 'Invalid URL',
    atLeastOne: 'At least one required',
    mustStartWith: 'Must start with',
    duplicate: 'Duplicate ID',

    optional: 'optional',
    collapse: 'Collapse',
    expand: 'Expand',
  },

  ja: {
    appTitle: 'SVS Index',
    appSubtitle:
      '歌声合成ソフトウェアの歌手とツールのコミュニティ維持インデックス',
    backToIndex: '← インデックスに戻る',
    loading: 'データ読み込み中…',
    loadFailed: 'データの読み込みに失敗しました。',

    submitSinger: '歌手を投稿',
    submitSoftware: 'ソフトウェアを投稿',
    submitOpenUtauPackage: 'oudepを投稿',

    singers: '歌手',
    softwares: 'ソフトウェア',

    searchPlaceholder: 'ID、名前、タグで絞り込み',

    statusLoadedTemplate: '{0}人の歌手、{1}個のソフトウェアを読み込みました。',

    details: '詳細',
    names: '名前',
    homepage: 'ホームページ',
    owners: '所有者',
    authors: '製作者',
    variants: 'バリエーション',
    downloadPage: 'ダウンロードページ',
    directDownload: '直接ダウンロード',
    tags: 'タグ',

    category: 'カテゴリ',
    developers: '開発者',
    versions: 'バージョン',
    version: 'バージョン',
    mirrors: 'ミラー',
    dependencies: '依存関係',

    singerEditor: '歌手エディター',
    singerEditorSubtitle: '投稿用の完全な歌手JSONを作成',
    resetForm: '🔄 フォームをリセット',

    step1Title: '歌手情報',
    step1Intro: '新しい歌手の基本情報を入力してください。',
    singerIdLabel: '歌手ID',
    singerIdHint:
      '小文字とハイフンで区切られた数字。5文字以上で、まだ使用されていないものを指定してください。',
    singerIdValid: '✓ 歌手IDは有効で利用可能です',
    singerIdRequired: '歌手IDは必須です。',
    singerIdMinLength: '5文字以上である必要があります。',
    singerIdPattern: '小文字、数字、ハイフン区切りを使用してください。',
    singerIdExists: 'このIDは既に存在します。別のものを選択してください。',

    singerNamesLabel: '歌手名',
    singerNamesHint:
      '少なくとも英語名(en)が必要です。必要に応じて他の言語の名前を追加してください。',
    addName: '+ 名前を追加',
    removeName: '名前を削除',

    ownersLabel: '所有者',
    ownersHint:
      'この歌手の権利を所有する企業または個人。少なくとも1つ必要です。',
    addOwner: '+ 所有者を追加',
    removeOwner: '所有者を削除',

    authorsLabel: '製作者',
    authorsHint: '声優または制作者。少なくとも1つ必要です。',
    addAuthor: '+ 製作者を追加',
    removeAuthor: '製作者を削除',

    homepageUrlLabel: 'ホームページURL',
    homepageUrlHint: '公式ウェブサイトまたは製品ページ（任意）。',

    profileImageUrlLabel: 'プロフィール画像URL',
    profileImageUrlHint: 'プロフィール画像への直接リンク（任意）。',

    step2Title: 'バリエーション',
    step2Intro:
      '少なくとも1つのバリエーションを追加してください。各バリエーションは特定の音声ライブラリまたはバージョンを表します。',
    addVariant: '+ バリエーションを追加',
    removeVariant: 'バリエーションを削除',

    variantIdLabel: 'バリエーションID',
    variantIdHint:
      '歌手IDで始まり、ハイフンが続く必要があります（例：singer-id-v1）。',

    variantNamesLabel: 'バリエーション名',

    fileUrlLabel: 'ファイルURL',
    fileUrlHint:
      '直接ダウンロードリンク。利用できない場合はnullのままにしてください。ファイルURLまたはダウンロードページURLの少なくとも1つが必要です。',

    downloadPageUrlLabel: 'ダウンロードページURL',
    downloadPageUrlHint:
      '手動ダウンロードページ。利用できない場合はnullのままにしてください。ファイルURLまたはダウンロードページURLの少なくとも1つが必要です。',

    variantTagsLabel: 'タグ',
    variantTagsHint: 'オプションのタグ（例：vocaloid4、bilingual など）。',
    addTag: '+ タグを追加',
    removeTag: 'タグを削除',

    step3Title: 'JSONを生成してコピー',
    step3Intro:
      '生成されたJSONを確認し、GitHub Issueで投稿するためにコピーしてください。',
    validationPassed: '✓ すべての検証に合格しました',
    validationFailed: '✗ 上記の検証エラーを修正してください',
    copyJson: '📋 JSONをクリップボードにコピー',
    jsonCopied: '✓ コピーしました！',
    openIssue: 'GitHub Issueを開く',

    required: '必須',
    invalidUrl: '無効なURL',
    atLeastOne: '少なくとも1つ必要',
    mustStartWith: '次で始まる必要があります',
    duplicate: '重複したID',

    optional: '任意',
    collapse: '折りたたむ',
    expand: '展開',
  },

  zh: {
    appTitle: 'SVS Index',
    appSubtitle: '社区维护的歌声合成软件歌手和工具索引',
    backToIndex: '← 返回索引',
    loading: '加载数据中…',
    loadFailed: '加载数据失败。',

    submitSinger: '提交歌手',
    submitSoftware: '提交软件',
    submitOpenUtauPackage: '提交 oudep',

    singers: '歌手',
    softwares: '软件',

    searchPlaceholder: '按ID、名称、标签筛选',

    statusLoadedTemplate: '{0}位歌手，{1}个软件已加载。',

    details: '详情',
    names: '名称',
    homepage: '主页',
    owners: '所有者',
    authors: '作者',
    variants: '变体',
    downloadPage: '下载页面',
    directDownload: '直接下载',
    tags: '标签',

    category: '分类',
    developers: '开发者',
    versions: '版本',
    version: '版本',
    mirrors: '镜像',
    dependencies: '依赖',

    singerEditor: '歌手编辑器',
    singerEditorSubtitle: '创建完整的歌手JSON以提交',
    resetForm: '🔄 重置表单',

    step1Title: '歌手信息',
    step1Intro: '提供新歌手的基本信息。',
    singerIdLabel: '歌手ID',
    singerIdHint: '小写字母和数字，用连字符分隔。必须至少5个字符且未被使用。',
    singerIdValid: '✓ 歌手ID有效且可用',
    singerIdRequired: '歌手ID是必需的。',
    singerIdMinLength: '必须至少5个字符。',
    singerIdPattern: '使用小写字母、数字和连字符分隔。',
    singerIdExists: '此ID已存在。请选择另一个。',

    singerNamesLabel: '歌手名称',
    singerNamesHint: '至少需要英文名称（en）。根据需要添加其他语言的名称。',
    addName: '+ 添加名称',
    removeName: '删除名称',

    ownersLabel: '所有者',
    ownersHint: '拥有此歌手权利的公司或个人。至少需要一个。',
    addOwner: '+ 添加所有者',
    removeOwner: '删除所有者',

    authorsLabel: '作者',
    authorsHint: '配音演员或创作者。至少需要一个。',
    addAuthor: '+ 添加作者',
    removeAuthor: '删除作者',

    homepageUrlLabel: '主页URL',
    homepageUrlHint: '官方网站或产品页面（可选）。',

    profileImageUrlLabel: '头像图片URL',
    profileImageUrlHint: '头像图片的直接链接（可选）。',

    step2Title: '变体',
    step2Intro: '至少添加一个变体。每个变体代表一个特定的音源库或版本。',
    addVariant: '+ 添加变体',
    removeVariant: '删除变体',

    variantIdLabel: '变体ID',
    variantIdHint: '必须以歌手ID开头，后跟连字符（例如：singer-id-v1）。',

    variantNamesLabel: '变体名称',

    fileUrlLabel: '文件URL',
    fileUrlHint:
      '直接下载链接。如果不可用，保留为null。文件URL或下载页面URL至少需要一个。',

    downloadPageUrlLabel: '下载页面URL',
    downloadPageUrlHint:
      '手动下载页面。如果不可用，保留为null。文件URL或下载页面URL至少需要一个。',

    variantTagsLabel: '标签',
    variantTagsHint: '可选标签（例如：vocaloid4、bilingual等）。',
    addTag: '+ 添加标签',
    removeTag: '删除标签',

    step3Title: '生成并复制JSON',
    step3Intro: '查看生成的JSON并复制以通过GitHub Issue提交。',
    validationPassed: '✓ 所有验证通过',
    validationFailed: '✗ 修复上述验证错误',
    copyJson: '📋 复制JSON到剪贴板',
    jsonCopied: '✓ 已复制！',
    openIssue: '打开GitHub Issue',

    required: '必需',
    invalidUrl: '无效的URL',
    atLeastOne: '至少需要一个',
    mustStartWith: '必须以此开头',
    duplicate: '重复的ID',

    optional: '可选',
    collapse: '折叠',
    expand: '展开',
  },
};

// Language management
const STORAGE_KEY = 'svs-index-language';

export function getCurrentLanguage(): Language {
  // Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && (stored === 'en' || stored === 'ja' || stored === 'zh')) {
    return stored;
  }

  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export function setLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export function getTranslations(lang?: Language): Translations {
  return translations[lang || getCurrentLanguage()];
}

// Helper to create language selector
export function createLanguageSelector(
  onLanguageChange?: (lang: Language) => void
): HTMLDivElement {
  const currentLang = getCurrentLanguage();

  const selector = document.createElement('div');
  selector.className = 'language-selector';

  const languages: Array<{ code: Language; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ];

  languages.forEach(({ code, label }) => {
    const button = document.createElement('button');
    button.textContent = label;
    button.dataset.lang = code;
    if (code === currentLang) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      setLanguage(code);
      selector
        .querySelectorAll('button')
        .forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      if (onLanguageChange) {
        onLanguageChange(code);
      }
    });

    selector.appendChild(button);
  });

  return selector;
}
