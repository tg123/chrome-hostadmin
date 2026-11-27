// Builds the extension into dist/chrome and dist/firefox.
//
//   node scripts/build.mjs           one-off build
//   node scripts/build.mjs --watch   rebuild on change
import * as esbuild from 'esbuild';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const watch = process.argv.includes('--watch');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

// Public key only; it pins the unpacked extension ID to the one the native
// host allows by default (see native-host/internal/install).
const CHROME_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtvL/Lv+jmfsvA6xRygYQjoshSQzzkwR8+n2kizoFKglzFpMpIQbEJQSavFSCrHb0BJ2nvaU9wq3OYljmajOeYCRxR5RmvSMAAYKYPS7I0DDMHKtvYytEn96BIkZG0pW76x71WxfnDddRgc19YMhjBBmxuO71GpdAAtO9zsVeKBq+F9e3crMCQhkEGzK90nT2epm1XLLy2lJhtv80Ae2D8hBRw6wdWE8ZBtVjJ4rWn1Tv1ZL/cV2DlRWPxMHjbREzg7ZNEcIo+7R1dS0MH8D7hLExjrsU8Y3WT8N+w7KGwFSun1EFzRyhXVKgndzGy7iwIZL841EQiI0rVDZ4EJEA6wIDAQAB';
const FIREFOX_ID = '{bd54afa8-b14a-4d7a-aecf-37e34e882796}';

const targets = {
  chrome: {
    esTarget: 'chrome120',
    manifest: (m) => ({
      ...m,
      key: CHROME_KEY,
      minimum_chrome_version: '120',
      background: { service_worker: 'background.js' },
    }),
  },
  firefox: {
    esTarget: 'firefox140',
    manifest: (m) => ({
      ...m,
      background: { scripts: ['background.js'] },
      browser_specific_settings: {
        gecko: {
          id: FIREFOX_ID,
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  },
};

const STATIC = [
  'icons',
  'common.css',
  'popup/popup.html',
  'popup/popup.css',
  'editor/editor.html',
  'editor/editor.css',
];

async function buildTarget(name, { esTarget, manifest }) {
  const out = path.join(root, 'dist', name);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const item of STATIC) {
    await cp(path.join(src, item), path.join(out, item), { recursive: true });
  }

  const base = JSON.parse(await readFile(path.join(src, 'manifest.json'), 'utf8'));
  await writeFile(
    path.join(out, 'manifest.json'),
    JSON.stringify(manifest({ ...base, version: pkg.version }), null, 2) + '\n',
  );

  const options = {
    entryPoints: {
      background: path.join(src, 'background/index.js'),
      'popup/popup': path.join(src, 'popup/popup.js'),
      'editor/editor': path.join(src, 'editor/editor.js'),
    },
    outdir: out,
    bundle: true,
    format: 'iife',
    target: esTarget,
    minify: !watch,
    sourcemap: watch ? 'inline' : false,
    legalComments: 'none',
    metafile: true,
    logLevel: 'info',
  };

  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    const result = await esbuild.build(options);
    await writeNotices(result.metafile, path.join(out, 'THIRD_PARTY_NOTICES.txt'));
  }
}

// Bundled dependencies carry no license comments, so ship their licenses alongside.
async function writeNotices(metafile, file) {
  const packages = new Set();
  for (const input of Object.keys(metafile.inputs)) {
    const m = /node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(input);
    if (m) packages.add(m[1]);
  }
  const sections = [];
  for (const name of [...packages].sort()) {
    const dir = path.join(root, 'node_modules', name);
    const { version, license } = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
    const licenseFile = (await readdir(dir)).find((f) => /^licen[cs]e/i.test(f));
    const text = licenseFile ? await readFile(path.join(dir, licenseFile), 'utf8') : `License: ${license}`;
    sections.push(`${name}@${version}\n${'='.repeat(name.length + version.length + 1)}\n\n${text.trim()}\n`);
  }
  await writeFile(file, sections.join('\n\n'));
}

for (const [name, target] of Object.entries(targets)) {
  await buildTarget(name, target);
}
if (watch) console.log('Watching for changes… (static files are copied only at startup)');
