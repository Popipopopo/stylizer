import { clampByte, cloneBuffer, type PixelBuffer } from './image'

interface IntegralSet {
  stride: number
  red: Float64Array
  green: Float64Array
  blue: Float64Array
  luminance: Float64Array
  luminanceSquared: Float64Array
}

function buildIntegrals(image: PixelBuffer): IntegralSet {
  const stride = image.width + 1
  const size = stride * (image.height + 1)
  const red = new Float64Array(size)
  const green = new Float64Array(size)
  const blue = new Float64Array(size)
  const luminance = new Float64Array(size)
  const luminanceSquared = new Float64Array(size)

  for (let y = 1; y <= image.height; y += 1) {
    let rowR = 0
    let rowG = 0
    let rowB = 0
    let rowL = 0
    let rowL2 = 0
    for (let x = 1; x <= image.width; x += 1) {
      const pixel = ((y - 1) * image.width + (x - 1)) * 4
      const r = image.data[pixel]
      const g = image.data[pixel + 1]
      const b = image.data[pixel + 2]
      const l = r * 0.2126 + g * 0.7152 + b * 0.0722
      rowR += r
      rowG += g
      rowB += b
      rowL += l
      rowL2 += l * l
      const index = y * stride + x
      const above = index - stride
      red[index] = red[above] + rowR
      green[index] = green[above] + rowG
      blue[index] = blue[above] + rowB
      luminance[index] = luminance[above] + rowL
      luminanceSquared[index] = luminanceSquared[above] + rowL2
    }
  }

  return { stride, red, green, blue, luminance, luminanceSquared }
}

function rectangleSum(
  integral: Float64Array,
  stride: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const left = x0
  const top = y0
  const right = x1 + 1
  const bottom = y1 + 1
  return (
    integral[bottom * stride + right] -
    integral[top * stride + right] -
    integral[bottom * stride + left] +
    integral[top * stride + left]
  )
}

export function kuwaharaFilter(
  input: PixelBuffer,
  radius: number,
  strength = 100,
  passes = 1,
): PixelBuffer {
  if (radius <= 0 || strength <= 0 || passes <= 0) return cloneBuffer(input)
  let current = cloneBuffer(input)
  const blend = Math.min(1, Math.max(0, strength / 100))

  for (let pass = 0; pass < passes; pass += 1) {
    const source = current
    const output = source.data.slice()
    const sums = buildIntegrals(source)

    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const quadrants = [
          [x - radius, y - radius, x, y],
          [x, y - radius, x + radius, y],
          [x - radius, y, x, y + radius],
          [x, y, x + radius, y + radius],
        ]
        let bestVariance = Number.POSITIVE_INFINITY
        let bestR = 0
        let bestG = 0
        let bestB = 0

        for (const quadrant of quadrants) {
          const x0 = Math.max(0, quadrant[0])
          const y0 = Math.max(0, quadrant[1])
          const x1 = Math.min(source.width - 1, quadrant[2])
          const y1 = Math.min(source.height - 1, quadrant[3])
          const count = (x1 - x0 + 1) * (y1 - y0 + 1)
          const sumL = rectangleSum(sums.luminance, sums.stride, x0, y0, x1, y1)
          const sumL2 = rectangleSum(
            sums.luminanceSquared,
            sums.stride,
            x0,
            y0,
            x1,
            y1,
          )
          const variance = Math.max(0, sumL2 / count - (sumL / count) ** 2)
          if (variance < bestVariance) {
            bestVariance = variance
            bestR = rectangleSum(sums.red, sums.stride, x0, y0, x1, y1) / count
            bestG = rectangleSum(sums.green, sums.stride, x0, y0, x1, y1) / count
            bestB = rectangleSum(sums.blue, sums.stride, x0, y0, x1, y1) / count
          }
        }

        const index = (y * source.width + x) * 4
        output[index] = clampByte(source.data[index] * (1 - blend) + bestR * blend)
        output[index + 1] = clampByte(
          source.data[index + 1] * (1 - blend) + bestG * blend,
        )
        output[index + 2] = clampByte(
          source.data[index + 2] * (1 - blend) + bestB * blend,
        )
      }
    }
    current = { ...source, data: output }
  }

  return current
}
