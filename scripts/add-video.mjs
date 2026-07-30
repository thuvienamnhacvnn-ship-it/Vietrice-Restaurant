/**
 * Prepare a dish video for the hero banner.
 *
 *   npm run video -- "E:/Works/DX media/Image DX/V2.mp4" bun-bo-hue
 *
 * Writes `public/videos/<slug>.mp4`, which `prisma/seed.ts` picks up by name —
 * so adding a dish clip is: run this, then `npm run db:seed`.
 *
 * The re-encode is not cosmetic. Source clips carry an audio track the player
 * never unmutes and a bitrate meant for full-screen viewing, which on a phone
 * is data the guest pays for and a banner that stalls before it loops. Encoding
 * drops the audio, caps the bitrate, and moves the MP4 index to the front so
 * playback starts before the file has finished downloading.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [input, slug] = process.argv.slice(2)

if (!input || !slug) {
  console.error('Usage: npm run video -- <input-file> <dish-slug>')
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

const outDir = join(process.cwd(), 'public', 'videos')
mkdirSync(outDir, { recursive: true })
const target = join(outDir, `${slug}.mp4`)

console.log(`Encoding ${source}\n      -> public/videos/${slug}.mp4`)

try {
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel', 'error',
      '-i', source,
      '-an',                       // muted background loop: the audio is dead weight
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-pix_fmt', 'yuv420p',       // Safari refuses anything else
      '-vf', 'scale=1280:-2',      // -2 keeps the height even, which H.264 requires
      '-crf', '26',
      '-preset', 'slow',
      '-g', '48',                  // keyframe every 2s so the loop restarts cleanly
      '-movflags', '+faststart',
      target,
    ],
    { stdio: 'inherit' },
  )
} catch (err) {
  console.error('\nffmpeg failed. Is it installed and on PATH?')
  process.exit(1)
}

const before = statSync(source).size
const after = statSync(target).size
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

console.log(`\n  ${mb(before)} -> ${mb(after)}  (${Math.round((1 - after / before) * 100)}% smaller)`)

if (after > 3 * 1024 * 1024) {
  console.warn(
    `\n  ! ${mb(after)} is large for a background loop. Shorten the clip or raise -crf.`,
  )
}

console.log('\nNext: npm run db:seed   (registers the video against the dish)')
