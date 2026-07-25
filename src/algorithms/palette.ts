import { hexToRgb, type PixelBuffer } from './image'

type Lab = [number, number, number]

interface HistogramColor {
  rgb: [number, number, number]
  lab: Lab
  weight: number
}

export interface QuantizedImage {
  image: PixelBuffer
  labels: Uint16Array
  palette: Uint8ClampedArray
}

const linear = (value: number): number => {
  const channel = value / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = linear(r)
  const lg = linear(g)
  const lb = linear(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)
  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ]
}

const distanceSquared = (a: Lab, b: Lab): number =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

function buildHistogram(image: PixelBuffer): HistogramColor[] {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>()
  for (let index = 0; index < image.data.length; index += 4) {
    if (image.data[index + 3] < 16) continue
    const r = image.data[index]
    const g = image.data[index + 1]
    const b = image.data[index + 2]
    const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3)
    const bin = bins.get(key)
    if (bin) {
      bin.count += 1
      bin.r += r
      bin.g += g
      bin.b += b
    } else {
      bins.set(key, { count: 1, r, g, b })
    }
  }
  return [...bins.values()].map((bin) => {
    const rgb: [number, number, number] = [
      bin.r / bin.count,
      bin.g / bin.count,
      bin.b / bin.count,
    ]
    return { rgb, lab: rgbToOklab(...rgb), weight: bin.count }
  })
}

export function extractPalette(image: PixelBuffer, requestedSize: number): Uint8ClampedArray {
  const colors = buildHistogram(image)
  const size = Math.max(2, Math.min(requestedSize, colors.length || 2))
  if (colors.length === 0) return new Uint8ClampedArray([0, 0, 0, 255, 255, 255])

  const centers: Lab[] = []
  let first = colors[0]
  for (const color of colors) if (color.weight > first.weight) first = color
  centers.push([...first.lab])

  while (centers.length < size) {
    let best = colors[0]
    let bestScore = -1
    for (const color of colors) {
      const nearest = Math.min(...centers.map((center) => distanceSquared(color.lab, center)))
      const score = nearest * Math.sqrt(color.weight)
      if (score > bestScore) {
        best = color
        bestScore = score
      }
    }
    centers.push([...best.lab])
  }

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const sums = centers.map(() => [0, 0, 0, 0])
    for (const color of colors) {
      let nearest = 0
      let nearestDistance = Number.POSITIVE_INFINITY
      centers.forEach((center, index) => {
        const distance = distanceSquared(color.lab, center)
        if (distance < nearestDistance) {
          nearest = index
          nearestDistance = distance
        }
      })
      sums[nearest][0] += color.lab[0] * color.weight
      sums[nearest][1] += color.lab[1] * color.weight
      sums[nearest][2] += color.lab[2] * color.weight
      sums[nearest][3] += color.weight
    }
    sums.forEach((sum, index) => {
      if (sum[3] > 0) centers[index] = [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]]
    })
  }

  const paletteEntries = centers.map((center) => {
    let best = colors[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const color of colors) {
      const distance = distanceSquared(color.lab, center)
      if (distance < bestDistance) {
        best = color
        bestDistance = distance
      }
    }
    return best.rgb
  })
  paletteEntries.sort((a, b) => rgbToOklab(...a)[0] - rgbToOklab(...b)[0])
  return new Uint8ClampedArray(paletteEntries.flatMap((color) => color.map(Math.round)))
}

export function paletteFromHex(colors: string[]): Uint8ClampedArray {
  return new Uint8ClampedArray(colors.flatMap(hexToRgb))
}

export function quantizePalette(
  source: PixelBuffer,
  palette: Uint8ClampedArray,
): QuantizedImage {
  const count = palette.length / 3
  const labs = Array.from({ length: count }, (_, index) =>
    rgbToOklab(palette[index * 3], palette[index * 3 + 1], palette[index * 3 + 2]),
  )
  const output = source.data.slice()
  const labels = new Uint16Array(source.width * source.height)

  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    const offset = pixel * 4
    if (source.data[offset + 3] < 16) continue
    const lab = rgbToOklab(
      source.data[offset],
      source.data[offset + 1],
      source.data[offset + 2],
    )
    let nearest = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    for (let index = 0; index < count; index += 1) {
      const distance = distanceSquared(lab, labs[index])
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    }
    labels[pixel] = nearest
    output[offset] = palette[nearest * 3]
    output[offset + 1] = palette[nearest * 3 + 1]
    output[offset + 2] = palette[nearest * 3 + 2]
  }
  return { image: { ...source, data: output }, labels, palette }
}

export function renderLabels(
  source: PixelBuffer,
  labels: Uint16Array,
  palette: Uint8ClampedArray,
): PixelBuffer {
  const output = source.data.slice()
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    const offset = pixel * 4
    const color = labels[pixel] * 3
    output[offset] = palette[color]
    output[offset + 1] = palette[color + 1]
    output[offset + 2] = palette[color + 2]
  }
  return { ...source, data: output }
}
