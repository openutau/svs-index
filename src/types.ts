export type LangCode = string; // ISO 639-1 preferred

export interface NamesMap {
  [lang: LangCode]: string;
}

export interface SingerVariant {
  id: string;
  names: NamesMap;
  file_url: string | null;
  download_page_url: string | null;
  tags?: string[];
}

export interface Singer {
  id: string;
  names: NamesMap; // must include 'en'
  owners: string[];
  authors: string[];
  homepage_url?: string;
  profile_image_url?: string | null;
  variants: SingerVariant[]; // min length 1
}

export type SoftwareCategory = 'host' | 'host_extension' | 'utility';

export interface SoftwareMirror {
  url: string;
  hash: string | null;
}

export interface SoftwareDependency {
  id: string;
  min_version: string;
}

export interface SoftwareVersion {
  version: string;
  mirrors: SoftwareMirror[];
  dependencies?: SoftwareDependency[];
}

export interface Software {
  id: string;
  names: NamesMap; // must include 'en'
  category: SoftwareCategory;
  developers: string[];
  homepage_url?: string;
  download_page_url?: string | null;
  tags?: string[];
  versions?: SoftwareVersion[];
}

export type Category = 'singer' | 'software';

export interface DataManifestEntry {
  file: string; // e.g. 'h.json'
  hash: string; // sha256 hash of file content
}

export interface DataManifest {
  singers: DataManifestEntry[];
  softwares: DataManifestEntry[];
}

export interface SearchIndex {
  singers: Singer[];
  softwares: Software[];
}
