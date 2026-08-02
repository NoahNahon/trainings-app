// Generates icon-192.png / icon-512.png without any image dependency:
// rasterizes a small dumbbell-on-dark-rounded-square by hand, then writes a PNG.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const rects = [
  // [x, y, w, h, radius, color] in a 512x512 space
  [0, 0, 512, 512, 112, [15, 23, 42]],
  [112, 239, 288, 34, 17, [249, 115, 22]],
  [76, 186, 44, 140, 18, [251, 146, 60]],
  [392, 186, 44, 140, 18, [251, 146, 60]],
  [132, 212, 36, 88, 14, [253, 186, 116]],
  [344, 212, 36, 88, 14, [253, 186, 116]],
]

/** Rounded-rect coverage at a point, 0..1, sampled 2x2 for cheap antialiasing. */
function coverage(px, py, [x, y, w, h, r]) {
  let hits = 0
  for (const dx of [0.25, 0.75]) {
    for (const dy of [0.25, 0.75]) {
      const sx = px + dx, sy = py + dy
      if (sx < x || sx > x + w || sy < y || sy > y + h) continue
      // distance into the nearest corner circle
      const cx = Math.min(Math.max(sx, x + r), x + w - r)
      const cy = Math.min(Math.max(sy, y + r), y + h - r)
      const d = Math.hypot(sx - cx, sy - cy)
      if (d <= r) hits++
    }
  }
  return hits / 4
}

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const scale = 512 / size
  // one filter byte + RGBA per pixel, per row
  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0
    for (let x = 0; x < size; x++) {
      let [r, g, b] = [0, 0, 0]
      let a = 0
      for (const rect of rects) {
        const cov = coverage(x * scale, y * scale, rect)
        if (cov === 0) continue
        const [, , , , , color] = rect
        // src-over
        const outA = cov + a * (1 - cov)
        r = (color[0] * cov + r * a * (1 - cov)) / outA
        g = (color[1] * cov + g * a * (1 - cov)) / outA
        b = (color[2] * cov + b * a * (1 - cov)) / outA
        a = outA
      }
      const p = rowStart + 1 + x * 4
      raw[p] = Math.round(r)
      raw[p + 1] = Math.round(g)
      raw[p + 2] = Math.round(b)
      raw[p + 3] = Math.round(a * 255)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT, { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), png(size))
  console.log(`wrote icon-${size}.png`)
}
