export type LangCode = string; // ISO 639-1 preferred

export interface NamesMap {
  [lang: LangCode]: string;
}

export interface SingerVariant {
  id: string;
  names: NamesMap;
  download_url: string | null;
  manual_download_url: string | null;
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

export interface Software {
  id: string;
  names: NamesMap;
  category: SoftwareCategory;
  developers: string[];
  homepage_url?: string;
  download_url?: string | null;
  manual_download_url?: string | null;
  tags?: string[];
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
