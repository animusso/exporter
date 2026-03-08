import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

const sharedConfig = {
  bundle: true,
  sourcemap: true,
  minify: false,
  platform: 'browser',
  target: 'es2022',
  format: 'esm',
  splitting: false,
  logLevel: 'info',
};

const contexts = [
  {
    ...sharedConfig,
    entryPoints: ['src/background/background.ts'],
    outdir: 'dist/background',
  },
  {
    ...sharedConfig,
    entryPoints: ['src/popup/index.ts'],
    outdir: 'dist/popup',
  },
];

function copyManifest() {
  const manifest = readFileSync(resolve(__dirname, 'manifests', 'manifest.json'), 'utf-8');
  const distPath = resolve(__dirname, 'dist');
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }
  writeFileSync(resolve(distPath, 'manifest.json'), manifest);
  console.log('Manifest copied to dist/manifest.json');
}

function copyPopupHtml() {
  const distPopup = resolve(__dirname, 'dist', 'popup');
  if (!existsSync(distPopup)) {
    mkdirSync(distPopup, { recursive: true });
  }
  copyFileSync(
    resolve(__dirname, 'src', 'popup', 'popup.html'),
    resolve(distPopup, 'popup.html')
  );
  console.log('popup.html copied to dist/popup/');
}

async function build() {
  try {
    if (isWatch) {
      console.log('Starting watch mode...');
      const ctxs = await Promise.all(
        contexts.map(config => esbuild.context(config))
      );
      await Promise.all(ctxs.map(ctx => ctx.watch()));
      copyManifest();
      copyPopupHtml();
      console.log('Watching for changes...');
    } else {
      await Promise.all(
        contexts.map(config => esbuild.build(config))
      );
      copyManifest();
      copyPopupHtml();
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
