/**
 * Generates public/og.jpg (1200×630) — the social preview used by
 * Facebook/Google ads, link shares, and messengers.
 *
 * Run after changing the title/copy below:
 *   npm i -D sharp && node scripts/generate-og.mjs
 *
 * Text is rendered from the locally installed Onest font if available
 * (falls back to any sans-serif with Cyrillic support, e.g. DejaVu Sans).
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const W = 1200;
const H = 630;

const bg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FE7B02"/>
      <stop offset=".45" stop-color="#FF4E8E"/>
      <stop offset=".72" stop-color="#7C5CFF"/>
      <stop offset="1" stop-color="#4B73FF"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FE7B02"/>
      <stop offset=".42" stop-color="#FF4E8E"/>
      <stop offset=".8" stop-color="#7C5CFF"/>
      <stop offset="1" stop-color="#4B73FF"/>
    </linearGradient>
    <radialGradient id="orb" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FF4E8E" stop-opacity=".85"/>
      <stop offset=".55" stop-color="#7C5CFF" stop-opacity=".5"/>
      <stop offset="1" stop-color="#7C5CFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FE7B02" stop-opacity=".55"/>
      <stop offset="1" stop-color="#FE7B02" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="photoOrb" x1="0" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#FE7B02"/>
      <stop offset=".45" stop-color="#FF4E8E"/>
      <stop offset="1" stop-color="#7C5CFF"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#17150F"/>
  <circle cx="1150" cy="40" r="380" fill="url(#orb)"/>
  <circle cx="60" cy="620" r="330" fill="url(#orb2)"/>

  <!-- photo backdrop circle (photo composited on top by sharp) -->
  <circle cx="985" cy="470" r="205" fill="url(#photoOrb)"/>

  <!-- logo -->
  <rect x="64" y="56" width="56" height="56" rx="16" fill="url(#brand)"/>
  <path d="M78 91c5.2 0 5.2-14 10.4-14s5.2 14 10.4 14 5.2-14 10.4-14 5.2 14 10.4 14"
        fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <text x="140" y="94" font-family="Onest, DejaVu Sans, sans-serif" font-weight="700"
        font-size="30" fill="#ffffff">Vibe Coding <tspan fill="#FF8FB5">· Lovable</tspan></text>

  <!-- live pill -->
  <rect x="64" y="168" width="426" height="52" rx="26" fill="#ffffff" fill-opacity=".07"
        stroke="#ffffff" stroke-opacity=".22"/>
  <circle cx="94" cy="194" r="7" fill="#FE7B02"/>
  <text x="112" y="203" font-family="Onest, DejaVu Sans, sans-serif" font-weight="700"
        font-size="24" fill="#f4e9e0">Безплатен уебинар на живо · 1 час</text>

  <!-- title -->
  <text x="60" y="330" font-family="Onest, DejaVu Sans, sans-serif" font-weight="800"
        font-size="94" letter-spacing="-3" fill="#ffffff">Вайб коудинг</text>
  <text x="60" y="432" font-family="Onest, DejaVu Sans, sans-serif" font-weight="800"
        font-size="94" letter-spacing="-3" fill="#ffffff">с <tspan fill="url(#title)">Lovable</tspan></text>

  <!-- subtitle -->
  <text x="64" y="500" font-family="Onest, DejaVu Sans, sans-serif" font-weight="500"
        font-size="30" fill="#c9c4b8">Създавай приложения без да пишеш код.</text>

  <!-- bonus chip -->
  <rect x="64" y="532" width="560" height="54" rx="14" fill="url(#brand)"/>
  <text x="88" y="568" font-family="Onest, DejaVu Sans, sans-serif" font-weight="700"
        font-size="26" fill="#ffffff">Бонус: 10 готови промпта за Lovable</text>
</svg>`;

// Clip the portrait's sides to the backdrop circle, but leave a central
// column unmasked so the head pops out above the circle instead of being
// cut flat at its edge.
const PHOTO = 470;
const circleMask = Buffer.from(
  `<svg width="${PHOTO}" height="${PHOTO}">
     <circle cx="${PHOTO / 2}" cy="${PHOTO - 205}" r="205" fill="#fff"/>
     <rect x="90" y="0" width="290" height="${PHOTO - 205}" fill="#fff"/>
     <rect y="${PHOTO - 205}" width="${PHOTO}" height="205" fill="#fff"/>
   </svg>`
);

const portrait = await sharp(path.join(root, 'public/assets/radoslav-cutout.webp'))
  .resize({ width: PHOTO })
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

await sharp(Buffer.from(bg))
  .composite([{ input: portrait, left: 985 - PHOTO / 2, top: H - PHOTO }])
  .flatten()
  .jpeg({ quality: 88 })
  .toFile(path.join(root, 'public/og.jpg'));

console.log('public/og.jpg generated (1200×630)');
