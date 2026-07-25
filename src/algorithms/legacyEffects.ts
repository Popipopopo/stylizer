import type { BaseSettings, PixelSettings } from '../model/settings'
import { clampByte, cloneBuffer, hexToRgb, type PixelBuffer } from './image'

const buildBayer = (size: number): number[][] => {
  let matrix = [[0]]
  for (let width = 1; width < size; width *= 2) {
    const next = Array.from({ length: width * 2 }, () => Array<number>(width * 2))
    for (let y = 0; y < width * 2; y += 1) {
      for (let x = 0; x < width * 2; x += 1) {
        const quadrant = x < width ? (y < width ? 0 : 3) : y < width ? 2 : 1
        next[y][x] = 4 * matrix[y % width][x % width] + quadrant
      }
    }
    matrix = next
  }
  return matrix.map((row) => row.map((value) => (value + 0.5) / (size * size)))
}

const BAYER4 = buildBayer(4)
const BAYER8 = buildBayer(8)

export function applyGrade(source: PixelBuffer, settings: BaseSettings): PixelBuffer {
  const output = cloneBuffer(source)
  const factor =
    (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
  const warmth = settings.warmth * 0.45
  for (let index = 0; index < output.data.length; index += 4) {
    output.data[index] = clampByte(
      factor * (output.data[index] - 128) + 128 + settings.brightness + warmth,
    )
    output.data[index + 1] = clampByte(
      factor * (output.data[index + 1] - 128) + 128 + settings.brightness,
    )
    output.data[index + 2] = clampByte(
      factor * (output.data[index + 2] - 128) + 128 + settings.brightness - warmth,
    )
  }
  return output
}

const quantize = (value: number, levels: number): number =>
  Math.round((clampByte(value) / 255) * (levels - 1)) * (255 / (levels - 1))

const nearest = (
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][],
): [number, number, number] => {
  let best = palette[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const color of palette) {
    const distance = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2
    if (distance < bestDistance) {
      best = color
      bestDistance = distance
    }
  }
  return best
}

function applyGrain(image: PixelBuffer, amount: number): void {
  if (!amount) return
  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    const value = Math.sin(pixel * 12.9898 + 78.233) * 43758.5453
    const noise = (value - Math.floor(value) - 0.5) * amount
    const offset = pixel * 4
    image.data[offset] = clampByte(image.data[offset] + noise)
    image.data[offset + 1] = clampByte(image.data[offset + 1] + noise)
    image.data[offset + 2] = clampByte(image.data[offset + 2] + noise)
  }
}

function applyDither(image: PixelBuffer, settings: PixelSettings): void {
  const { width, height, data } = image
  const strength = settings.ditherStrength / 100
  const palette = settings.usePalette ? settings.palette.map(hexToRgb) : null
  const choose = (r: number, g: number, b: number): [number, number, number] =>
    palette
      ? nearest(r, g, b, palette)
      : [
          quantize(r, settings.levels),
          quantize(g, settings.levels),
          quantize(b, settings.levels),
        ]

  if (settings.dither === 'none') {
    for (let index = 0; index < data.length; index += 4) {
      const color = choose(data[index], data[index + 1], data[index + 2])
      data[index] = color[0]
      data[index + 1] = color[1]
      data[index + 2] = color[2]
    }
    return
  }

  if (settings.dither === 'bayer4' || settings.dither === 'bayer8') {
    const matrix = settings.dither === 'bayer8' ? BAYER8 : BAYER4
    const step = palette ? 255 / palette.length : 255 / (settings.levels - 1)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4
        const offset =
          (matrix[y % matrix.length][x % matrix.length] - 0.5) * step * strength
        const color = choose(data[index] + offset, data[index + 1] + offset, data[index + 2] + offset)
        data[index] = color[0]
        data[index + 1] = color[1]
        data[index + 2] = color[2]
      }
    }
    return
  }

  const buffer = new Float32Array(width * height * 3)
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    buffer[pixel * 3] = data[pixel * 4]
    buffer[pixel * 3 + 1] = data[pixel * 4 + 1]
    buffer[pixel * 3 + 2] = data[pixel * 4 + 2]
  }
  const diffusion =
    settings.dither === 'atkinson'
      ? [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]]
      : [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x
      const offset = pixel * 3
      const color = choose(buffer[offset], buffer[offset + 1], buffer[offset + 2])
      for (let channel = 0; channel < 3; channel += 1) {
        const error = (buffer[offset + channel] - color[channel]) * strength
        buffer[offset + channel] = color[channel]
        for (const [dx, dy, weight] of diffusion) {
          const xx = x + dx
          const yy = y + dy
          if (xx >= 0 && xx < width && yy >= 0 && yy < height) {
            buffer[(yy * width + xx) * 3 + channel] += error * weight
          }
        }
      }
    }
  }
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    data[pixel * 4] = clampByte(buffer[pixel * 3])
    data[pixel * 4 + 1] = clampByte(buffer[pixel * 3 + 1])
    data[pixel * 4 + 2] = clampByte(buffer[pixel * 3 + 2])
  }
}

function applyDuotone(image: PixelBuffer, darkHex: string, lightHex: string): void {
  const dark = hexToRgb(darkHex)
  const light = hexToRgb(lightHex)
  for (let index = 0; index < image.data.length; index += 4) {
    const luminance =
      (image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114) / 255
    image.data[index] = dark[0] + (light[0] - dark[0]) * luminance
    image.data[index + 1] = dark[1] + (light[1] - dark[1]) * luminance
    image.data[index + 2] = dark[2] + (light[2] - dark[2]) * luminance
  }
}

function applyChroma(image: PixelBuffer, pixels: number): void {
  if (!pixels) return
  const source = image.data.slice()
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const target = (y * image.width + x) * 4
      const left = (y * image.width + Math.max(0, x - pixels)) * 4
      const right = (y * image.width + Math.min(image.width - 1, x + pixels)) * 4
      image.data[target] = source[left]
      image.data[target + 2] = source[right + 2]
    }
  }
}

export function applyPixelEffects(source: PixelBuffer, settings: PixelSettings): PixelBuffer {
  const output = cloneBuffer(source)
  applyGrain(output, settings.grain)
  applyDither(output, settings)
  if (settings.duotone && !settings.usePalette) applyDuotone(output, settings.dark, settings.light)
  applyChroma(output, settings.chroma)
  return output
}
