/** Dev-only QA helper: composites extracted crops into one sheet for review. */
import sharp from 'sharp'
import path from 'node:path'

const OUT = path.resolve(process.cwd(), 'public', 'images')
const TMP = process.argv[2] || path.resolve(process.cwd(), 'contact-sheet.jpg')

const CELL = 200
const COLS = 8

const files = [
  'dishes/pho-bo-dac-biet.jpg',
  'dishes/bun-bo-hue.jpg',
  'dishes/goi-cuon-tom.jpg',
  'dishes/com-tam-suon.jpg',
  'dishes/sushi-set-premium.jpg',
  'dishes/banh-xeo.jpg',
  'dishes/bun-cha-ha-noi.jpg',
  'dishes/ca-phe-viet.jpg',
  'gallery/restaurant.jpg',
  'gallery/sushi-bar.jpg',
  'gallery/private-room.jpg',
  'gallery/outdoor-area.jpg',
  'gallery/atmosphere.jpg',
  'promotions/lunch-deal.jpg',
  'promotions/family-combo.jpg',
  'promotions/sushi-friday.jpg',
  'promotions/happy-birthday.jpg',
  'assistant/ai-chef.jpg',
  'menu/pho-bo-bowl.jpg',
  'reservation/events.jpg',
  'menu/ingredients/beef-slice-1.png',
  'menu/ingredients/lime.png',
  'menu/ingredients/star-anise-1.png',
  'menu/ingredients/coriander.png',
]

const rows = Math.ceil(files.length / COLS)
const composites = []

for (let i = 0; i < files.length; i++) {
  const buf = await sharp(path.join(OUT, files[i]))
    .resize(CELL, CELL, { fit: 'contain', background: { r: 20, g: 18, b: 14, alpha: 1 } })
    .flatten({ background: { r: 20, g: 18, b: 14 } })
    .toBuffer()
  composites.push({
    input: buf,
    left: (i % COLS) * CELL,
    top: Math.floor(i / COLS) * CELL,
  })
}

await sharp({
  create: {
    width: COLS * CELL,
    height: rows * CELL,
    channels: 3,
    background: { r: 8, g: 8, b: 6 },
  },
})
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile(TMP)

console.log(`Contact sheet -> ${TMP}`)
