export type AppMode = 'normal' | 'pixel' | 'color-block'
export type RenderQuality = 'draft' | 'preview' | 'export'

export interface BaseSettings {
  brightness: number
  contrast: number
  warmth: number
}

export interface PixelSettings {
  pixelScale: number
  dither: 'none' | 'bayer4' | 'bayer8' | 'floyd' | 'atkinson'
  levels: number
  ditherStrength: number
  grain: number
  chroma: number
  usePalette: boolean
  palette: string[]
  duotone: boolean
  dark: string
  light: string
}

export interface ColorBlockSettings {
  workingResolution: number
  previewQuality: number
  kuwaharaEnabled: boolean
  kuwaharaRadius: number
  kuwaharaStrength: number
  kuwaharaPasses: number
  paletteSize: number
  paletteSource: 'auto' | 'custom'
  customPalette: string[]
  minimumIslandArea: number
  cleanupRadius: number
  cleanupPasses: number
  textureAmount: number
  textureScale: number
  grainAmount: number
}

export interface AppSettings {
  mode: AppMode
  base: BaseSettings
  pixel: PixelSettings
  colorBlock: ColorBlockSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'color-block',
  base: { brightness: 0, contrast: 4, warmth: 0 },
  pixel: {
    pixelScale: 3,
    dither: 'bayer8',
    levels: 4,
    ditherStrength: 100,
    grain: 14,
    chroma: 1,
    usePalette: false,
    palette: ['#17130d', '#e7dcc4'],
    duotone: false,
    dark: '#1a140c',
    light: '#e8dcc2',
  },
  colorBlock: {
    workingResolution: 1200,
    previewQuality: 60,
    kuwaharaEnabled: true,
    kuwaharaRadius: 4,
    kuwaharaStrength: 82,
    kuwaharaPasses: 1,
    paletteSize: 8,
    paletteSource: 'auto',
    customPalette: ['#1d2525', '#4f6352', '#879476', '#c6c4a3', '#e8ddc1', '#5d4032'],
    minimumIslandArea: 20,
    cleanupRadius: 1,
    cleanupPasses: 1,
    textureAmount: 0,
    textureScale: 5,
    grainAmount: 0,
  },
}

export const COLOR_BLOCK_PRESETS: Record<string, Partial<ColorBlockSettings>> = {
  'Soft Painted Blocks': {
    kuwaharaRadius: 3,
    kuwaharaStrength: 72,
    kuwaharaPasses: 1,
    paletteSize: 10,
    minimumIslandArea: 12,
    cleanupRadius: 1,
    cleanupPasses: 1,
    textureAmount: 4,
    grainAmount: 2,
  },
  'Limited Green Environment': {
    kuwaharaRadius: 4,
    kuwaharaStrength: 86,
    paletteSize: 6,
    paletteSource: 'custom',
    customPalette: ['#17231b', '#304432', '#52644a', '#788365', '#a7aa82', '#d5cfaa'],
    minimumIslandArea: 18,
    cleanupRadius: 1,
    cleanupPasses: 1,
    textureAmount: 5,
    grainAmount: 1,
  },
  'Flat Landscape Illustration': {
    kuwaharaRadius: 6,
    kuwaharaStrength: 94,
    kuwaharaPasses: 2,
    paletteSize: 6,
    paletteSource: 'auto',
    minimumIslandArea: 42,
    cleanupRadius: 2,
    cleanupPasses: 2,
    textureAmount: 0,
    grainAmount: 0,
  },
}

export function cloneSettings(settings: AppSettings): AppSettings {
  return JSON.parse(JSON.stringify(settings)) as AppSettings
}
