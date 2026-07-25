import type { AppMode, BaseSettings, PixelSettings } from '../model/settings'
import type { PixelBuffer } from '../algorithms/image'
import { applyGrade, applyPixelEffects } from '../algorithms/legacyEffects'

export function runLegacyPipeline(
  source: PixelBuffer,
  mode: AppMode,
  base: BaseSettings,
  pixel: PixelSettings,
): PixelBuffer {
  const graded = applyGrade(source, base)
  return mode === 'pixel' ? applyPixelEffects(graded, pixel) : graded
}
