/** Dev-only: crop an arbitrary region out of a mockup for close inspection. */
import sharp from 'sharp'
import path from 'node:path'

const [src, left, top, width, height, out, scale = '3'] = process.argv.slice(2)

if (!src || !out) {
  console.error('usage: node scripts/crop-preview.mjs <mockup.png> <l> <t> <w> <h> <out.png> [scale]')
  process.exit(1)
}

await sharp(src)
  .extract({ left: +left, top: +top, width: +width, height: +height })
  .resize({ width: Math.round(+width * +scale), kernel: 'nearest' })
  .png()
  .toFile(path.resolve(out))

console.log(`-> ${out}`)
