import type { AppMode } from '../model/settings'

export interface DecodedImage {
  width: number
  height: number
  data: Uint8ClampedArray
  name: string
}

export async function decodeImage(file: File): Promise<DecodedImage> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件。')
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('浏览器无法创建 Canvas 2D。')
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  return { width: image.width, height: image.height, data: image.data, name: file.name }
}

export function drawResult(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  data: Uint8ClampedArray,
  mode: AppMode,
): void {
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return
  context.putImageData(new ImageData(Uint8ClampedArray.from(data), width, height), 0, 0)
  canvas.classList.toggle('pixelated', mode === 'pixel')
}

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片编码失败。'))),
      'image/png',
    )
  })

export async function exportPng(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  mode: AppMode,
  pixelScale: number,
  suggestedName: string,
): Promise<void> {
  const source = document.createElement('canvas')
  source.width = width
  source.height = height
  source
    .getContext('2d')!
    .putImageData(new ImageData(Uint8ClampedArray.from(data), width, height), 0, 0)

  const scale =
    mode === 'pixel'
      ? Math.max(1, Math.floor(Math.min(pixelScale, 4096 / width, 4096 / height)))
      : 1
  const output = document.createElement('canvas')
  output.width = width * scale
  output.height = height * scale
  const context = output.getContext('2d')!
  context.imageSmoothingEnabled = false
  context.drawImage(source, 0, 0, output.width, output.height)
  const blob = await canvasBlob(output)

  type PickerWindow = Window & {
    showSaveFilePicker?: (options: unknown) => Promise<{
      createWritable: () => Promise<{ write: (blob: Blob) => Promise<void>; close: () => Promise<void> }>
    }>
  }
  const picker = (window as PickerWindow).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: 'PNG 图片', accept: { 'image/png': ['.png'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
