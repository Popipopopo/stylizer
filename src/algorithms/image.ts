export interface PixelBuffer {
  width: number
  height: number
  data: Uint8ClampedArray
}

export const clampByte = (value: number): number =>
  value < 0 ? 0 : value > 255 ? 255 : value

export function cloneBuffer(image: PixelBuffer): PixelBuffer {
  return { width: image.width, height: image.height, data: image.data.slice() }
}

export function fromImageData(image: ImageData): PixelBuffer {
  return { width: image.width, height: image.height, data: image.data }
}

export function toImageData(image: PixelBuffer): ImageData {
  return new ImageData(Uint8ClampedArray.from(image.data), image.width, image.height)
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').padEnd(6, '0').slice(0, 6)
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

export function rgbToHex(rgb: ArrayLike<number>): string {
  return `#${[rgb[0], rgb[1], rgb[2]]
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')}`
}
