# Submitting an OpenUtau Package (oudep)

An **OpenUtau Package** is a Software entry whose download is a `.oudep` file — an
OpenUtau dependency such as a phoneme dictionary, vocoder, or pitch extractor.
OpenUtau's package manager fetches the index registry and lists these packages so
users can install them in one click.

Unlike a plain software listing, an oudep package carries versioned downloads,
mirror URLs, and file hashes. The
[software submission issue form](https://github.com/openutau/svs-index/issues/new?template=software-submission.yml)
**cannot capture those fields**, so an oudep package is added by editing the
software data directly in a **pull request** — not through the issue form.

> This guide covers everything that goes into the index JSON. It does **not**
> cover building the `.oudep` archive itself; it assumes the `.oudep` file already
> exists and is published at a stable download URL (e.g. a GitHub release asset).

## Where the entry goes

Software entries live in `data/softwares/`, split into one file per starting
letter of the `id`. The file is a JSON **array** of software objects.

- `id` starting with `g` → `data/softwares/g.json`
- `id` starting with `r` → `data/softwares/r.json`

Append your object to the matching letter file. If no file exists for that letter
yet, create it containing a single-element array.

A build step aggregates every letter file into
`registry/v1/softwares/all.json`, which is the URL OpenUtau reads — you do not
edit that file by hand.

## Required fields

Every entry must have `id`, `names`, `category`, and `developers`. For an oudep
package you also need `versions` and the `oudep` tag.

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Lowercase alphanumeric segments joined by `-`, `_`, or `.` (`^[a-z0-9]+(?:[._-][a-z0-9]+)*$`). Must be unique across all software. **Must equal the `id` inside the package's `oudep.yaml`.** |
| `names` | yes | Map of ISO 639-1 language code → name. `en` is required. |
| `category` | yes | One of `host`, `host_extension`, `utility`. Dependencies are usually `host_extension`. |
| `developers` | yes | Array of author / team names. |
| `homepage_url` | no | Project page (e.g. the GitHub repo). |
| `download_page_url` | no | A page a user opens to download manually. Leave `null` (or omit) for oudep packages — the file is reached through `versions`, not this field. |
| `tags` | **yes for oudep** | Must include `"oudep"` (see below). |
| `versions` | **yes for oudep** | Versioned downloads. See below. |

### The `oudep` tag is required

OpenUtau builds its package list by keeping **only** registry entries whose `tags`
array contains `"oudep"`. **If you omit this tag, OpenUtau never shows the
package**, no matter how correct the rest of the entry is. Add any other
descriptive tags (`vocoder`, `g2p`, `openutau`, `lang:en`, …) alongside it.

### `versions`, `mirrors`, and `hash`

```json
"versions": [
  {
    "version": "1.0",
    "mirrors": [
      {
        "url": "https://github.com/owner/repo/releases/download/1.0/thing_v1.0.oudep",
        "hash": "sha256:dbf4bcc1577c4c5640ba3db3bd299ab73057b4fdf33dde735596cb318f827e47"
      }
    ]
  }
]
```

- `version` — the package version. **Must equal the `version` inside the
  package's `oudep.yaml`.** Use a dotted, parseable form (e.g. `1.0`, `2.1.0`) so
  OpenUtau can pick the highest version.
- `mirrors` — at least one. OpenUtau downloads **the first mirror** of the highest
  version, so list the most reliable URL first. Each mirror needs a `url` and a
  `hash`.
- `url` — a direct link to the `.oudep` file (a download that returns the file,
  not a landing page).
- `hash` — the SHA-256 of the exact file, prefixed with **`sha256:`**. OpenUtau
  recomputes this after download and **refuses to install on a mismatch**, so
  regenerate it whenever you re-upload the file.

### `dependencies` (optional)

If the package needs another package present, declare it per version:

```json
"versions": [
  {
    "version": "1.0",
    "mirrors": [ ... ],
    "dependencies": [
      { "id": "other-package", "min_version": ">=1.0.0" }
    ]
  }
]
```

`id` is the other software's `id`; `min_version` is a version or constraint
(`1.0.0`, `>=1.0.0`, `<2.0.0`).

## The package ↔ entry contract

OpenUtau cross-checks the entry against the downloaded `.oudep` and rejects
installs that don't line up. Before opening the PR, confirm:

1. The entry's `tags` contains `"oudep"`.
2. The entry's `id` matches the `id` in the package's `oudep.yaml`.
3. The selected version's `version` matches the `version` in `oudep.yaml`.
4. Each mirror `hash` is `sha256:` + the real SHA-256 of the file at that `url`.

## Full example

```json
{
  "id": "g2p-cmudict-07b",
  "names": { "en": "g2p-cmudict-07b" },
  "category": "host_extension",
  "developers": ["StAkira"],
  "homepage_url": "https://github.com/openutau/g2p",
  "download_page_url": null,
  "tags": ["openutau", "oudep", "g2p"],
  "versions": [
    {
      "version": "1.0",
      "mirrors": [
        {
          "url": "https://github.com/openutau/g2p/releases/download/1.0/g2p-cmudict-07b_v1.0.oudep",
          "hash": "sha256:dbf4bcc1577c4c5640ba3db3bd299ab73057b4fdf33dde735596cb318f827e47"
        }
      ]
    }
  ]
}
```

## Opening the pull request

1. Fork the repository and create a branch.
2. Add or edit your entry in the matching `data/softwares/<letter>.json` file,
   keeping the file a valid JSON array.
3. **Validate it before opening the PR**: run `npm run validate` (checks every data
   file against [`data/software-schema.json`](../data/software-schema.json) and the
   shared validation rules), and walk the
   [contract](#the-package--entry-contract) above by hand — the schema can't check
   the `oudep.yaml` ↔ entry match or the hash for you.
4. Open a pull request. CI re-runs the validation on the data files you changed and
   gates the PR; a maintainer then reviews and merges. On merge, the deploy build
   rebuilds the registry and OpenUtau will list the package.
