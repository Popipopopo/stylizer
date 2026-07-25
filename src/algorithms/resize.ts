import type { PixelBuffer } from './image'

export function fitDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function resizeImage(
  source: PixelBuffer,
  width: number,
  height: number,
): PixelBuffer {
  if (source.width === width && source.height === height) {
    return { ...source, data: source.data.slice() }
  }

  const output = new Uint8ClampedArray(width * height * 4)
  const sx = source.width / width
  const sy = source.height / height

  for (let y = 0; y < height; y += 1) {
    const sourceY = (y + 0.5) * sy - 0.5
    const y0 = Math.max(0, Math.floor(sourceY))
    const y1 = Math.min(source.height - 1, y0 + 1)
    const fy = Math.max(0, sourceY - y0)
    for (let x = 0; x < width; x += 1) {
      const sourceX = (x + 0.5) * sx - 0.5
      const x0 = Math.max(0, Math.floor(sourceX))
      const x1 = Math.min(source.width - 1, x0 + 1)
      const fx = Math.max(0, sourceX - x0)
      const target = (y * width + x) * 4

      for (let channel = 0; channel < 4; channel += 1) {
        const a = source.data[(y0 * source.width + x0) * 4 + channel]
        const b = source.data[(y0 * source.width + x1) * 4 + channel]
        const c = source.data[(y1 * source.width + x0) * 4 + channel]
        const d = source.data[(y1 * source.width + x1) * 4 + channel]
        output[target + channel] =
          (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
      }
    }
  }

  return { width, height, data: output }
}
