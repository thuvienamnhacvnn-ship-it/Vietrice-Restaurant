/**
 * Prepare a dish video for the hero banner, and cut its poster from the video.
 *
 *   npm run video -- "E:/Works/DX media/Image DX/V2.mp4" bun-bo-hue
 *   npm run video -- "E:/media/V2.mp4" bun-bo-hue 2.5      # grab the frame at 2.5s
 *
 * Writes three files, all keyed on the dish slug so `prisma/seed.ts` finds them
 * by name — adding a dish clip needs no code change:
 *
 *   public/videos/<slug>.mp4               the looping background
 *   public/images/hero/dishes/<slug>.jpg   1600x900 poster / still fallback
 *   public/images/dishes/<slug>.jpg        191x128 carousel thumbnail
 *
 * The poster is a frame of the video rather than a separate photograph, so the
 * still and the moving image are the same shot. Otherwise the banner visibly
 * jumps the moment the video finishes buffering, and the carousel thumbnail
 * shows a dish that looks unlike the one that then animates.
 *
 * The re-encode is not cosmetic either. Source clips carry an audio track the
 * player never unmutes and a bitrate meant for full-screen viewing, which on a
 * phone is data the guest pays for and a banner that stalls before it loops.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [input, slug, posterAt = '1'] = process.argv.slice(2)

if (!input || !slug) {
  console.error('Usage: npm run video -- <input-file> <dish-slug> [poster-seconds]')
  console.error('Example: npm run video -- "E:/media/V2.mp4" bun-bo-hue')
  process.exit(1)
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`Invalid slug "${slug}". Use the dish slug exactly, e.g. pho-bo-dac-biet.`)
  process.exit(1)
}

const source = resolve(input)
if (!existsSync(source)) {
  console.error(`Not found: ${source}`)
  process.exit(1)
}

const root = process.cwd()
const videoDir = join(root, 'public', 'videos')
const posterDir = join(root, 'public', 'images', 'hero', 'dishes')
const thumbDir = join(root, 'public', 'images', 'dishes')
for (const dir of [videoDir, posterDir, thumbDir]) mkdirSync(dir, { recursive: true })

const video = join(videoDir, `${slug}.mp4`)
const poster = join(posterDir, `${slug}.jpg`)
const thumb = join(thumbDir, `${slug}.jpg`)

/**
 * Colour grade applied to the video and to both stills, identically.
 *
 * The supplied clips are lit dark and moody; the design mockups show bright,
 * appetising food against a dark surround. The curve lifts shadows and
 * midtones while leaving highlights alone, so the food reads clearly without
 * the wooden table blowing out — turning up plain brightness instead would
 * grey the blacks that the whole theme rests on.
 *
 * It has to be identical on all three outputs, or the still and the moving
 * image would not match and the banner would shift colour when the video
 * starts.
 */
const GRADE = "curves=all='0/0.03 0.25/0.42 0.6/0.78 1/1',eq=saturation=1.28:contrast=1.04"

const ffmpeg = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })

try {
  console.log(`Encoding video   -> public/videos/${slug}.mp4`)
  ffmpeg([
    '-i', source,
    '-an',                        // muted background loop: the audio is dead weight
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',        // Safari refuses anything else
    '-vf', `${GRADE},scale=1280:-2`, // -2 keeps the height even, which H.264 requires
    '-crf', '26',
    '-preset', 'slow',
    '-g', '48',                   // keyframe every 2s so the loop restarts cleanly
    '-movflags', '+faststart',    // start playing before the download finishes
    video,
  ])

  console.log(`Cutting poster   -> public/images/hero/dishes/${slug}.jpg  (at ${posterAt}s)`)
  ffmpeg([
    '-ss', String(posterAt),
    '-i', source,
    '-frames:v', '1',
    // Cover 16:9 without distorting: scale to fill, then centre-crop. Cut from
    // the source, not the encoded file, so the still is not a re-compression
    // of an already-compressed frame.
    '-vf', `${GRADE},scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900`,
    '-q:v', '3',
    poster,
  ])

  console.log(`Cutting thumbnail-> public/images/dishes/${slug}.jpg`)
  ffmpeg([
    '-ss', String(posterAt),
    '-i', source,
    '-frames:v', '1',
    '-vf', `${GRADE},scale=382:256:force_original_aspect_ratio=increase,crop=382:256`,
    '-q:v', '3',
    thumb,
  ])
} catch {
  console.error('\nffmpeg failed. Is it installed and on PATH?')
  process.exit(1)
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`
const before = statSync(source).size
const after = statSync(video).size

console.log(`\n  video     ${mb(before)} -> ${mb(after)}  (${Math.round((1 - after / before) * 100)}% smaller)`)
console.log(`  poster    ${(statSync(poster).size / 1024).toFixed(0)} KB`)
console.log(`  thumbnail ${(statSync(thumb).size / 1024).toFixed(0)} KB`)

if (after > 3 * 1024 * 1024) {
  console.warn(`\n  ! ${mb(after)} is large for a background loop. Shorten the clip or raise -crf.`)
}

console.log('\nNext: npm run db:seed   (registers the video, poster and thumbnail)')
