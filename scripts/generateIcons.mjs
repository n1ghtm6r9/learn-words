import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const outDir = process.env.OUT_DIR ?? 'public';

const icons = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  { file: 'icon-maskable-192.png', size: 192, rounded: false, scale: 0.74 },
  { file: 'icon-maskable-512.png', size: 512, rounded: false, scale: 0.74 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 0.94 },
];

function iconSvg({ size, rounded, scale }) {
  const corner = rounded ? 116 : 0;
  const shift = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#666bf3"/>
      <stop offset="1" stop-color="#3a30b5"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="lift" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#150f5c" flood-opacity="0.38"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="${corner}" fill="url(#ink)"/>
  <rect width="512" height="512" rx="${corner}" fill="url(#glow)"/>
  <g transform="translate(${shift} ${shift}) scale(${scale}) translate(-16 -6)">
    <rect x="112" y="150" width="196" height="244" rx="34" fill="#ffd84a" transform="rotate(-14 210 272)" filter="url(#lift)"/>
    <rect x="176" y="118" width="216" height="268" rx="38" fill="#ffffff" filter="url(#lift)"/>
    <g fill="none" stroke="#3a30b5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M226 318 L284 170 L342 318" stroke-width="36"/>
      <path d="M250 268 H318" stroke-width="30"/>
    </g>
    <rect x="224" y="340" width="120" height="24" rx="12" fill="#f3ba26"/>
  </g>
</svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const icon of icons) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${iconSvg(icon)}</body></html>`);
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: icon.size, height: icon.size },
    omitBackground: icon.rounded,
    type: 'png',
  });
  writeFileSync(`${outDir}/${icon.file}`, png);
}

await browser.close();
