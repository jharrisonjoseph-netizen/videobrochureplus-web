import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

const pages = [
  'index.html',
  '404.html',
  'video-brochure.html',
  'video-mailers.html',
  'video-box.html',
  'video-greeting-card.html',
  'video-business-cards.html',
  'video-folders.html',
  'video-wedding-invitations.html',
  'video-brochure-sizes.html',
  'video-brochure-cost.html',
  'video-brochure-samples.html',
  'artwork-video-guide.html',
  'manufacturing-process.html',
  'about.html'
];

const assets = [
  'assets/favicon.svg',
  'assets/vbp-logo-116.webp',
  'assets/video-brochure-plus.mp4',
  ...['10-1', '2.4-1', '2.4-2', '2.4-3', '2.4-4', '2.4-5', '2.4-6', '4-3', '5-0', '7-0']
    .flatMap(name => [`assets/product-${name}-480.webp`, `assets/product-${name}-960.webp`])
];

const publicFiles = [
  ...pages,
  ...assets,
  'app.js',
  'forms-core.mjs',
  'form-config.mjs',
  'seo-pages.css',
  'site-improvements.css',
  'robots.txt',
  'sitemap.xml',
  'llms.txt'
];

await rm('dist', { recursive: true, force: true });
for (const source of publicFiles) {
  const destination = `dist/${source}`;
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Prepared ${publicFiles.length} public files in dist/.`);
