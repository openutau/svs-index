# SVS Index

A searchable index of Singing Voice Synthesizer (SVS) singers and software. 

## Contributing

We welcome contributions! The flow differs slightly for singers vs software.

### Singer Submission Flow

**Use the Singer Editor** to avoid JSON formatting errors:

1. Click **Submit Singer** from the [index page](https://openutau.github.io/svs-index/) (opens the Singer Editor).
2. **Step 1 - Singer Information**: Fill out basic details:
   - Unique ID (5+ chars, lowercase hyphenated, checked against database)
   - Names in multiple languages (English required, Japanese/Chinese pre-populated)
   - Owners and authors (at least one each required)
   - Optional homepage and profile image URLs
3. **Step 2 - Variants**: Add one or more voicebank variants:
   - Variant IDs must start with the singer ID (e.g., `singer-id-v1`, `singer-id-v2`)
   - Each variant needs names (English required, other languages optional)
   - At least one of File URL or Download Page URL must be provided per variant
   - Optional tags (e.g., `vocaloid4`, `bilingual`)
4. **Step 3 - Generate JSON**: Review validation and copy the complete singer JSON.
5. Open the [GitHub Singer submission issue](https://github.com/openutau/svs-index/issues/new?template=singer-submission.yml) and paste the JSON into the single field.
6. Submit the issue. Automation will validate and create a PR for review.

**Why use the editor?**
- Real-time validation prevents errors
- ID uniqueness checked automatically
- Auto-save to browser prevents data loss
- Correct JSON structure guaranteed

### Software Submission Flow

**Basic Submission (via GitHub Issue):**
1. Click **Submit Software** from the index page.
2. Fill out basic information: ID, names, category, developers, download page URL, and tags.
3. Submit the issue. Automation validates and opens a PR for review.

**Advanced Details (via Pull Request):**
For complex information like versioned downloads with mirrors, file hashes, and dependencies, submit a PR directly modifying the software JSON file.

### Automation

For valid submissions our GitHub Action will:
- Validate your data
- Create a pull request automatically
- Notify you if changes are needed

## Data Schema

### Categories

Software can be categorized as:
- `host` - Main synthesis engine/editor
- `host_extension` - Plugins or extensions
- `utility` - Supporting tools

### Tags

Use tags to add searchable metadata:
- Engine types: `vocaloid`, `utau`, `synthesizer-v`, `diffsinger`, etc.
- Language: `lang:en`, `lang:ja`, `lang:zh` (see [ISO 639 language codes](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes))
- UTAU specific: `multipitch`, `vcv`, `arpasing`, etc.
- License: `commercial`, `free`, `open-source`
- Misc: `bundle`, `female`, `male`, etc.

## License

This project is open source and available under the MIT License.

## Credits

Built with:
- [Vite](https://vite.dev/) - Fast build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Client-side storage

---

**Maintained by the OpenUTAU community** | [Report an Issue](https://github.com/openutau/svs-index/issues)
