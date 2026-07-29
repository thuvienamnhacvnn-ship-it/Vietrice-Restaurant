/**
 * Extracts production image assets out of the six 1672x941 design mockups in
 * `E:\Works\DX media\Image DX` and writes them to `public/images`.
 *
 * The mockups are full-page design screenshots, not a photo library, so every
 * real photograph in the design has to be cut out of them. Crop rectangles are
 * expressed in the mockups' native 1672x941 coordinate space.
 *
 * Ingredient cut-outs use a luminance->alpha key: the mockup background is
 * near-black, so darkness maps to transparency. That makes generous crop
 * bounds safe — stray background simply becomes transparent.
 *
 * Run with: npm run assets
 * Override the source folder with: SOURCE_DIR="D:\somewhere" npm run assets
 */
import { mkdir, readdir, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = process.env.SOURCE_DIR || 'E:\\Works\\DX media\\Image DX'
const OUT = path.resolve(process.cwd(), 'public', 'images')

/** Mockup files are timestamp-named; map them by their sorted order. */
const MOCKUP_ORDER = ['home', 'reservation', 'menu', 'promotions', 'gallery', 'assistant']

/** @type {Record<string,string>} */
const src = {}

async function resolveSources() {
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(
      `Source folder not found: ${SOURCE_DIR}\n` +
        `Set SOURCE_DIR to the folder holding the VIET RICE design mockups.`,
    )
  }
  const files = await readdir(SOURCE_DIR)
  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png')).sort()
  if (pngs.length < MOCKUP_ORDER.length) {
    throw new Error(`Expected ${MOCKUP_ORDER.length} mockup PNGs, found ${pngs.length}`)
  }
  MOCKUP_ORDER.forEach((key, i) => {
    src[key] = path.join(SOURCE_DIR, pngs[i])
  })
  const svg = files.find((f) => f.toLowerCase().endsWith('.svg'))
  if (svg) src.logo = path.join(SOURCE_DIR, svg)
}

/** @param {string} rel */
async function ensureDir(rel) {
  await mkdir(path.join(OUT, rel), { recursive: true })
}

/**
 * Crop a rectangle out of a mockup and write it as a JPEG photograph.
 * @param {string} mockup key in `src`
 * @param {[number,number,number,number]} rect [left, top, width, height]
 * @param {string} out relative output path under public/images
 * @param {{width?:number, quality?:number}} [opts]
 */
async function photo(mockup, rect, out, opts = {}) {
  const [left, top, width, height] = rect
  const dest = path.join(OUT, out)
  await mkdir(path.dirname(dest), { recursive: true })
  let pipe = sharp(src[mockup]).extract({ left, top, width, height })
  if (opts.width) pipe = pipe.resize({ width: opts.width, withoutEnlargement: false })
  await pipe
    .jpeg({ quality: opts.quality ?? 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(dest)
  console.log(`  photo  ${out}  (${width}x${height})`)
}

/**
 * Crop a rectangle and key its near-black background out to alpha, producing a
 * transparent PNG suitable for the floating 3D ingredient layer.
 * @param {string} mockup
 * @param {[number,number,number,number]} rect
 * @param {string} out
 * @param {{floor?:number, ceil?:number, width?:number}} [opts]
 */
async function cutout(mockup, rect, out, opts = {}) {
  const [left, top, width, height] = rect
  const floor = opts.floor ?? 26
  const ceil = opts.ceil ?? 96
  const dest = path.join(OUT, out)
  await mkdir(path.dirname(dest), { recursive: true })

  const { data, info } = await sharp(src[mockup])
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    const a = Math.max(0, Math.min(1, (luma - floor) / (ceil - floor)))
    data[i + 3] = Math.round(a * 255)
  }

  let pipe = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
  if (opts.width) pipe = pipe.resize({ width: opts.width })
  await pipe.png({ compressionLevel: 9 }).toFile(dest)
  console.log(`  cutout ${out}  (${width}x${height})`)
}

// ---------------------------------------------------------------------------
// Crop map — coordinates in the mockups' native 1672x941 space
// ---------------------------------------------------------------------------

/** The eight signature dishes as laid out in the home hero carousel. */
const CAROUSEL_SLUGS = [
  'pho-bo-dac-biet',
  'bun-bo-hue',
  'goi-cuon-tom',
  'com-tam-suon',
  'sushi-set-premium',
  'banh-xeo',
  'bun-cha-ha-noi',
  'ca-phe-viet',
]
const CAROUSEL_X0 = 44
const CAROUSEL_PITCH = 198.3
const CAROUSEL_W = 191
const CAROUSEL_Y = 659
const CAROUSEL_H = 128
/// The last card sits under the carousel's "next" arrow, so it crops narrower.
const CAROUSEL_LAST_W = 150

/** Floating ingredients orbiting the Smart Menu dish. */
const INGREDIENTS = [
  { name: 'spring-onion', rect: [930, 168, 200, 84] },
  { name: 'star-anise-1', rect: [1066, 172, 78, 74] },
  { name: 'chili-red-1', rect: [1150, 176, 104, 96] },
  { name: 'chili-red-2', rect: [1372, 172, 104, 92] },
  { name: 'beef-slice-1', rect: [1208, 214, 216, 168] },
  { name: 'beef-slice-2', rect: [1028, 378, 226, 156] },
  { name: 'onion-ring-1', rect: [944, 268, 100, 76] },
  { name: 'onion-ring-2', rect: [1020, 320, 104, 84] },
  { name: 'onion-ring-3', rect: [898, 448, 110, 84] },
  { name: 'cinnamon', rect: [948, 376, 126, 76] },
  { name: 'lime', rect: [1388, 388, 136, 136] },
  { name: 'coriander', rect: [1180, 385, 100, 90] },
  { name: 'star-anise-2', rect: [1296, 430, 106, 96] },
]

const GALLERY_TILES = [
  { name: 'restaurant', rect: [57, 502, 310, 232] },
  { name: 'sushi-bar', rect: [385, 502, 297, 232] },
  { name: 'private-room', rect: [700, 502, 292, 232] },
  { name: 'outdoor-area', rect: [1007, 502, 290, 232] },
  // Narrower than its neighbours: the mockup's AI-Chef medallion overlaps this
  // tile's bottom-right corner and must stay out of the photograph.
  { name: 'atmosphere', rect: [1300, 502, 240, 232] },
]

// Each promotion card carries overlaid headline text in the mockup, so these
// rectangles deliberately sit below/right of the copy to grab food only.
const PROMOTIONS = [
  { name: 'lunch-deal', rect: [60, 496, 312, 168] },
  { name: 'family-combo', rect: [446, 490, 350, 174] },
  { name: 'sushi-friday', rect: [890, 498, 278, 166] },
  { name: 'happy-birthday', rect: [1195, 470, 330, 190] },
]

const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="120 0 240 292" fill="none">
  <path fill="#e8bb7e" d="M356.61,114.3l-3.8-12.67-1.72-2.84c-1.36-4.25-3.51-8.22-5.61-12.04-2.02-3.68-4.35-7.11-6.78-10.5-14.44-20.1-34.87-35.37-58.83-43.27-2.94-.97-5.51-3.77-7.48-5.03L242.02,0l-5.8,4.85-3.22,2.81c-3.41,2.98-6.78,5.69-9.45,8.93l-18.2,15.76c-7.98,2.5-15.45,5.75-22.33,9.88-10.74,5.46-19.82,13.14-28.4,22.13-22.77,23.85-33.77,55.93-31.91,89.01,2.54,45.14,30.8,84.65,71.86,102.37,8.01,3.46,16.57,6.14,25.23,7.6,4.94.84,9.86,1.73,14.88,1.88,9.23.28,18.3.05,27.39-1.52,21.17-3.65,41.39-12.93,57.74-27.42,1.47-1.3,2.19-2.65,3.87-3.78,4.6-3.11,7.74-8.02,11.15-11.9,2.85-3.24,5.11-6.75,7.5-10.35,6.93-10.46,11.83-22.3,14.93-34.43,5.13-19.42,5.15-42.16-.66-61.53ZM279.86,146.07l.08-104.21c23.63,8.7,43.01,24.47,55.98,45.28.86,1.37,1.39,2.13,2.83,2.18l-.05.42c-.09.77-.04,1.41.25,2.01l3.14,6.4c3.36,6.83,5.61,14.1,7.88,21.4-.3.64.16,1.77.29,2.46l.13.67,2.32,17.33c.13.99-.29,1.84-.75,2.18l-9.8.74-1.54.4-1.48.07c-32.28,4.83-61.71,23.05-80.12,50.22-5.02,6.78-9.92,15.41-12.51,23.53l-.61.39.05-40.09,22.85-20.83,3.59-3.62c2.41-2.43,5.71-3.64,7.46-6.93ZM338.28,159.15l-6.09,6.02-73.41,73.46-12.2,12.05c1.18-20.15,9.93-40.23,21.3-55.61,16.41-21.85,40.08-37.03,66.92-42.68.39-.08.89-.42,1.39-.35l2.18-.22,4.4-.75c.94-.16,1.96-.75,3.28.26l-7.77,7.82ZM217.94,148.51c-.98-.89-1.97-1.41-3.09-1.27.61-1.51-1.7-2.81-2.5-3.82l-.26-24.88c2.84,1.48,4.25,3.31,6.09,4.98l19.6,17.71-.2,25.15-19.65-17.87ZM226.61,94.59l11.06,10.35-.09,24.98-19.42-17.29-6.08-6.2.07-24.44,14.46,12.6ZM266.75,49.61c1.39-.76,2.38-1.83,2.78-3.01.5-.27.93-.87,2.13-.75l-.14,24.67-.99.83-4.62,4.4-19.76,17.46-.27-24.89,20.87-18.72ZM263.29,150.76l-17.34,15.46-.34-25.94c1.06.98,1.62-.51,1.9-1.01,2.18-1.18,4.3-3.7,6.34-5.59,5.45-5.05,11.25-9.3,16.03-14.6.35-.22.69-.61,1.81-.75l-.08,24.71-8.32,7.71ZM271.66,106.46l-5.67,5.57c.72.44,1.23.17,1.62.09l-.88,1.02c-.93-.63-1.92-.28-2.91.64l-14.76,13.62c-1.13,1.05-2.06,2.04-3.42,2.03-.13-.16-.13-.4.04-.48l.27-24.07,21.13-19.16c.85-.78,1.12-1.69,1.24-2.41l3.04-1.09c.23.48.88,1.48.94,1.89-.32,7.21.07,14.65-.62,22.35ZM254.19,21.95l15.02,13.67c-.32,1.42-1.7,2.38-2.81,3.37l-20.45,18.26-.14-42.86.83-.16c1.61,3.19,4.81,5.19,7.56,7.71ZM219.02,31.27c1.49-1.62,4.07-3.07,5.03-5.57,4.41-3.1,9.18-6.68,13.59-11.36v42.85s-15.68-13.98-15.68-13.98c-2.39-2.13-4.57-4.29-7.64-6.59,1.21-2.33,3.14-3.65,4.7-5.36ZM212.25,45.54c2.1,2.25,4.07,3.28,5.79,4.91l5.44,5.17c.41.39.8.84,1.41.99l12.75,11.91-.1,25.28c-3.18-3.4-6.92-5.44-9.97-8.6l-3.44-3.57-12.08-10.97c-.14-8.57-.21-16.24.19-25.11ZM184.91,50.58c5.95-3.58,11.87-6.14,18.75-8.72l.07,105.17,9.29,8.22,24.69,22.13-.3,39.89c-4.34-10.47-9.36-19.62-16.17-28.3-3.14-4-6.15-7.96-10.25-11.2-5.15-6.75-11.82-11.34-18.8-15.98-18.02-12.11-39.11-18.81-61.38-19.7,1.3-37.91,21.67-71.96,54.1-91.52ZM219.75,255.12c-8.82-2.02-17.31-4.67-25.52-8.58-13.98-6.66-25.47-15.83-35.9-27.34-14.92-17.11-24.9-38.3-26.86-61.98l57.89,57.78c1.01,1,1.99,1.6,2.87,1.92.44,1.34,1.12,2.08,2.06,3.01l22.87,22.78,13.73,13.82-11.14-1.41ZM220.75,234.64l-22.85-22.79-2.97-2.96-57.67-58c18.64,1.5,35.5,8.08,50.33,17.68,10.13,6.55,18.97,15.27,26.58,24.39,12.51,16.69,21.02,36.08,22.92,57.75l-16.35-16.06ZM339.11,199.61l-8.12,13.12c-19.14,24.5-45.49,40.02-76.41,43.79l-.86-.34c-.24-.09-.46-.66-.1-1.03l5.09-5.29.83-.92,1.38-1.34,24.98-25.12c.96-.97,1.05-2.87,3.17-2.88l43.73-43.8,7.99-8,11.02-10.92c.64.06.98,1.35.66,1.73.02.17.06.39.12.52-2.34,14.2-5.92,28.25-13.49,40.48Z"/>
</svg>
`

async function main() {
  await resolveSources()
  await mkdir(OUT, { recursive: true })
  console.log(`Source : ${SOURCE_DIR}`)
  console.log(`Output : ${OUT}\n`)

  // -- Brand -----------------------------------------------------------------
  console.log('brand')
  if (src.logo) await copyFile(src.logo, path.join(OUT, 'logo-vietrice.svg'))
  await writeFile(path.join(OUT, 'logo-mark.svg'), LOGO_MARK_SVG, 'utf8')
  console.log('  logo   logo-vietrice.svg + logo-mark.svg')

  // -- Home hero -------------------------------------------------------------
  console.log('home')
  // Right edge stops at x=1490: the mockup bakes its own AI-Chef widget and
  // social rail into the banner from x~1497 onwards, and those must not end up
  // inside the photograph (the real ones are live DOM elements on top).
  await photo('home', [470, 88, 1020, 570], 'hero/hero-pho-bo.jpg', { quality: 88 })
  await photo('home', [0, 88, 1490, 570], 'hero/hero-wide.jpg', { quality: 84 })

  // -- Signature dishes ------------------------------------------------------
  console.log('dishes')
  for (let i = 0; i < CAROUSEL_SLUGS.length; i++) {
    const isLast = i === CAROUSEL_SLUGS.length - 1
    await photo(
      'home',
      [
        Math.round(CAROUSEL_X0 + i * CAROUSEL_PITCH),
        CAROUSEL_Y,
        isLast ? CAROUSEL_LAST_W : CAROUSEL_W,
        CAROUSEL_H,
      ],
      `dishes/${CAROUSEL_SLUGS[i]}.jpg`,
      { quality: 90 },
    )
  }

  // Hero-scale backdrops. Only Pho Bo exists at full size in the mockups; the
  // other seven dishes are only present as ~191x128 carousel thumbnails, which
  // would be unusably soft stretched across a 16:9 banner. Upscaling them with
  // a deliberate shallow-depth-of-field blur keeps the cinematic look intact —
  // the sharp version of each dish is always visible in the carousel card.
  // Replace these with real photography by updating MenuItem.poster in Admin.
  console.log('hero backdrops')
  for (const slug of CAROUSEL_SLUGS) {
    if (slug === 'pho-bo-dac-biet') continue
    const dest = path.join(OUT, 'hero/dishes', `${slug}.jpg`)
    await mkdir(path.dirname(dest), { recursive: true })
    await sharp(path.join(OUT, 'dishes', `${slug}.jpg`))
      .resize(1600, 900, { fit: 'cover', kernel: 'lanczos3' })
      .blur(6)
      .modulate({ brightness: 0.92, saturation: 1.06 })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(dest)
    console.log(`  photo  hero/dishes/${slug}.jpg  (1600x900, softened)`)
  }

  // -- Smart menu ------------------------------------------------------------
  console.log('menu')
  await photo('menu', [830, 140, 842, 700], 'menu/pho-bo-showcase.jpg', { quality: 90 })
  await photo('menu', [1000, 480, 620, 336], 'menu/pho-bo-bowl.jpg', { quality: 90 })
  for (const ing of INGREDIENTS) {
    await cutout('menu', ing.rect, `menu/ingredients/${ing.name}.png`)
  }

  // -- Reservation -----------------------------------------------------------
  console.log('reservation')
  await photo('reservation', [380, 250, 900, 500], 'reservation/floor-texture.jpg', { quality: 80 })
  // The "special events" side card reuses the private-room shot; the mockup's
  // own card art is fully covered by copy and yields nothing usable.
  await photo('gallery', [700, 502, 292, 232], 'reservation/events.jpg', { quality: 88 })

  // -- Promotions ------------------------------------------------------------
  console.log('promotions')
  for (const p of PROMOTIONS) {
    await photo('promotions', p.rect, `promotions/${p.name}.jpg`, { quality: 88 })
  }

  // -- Gallery ---------------------------------------------------------------
  console.log('gallery')
  // Left edge clears the mockup's own headline/stats overlay (ends ~x=520) and
  // the right edge stops before its social rail (starts ~x=1600).
  await photo('gallery', [530, 145, 1060, 345], 'gallery/panorama.jpg', { quality: 88 })
  for (const t of GALLERY_TILES) {
    await photo('gallery', t.rect, `gallery/${t.name}.jpg`, { quality: 88 })
  }

  // -- AI assistant ----------------------------------------------------------
  console.log('assistant')
  // Height stops above the mockup's speech bubble while keeping the crossed arms.
  await photo('assistant', [640, 150, 370, 330], 'assistant/ai-chef.jpg', { quality: 90 })
  await cutout('assistant', [640, 150, 370, 330], 'assistant/ai-chef.png', {
    floor: 34,
    ceil: 120,
  })
  await photo('assistant', [1530, 700, 128, 128], 'assistant/ai-chef-avatar.jpg', { quality: 92 })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('\nAsset extraction failed:\n', err.message)
  process.exit(1)
})
