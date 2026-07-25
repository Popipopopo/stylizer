/// <reference lib="webworker" />

import type { AppSettings, RenderQuality } from '../model/settings'
import type { PixelBuffer } from '../algorithms/image'
import { rgbToHex } from '../algorithms/image'
import { fitDimensions, resizeImage } from '../algorithms/resize'
import {
  runColorBlockPipeline,
  type ColorBlockCache,
} from '../pipeline/colorBlockPipeline'
import { runLegacyPipeline } from '../pipeline/legacyPipeline'

interface LoadMessage {
  type: 'load'
  sourceId: string
  width: number
  height: number
  data: ArrayBuffer
}

interface RenderMessage {
  type: 'render'
  requestId: number
  quality: RenderQuality
  settings: AppSettings
}

type WorkerMessage = LoadMessage | RenderMessage

let source: PixelBuffer | null = null
let sourceId = ''
const resizedCache = new Map<string, PixelBuffer>()
const colorBlockCaches = new Map<string, ColorBlockCache>()

function maximumDimension(settings: AppSettings, quality: RenderQuality): number {
  if (settings.mode === 'color-block') {
    if (quality === 'draft') {
      return Math.max(
        240,
        Math.round(settings.colorBlock.workingResolution * settings.colorBlock.previewQuality / 100),
      )
    }
    if (quality === 'export') {
      return Math.min(3000, Math.max(settings.colorBlock.workingResolution, Math.max(source!.width, source!.height)))
    }
    return settings.colorBlock.workingResolution
  }
  if (quality === 'export') return Math.min(3000, Math.max(source!.width, source!.height))
  return quality === 'draft' ? 700 : 1200
}

function getResized(settings: AppSettings, quality: RenderQuality): {
  image: PixelBuffer
  key: string
} {
  const maxDimension = maximumDimension(settings, quality)
  let dimensions = fitDimensions(source!.width, source!.height, maxDimension)
  if (settings.mode === 'pixel') {
    dimensions = {
      width: Math.max(1, Math.round(dimensions.width / settings.pixel.pixelScale)),
      height: Math.max(1, Math.round(dimensions.height / settings.pixel.pixelScale)),
    }
  }
  const key = `${sourceId}:${dimensions.width}x${dimensions.height}`
  let image = resizedCache.get(key)
  if (!image) {
    image = resizeImage(source!, dimensions.width, dimensions.height)
    resizedCache.set(key, image)
  }
  return { image, key }
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data
  if (message.type === 'load') {
    source = {
      width: message.width,
      height: message.height,
      data: new Uint8ClampedArray(message.data),
    }
    sourceId = message.sourceId
    resizedCache.clear()
    colorBlockCaches.clear()
    self.postMessage({ type: 'loaded', sourceId })
    return
  }

  if (!source) {
    self.postMessage({ type: 'error', requestId: message.requestId, error: 'No image loaded' })
    return
  }

  try {
    const started = performance.now()
    const resized = getResized(message.settings, message.quality)
    let output: PixelBuffer
    let palette: string[] = []
    let cacheHits: string[] = []

    if (message.settings.mode === 'color-block') {
      let cache = colorBlockCaches.get(resized.key)
      if (!cache) {
        cache = {}
        colorBlockCaches.set(resized.key, cache)
      }
      const result = runColorBlockPipeline(
        resized.image,
        resized.key,
        message.settings.base,
        message.settings.colorBlock,
        cache,
      )
      output = result.image
      cacheHits = result.cacheHits
      for (let index = 0; index < result.palette.length; index += 3) {
        palette.push(rgbToHex(result.palette.subarray(index, index + 3)))
      }
    } else {
      output = runLegacyPipeline(
        resized.image,
        message.settings.mode,
        message.settings.base,
        message.settings.pixel,
      )
    }

    const transferable = output.data.slice()
    self.postMessage(
      {
        type: 'result',
        requestId: message.requestId,
        quality: message.quality,
        width: output.width,
        height: output.height,
        data: transferable.buffer,
        palette,
        cacheHits,
        duration: performance.now() - started,
      },
      { transfer: [transferable.buffer] },
    )
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: message.requestId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export {}
