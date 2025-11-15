import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFilesWithHashes(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return {
      file,
      hash,
    };
  });
}

function generateManifest() {
  const dataDir = path.join(__dirname, '..', 'data');
  const singersDir = path.join(dataDir, 'singers');
  const softwaresDir = path.join(dataDir, 'softwares');

  const manifest = {
    singers: getFilesWithHashes(singersDir),
    softwares: getFilesWithHashes(softwaresDir),
  };

  return manifest;
}

function injectManifestIntoHTML(htmlPath, manifest) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const manifestScript = `    <script>
      window.DATA_MANIFEST = ${JSON.stringify(manifest, null, 6)};
    </script>`;

  // Replace existing manifest or inject before main script
  if (html.includes('window.DATA_MANIFEST')) {
    html = html.replace(
      /<script>\s*window\.DATA_MANIFEST[\s\S]*?<\/script>/,
      manifestScript
    );
  } else {
    html = html.replace(
      /(\s*)<script type="module" src="\/src\/main\.ts"><\/script>/,
      `${manifestScript}\n$1<script type="module" src="/src/main.ts"></script>`
    );
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
}

function main() {
  const manifest = generateManifest();
  console.log('Generated manifest:');
  console.log(JSON.stringify(manifest, null, 2));

  // Inject into both HTML files
  const indexPath = path.join(__dirname, '..', 'index.html');
  const detailPath = path.join(__dirname, '..', 'detail.html');

  injectManifestIntoHTML(indexPath, manifest);
  console.log(`✅ Updated ${indexPath}`);

  injectManifestIntoHTML(detailPath, manifest);
  console.log(`✅ Updated ${detailPath}`);
}

main();
