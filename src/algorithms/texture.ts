import { clampByte, type PixelBuffer } from './image'

const hash = (x: number, y: number, seed: number): number => {
  let value = Math.imul(x + seed * 1013, 374761393) ^ Math.imul(y + seed * 7919, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

export function applyTexture(
  source: PixelBuffer,
  labels: Uint16Array,
  amount: number,
  scale: number,
  grain: number,
  seed = 17,
): PixelBuffer {
  if (amount <= 0 && grain <= 0) return { ...source, data: source.data.slice() }
  const output = source.data.slice()
  const cell = Math.max(1, Math.round(scale))

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const pixel = y * source.width + x
      const label = labels[pixel]
      const interior =
        (x === 0 || labels[pixel - 1] === label) &&
        (x + 1 === source.width || labels[pixel + 1] === label) &&
        (y === 0 || labels[pixel - source.width] === label) &&
        (y + 1 === source.height || labels[pixel + source.width] === label)
      if (!interior) continue
      const organic = (hash(Math.floor(x / cell), Math.floor(y / cell), seed) - 0.5) * amount
      const fine = (hash(x, y, seed + 31) - 0.5) * grain
      const variation = organic + fine
      const offset = pixel * 4
      output[offset] = clampByte(output[offset] + variation)
      output[offset + 1] = clampByte(output[offset + 1] + variation)
      output[offset + 2] = clampByte(output[offset + 2] + variation)
    }
  }
  return { ...source, data: output }
}
