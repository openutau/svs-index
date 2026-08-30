// Shared rule: a `file_url` must be a *direct download* link. File-host web
// pages (viewer/share/landing pages that need a click to download) belong in
// `download_page_url` instead.
//
// Used by shared/singer-validation.js and shared/software-validation.js.
// Plain ESM JavaScript on purpose (see the headers of those modules).
//
// This is a domain denylist, not a full "is this a file" probe — it catches
// the known file hosts whose share links are always web pages, plus a generic
// guard against document extensions. The runtime link probe in
// scripts/process-issue.js remains the backstop for everything else.

/** Hosts whose share/viewer URLs are always web pages, never direct files. */
const WEB_PAGE_HOSTS = [
  /^drive\.google\.com$/,
  /^docs\.google\.com$/,
  /^bowlroll\.net$/,
  /^mega\.nz$/,
  /^onedrive\.live\.com$/,
  /^1drv\.ms$/,
];

/** Document extensions that a direct file download should never have. */
const DOCUMENT_EXT = /\.(html?|php)$/i;

/**
 * Check a candidate direct-download URL against the file-host web-page rules.
 *
 * @param {string | null | undefined} url
 * @returns {string | null} The offending hostname if the URL is a file-host
 *   web page, otherwise null (including unparseable/absent URLs — those are
 *   the schema's concern, not this rule's).
 */
export function fileUrlWebHost(url) {
  if (typeof url !== 'string' || !url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (WEB_PAGE_HOSTS.some((re) => re.test(host))) return host;
  // Dropbox share links only serve a direct download with ?dl=1.
  if (host === 'dropbox.com' && u.searchParams.get('dl') !== '1') return host;
  if (DOCUMENT_EXT.test(u.pathname)) return host;
  return null;
}
