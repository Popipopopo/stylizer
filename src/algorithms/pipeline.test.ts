import { describe, expect, it } from 'vitest'
import { cleanupSmallRegions, majorityFilter } from './cleanup'
import { kuwaharaFilter } from './kuwahara'
import { extractPalette, quantizePalette } from './palette'
import type { PixelBuffer } from './image'
import { runColorBlockPipeline, type ColorBlockCache } from '../pipeline/colorBlockPipeline'
import { DEFAULT_SETTINGS, cloneSettings } from '../model/settings'

const imageFrom = (
  width: number,
  height: number,
  colorAt: (x: number, y: number) => [number, number, number],
): PixelBuffer => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const color = colorAt(x, y)
      data.set([...color, 255], offset)
    }
  }
  return { width, height, data }
}

describe('Kuwahara filter', () => {
  it('smooths variation while retaining a strong vertical boundary', () => {
    const image = imageFrom(12, 8, (x, y) => {
      const base = x < 6 ? 35 : 220
      const noise = (x * 7 + y * 11) % 17
      return [base + noise, base + noise, base + noise]
    })
    const result = kuwaharaFilter(image, 2, 100, 1)
    const left = result.data[(4 * 12 + 4) * 4]
    const right = result.data[(4 * 12 + 7) * 4]
    expect(right - left).toBeGreaterThan(140)
    expect(result.data[(4 * 12 + 2) * 4]).toBeLessThan(60)
  })
})

describe('palette quantization', () => {
  it('extracts the requested deterministic palette and maps labels', () => {
    const image = imageFrom(8, 8, (x, y) => [x * 30, y * 30, (x + y) * 15])
    const first = extractPalette(image, 6)
    const second = extractPalette(image, 6)
    expect([...first]).toEqual([...second])
    expect(first.length).toBe(18)
    const result = quantizePalette(image, first)
    expect(result.labels).toHaveLength(64)
    expect(new Set(result.labels).size).toBeLessThanOrEqual(6)
  })
})

describe('shape cleanup', () => {
  it('merges a one-pixel island into its surrounding component', () => {
    const labels = new Uint16Array(25)
    labels[12] = 1
    const palette = new Uint8ClampedArray([20, 20, 20, 230, 230, 230])
    const result = cleanupSmallRegions(labels, 5, 5, 2, palette)
    expect(result[12]).toBe(0)
  })

  it('majority filter removes isolated labels but keeps a broad band', () => {
    const labels = new Uint16Array([
      0, 0, 0,
      0, 1, 0,
      1, 1, 1,
    ])
    const result = majorityFilter(labels, 3, 3, 1, 1)
    expect(result[4]).toBe(0)
    expect(result[7]).toBe(1)
  })
})

describe('pipeline cache', () => {
  it('reuses early stages when only texture changes', () => {
    const image = imageFrom(8, 8, (x, y) => [x * 20, y * 20, 90])
    const settings = cloneSettings(DEFAULT_SETTINGS)
    settings.colorBlock.kuwaharaRadius = 1
    settings.colorBlock.minimumIslandArea = 2
    const cache: ColorBlockCache = {}
    runColorBlockPipeline(image, 'source', settings.base, settings.colorBlock, cache)
    settings.colorBlock.textureAmount = 8
    const result = runColorBlockPipeline(
      image,
      'source',
      settings.base,
      settings.colorBlock,
      cache,
    )
    expect(result.cacheHits).toEqual(['base-color', 'smoothing', 'palette', 'cleanup'])
  })
})
