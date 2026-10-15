import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, 'icon-source.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512, padding: 64 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size, padding = 0 } of sizes) {
  const inner = size - padding * 2;
  const buf = await sharp(src).resize(inner, inner).toBuffer();
  if (padding > 0) {
    await sharp({
      create: { width: size, height: size, channels: 4, background: '#234386' },
    })
      .composite([{ input: buf, left: padding, top: padding }])
      .png()
      .toFile(path.join(outDir, name));
  } else {
    await sharp(buf).png().toFile(path.join(outDir, name));
  }
  console.log('wrote', name);
}
