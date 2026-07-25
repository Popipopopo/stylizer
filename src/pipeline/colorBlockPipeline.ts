import type { BaseSettings, ColorBlockSettings } from '../model/settings'
import { cleanupSmallRegions, majorityFilter } from '../algorithms/cleanup'
import { applyGrade } from '../algorithms/legacyEffects'
import {
  extractPalette,
  paletteFromHex,
  quantizePalette,
  renderLabels,
  type QuantizedImage,
} from '../algorithms/palette'
import { applyTexture } from '../algorithms/texture'
import { kuwaharaFilter } from '../algorithms/kuwahara'
import type { PixelBuffer } from '../algorithms/image'

export interface ColorBlockCache {
  grade?: { key: string; value: PixelBuffer }
  smoothing?: { key: string; value: PixelBuffer }
  palette?: { key: string; value: QuantizedImage }
  cleanup?: { key: string; labels: Uint16Array; value: PixelBuffer }
  texture?: { key: string; value: PixelBuffer }
}

export interface PipelineResult {
  image: PixelBuffer
  palette: Uint8ClampedArray
  cacheHits: string[]
}

const keyOf = (value: unknown): string => JSON.stringify(value)

export function runColorBlockPipeline(
  resized: PixelBuffer,
  sourceKey: string,
  base: BaseSettings,
  settings: ColorBlockSettings,
  cache: ColorBlockCache,
): PipelineResult {
  const cacheHits: string[] = []
  const gradeKey = keyOf([sourceKey, base])
  if (!cache.grade || cache.grade.key !== gradeKey) {
    cache.grade = { key: gradeKey, value: applyGrade(resized, base) }
  } else cacheHits.push('base-color')

  const smoothingKey = keyOf([
    gradeKey,
    settings.kuwaharaEnabled,
    settings.kuwaharaRadius,
    settings.kuwaharaStrength,
    settings.kuwaharaPasses,
  ])
  if (!cache.smoothing || cache.smoothing.key !== smoothingKey) {
    cache.smoothing = {
      key: smoothingKey,
      value: settings.kuwaharaEnabled
        ? kuwaharaFilter(
            cache.grade.value,
            settings.kuwaharaRadius,
            settings.kuwaharaStrength,
            settings.kuwaharaPasses,
          )
        : { ...cache.grade.value, data: cache.grade.value.data.slice() },
    }
  } else cacheHits.push('smoothing')

  const paletteKey = keyOf([
    smoothingKey,
    settings.paletteSource,
    settings.paletteSize,
    settings.customPalette,
  ])
  if (!cache.palette || cache.palette.key !== paletteKey) {
    const palette =
      settings.paletteSource === 'custom'
        ? paletteFromHex(settings.customPalette.slice(0, settings.paletteSize))
        : extractPalette(cache.smoothing.value, settings.paletteSize)
    cache.palette = {
      key: paletteKey,
      value: quantizePalette(cache.smoothing.value, palette),
    }
  } else cacheHits.push('palette')

  const cleanupKey = keyOf([
    paletteKey,
    settings.minimumIslandArea,
    settings.cleanupRadius,
    settings.cleanupPasses,
  ])
  if (!cache.cleanup || cache.cleanup.key !== cleanupKey) {
    const components = cleanupSmallRegions(
      cache.palette.value.labels,
      resized.width,
      resized.height,
      settings.minimumIslandArea,
      cache.palette.value.palette,
    )
    const labels = majorityFilter(
      components,
      resized.width,
      resized.height,
      settings.cleanupRadius,
      settings.cleanupPasses,
    )
    cache.cleanup = {
      key: cleanupKey,
      labels,
      value: renderLabels(cache.palette.value.image, labels, cache.palette.value.palette),
    }
  } else cacheHits.push('cleanup')

  const textureKey = keyOf([
    cleanupKey,
    settings.textureAmount,
    settings.textureScale,
    settings.grainAmount,
  ])
  if (!cache.texture || cache.texture.key !== textureKey) {
    cache.texture = {
      key: textureKey,
      value: applyTexture(
        cache.cleanup.value,
        cache.cleanup.labels,
        settings.textureAmount,
        settings.textureScale,
        settings.grainAmount,
      ),
    }
  } else cacheHits.push('texture')

  return {
    image: cache.texture.value,
    palette: cache.palette.value.palette,
    cacheHits,
  }
}
