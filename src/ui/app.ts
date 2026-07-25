import {
  COLOR_BLOCK_PRESETS,
  DEFAULT_SETTINGS,
  cloneSettings,
  type AppSettings,
  type RenderQuality,
} from '../model/settings'
import { decodeImage, drawResult, exportPng, type DecodedImage } from '../render/canvasRenderer'

interface WorkerResult {
  type: 'result'
  requestId: number
  quality: RenderQuality
  width: number
  height: number
  data: ArrayBuffer
  palette: string[]
  cacheHits: string[]
  duration: number
}

const STORAGE_KEY = 'image-color-block-stylizer.settings.v1'
const LANGUAGE_KEY = 'image-color-block-stylizer.language'

type Language = 'zh' | 'en'

const ZH: Record<string, string> = {
  'LOCAL CANVAS LAB': '本地画布实验室',
  'Select image': '选择图片',
  'Export PNG': '导出 PNG',
  'Zoom out': '缩小',
  'Zoom in': '放大',
  'Fit to view': '适合窗口',
  Undo: '撤销',
  Redo: '重做',
  Normal: '原图调色',
  'Pixel / Dither': '像素 / 抖动',
  'Color Block': '色块化',
  'Base Color': '基础调色',
  Brightness: '亮度',
  Contrast: '对比度',
  Warmth: '冷暖',
  'Pixel Scale': '像素尺寸',
  Dither: '抖动方式',
  None: '无',
  Levels: '色阶',
  'Dither Strength': '抖动强度',
  'Pre-Grain': '量化前颗粒',
  'Chromatic Offset': '色差偏移',
  'Pixel Palette': '像素色卡',
  'Use custom palette': '使用自定义色卡',
  Duotone: '双色调',
  Simplification: '简化',
  'Working Resolution': '工作分辨率',
  'Preview Quality': '预览质量',
  'Enable Kuwahara': '启用 Kuwahara',
  'Smoothing Radius': '平滑半径',
  'Smoothing Strength': '平滑强度',
  'Kuwahara Passes': 'Kuwahara 次数',
  Palette: '色卡',
  'Palette Size': '色卡数量',
  'Palette Source': '色卡来源',
  'Auto extract': '自动提取',
  Custom: '自定义',
  'Shape Cleanup': '形状清理',
  'Minimum Island Area': '最小碎块面积',
  'Cleanup Radius': '清理半径',
  'Cleanup Passes': '清理次数',
  Texture: '纹理',
  'Organic Variation': '有机变化',
  'Texture Scale': '纹理尺寸',
  'Fine Grain': '细颗粒',
  Presets: '预设',
  'Soft Painted Blocks': '柔和绘画色块',
  'Limited Green Environment': '限定绿色环境',
  'Flat Landscape Illustration': '扁平风景插画',
  'Drop, paste, or choose an image': '拖放、粘贴或选择一张图片',
  'Images stay entirely in your browser.': '图片只在浏览器本地处理，不会上传。',
  'No image': '尚未载入图片',
  Ready: '就绪',
  'Rendering export…': '正在计算导出图片…',
  'Processing…': '正在处理…',
  'Reading image…': '正在读取图片…',
  'Encoding PNG…': '正在编码 PNG…',
  Exported: '已导出',
  cache: '缓存',
}

function loadSettings(): AppSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')
    return {
      ...cloneSettings(DEFAULT_SETTINGS),
      ...stored,
      base: { ...DEFAULT_SETTINGS.base, ...stored.base },
      pixel: { ...DEFAULT_SETTINGS.pixel, ...stored.pixel },
      colorBlock: { ...DEFAULT_SETTINGS.colorBlock, ...stored.colorBlock },
    }
  } catch {
    return cloneSettings(DEFAULT_SETTINGS)
  }
}

const range = (
  label: string,
  path: string,
  min: number,
  max: number,
  step = 1,
  suffix = '',
): string => `
  <label class="control">
    <span>${label}<output data-output="${path}"></output></span>
    <input type="range" min="${min}" max="${max}" step="${step}" data-setting="${path}" data-suffix="${suffix}">
  </label>`

const select = (label: string, path: string, options: [string, string][]): string => `
  <label class="control">
    <span>${label}</span>
    <select data-setting="${path}">
      ${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}
    </select>
  </label>`

export function setupApp(root: HTMLElement): void {
  const language = (localStorage.getItem(LANGUAGE_KEY) as Language | null) ?? 'zh'
  const tr = (text: string): string => language === 'zh' ? (ZH[text] ?? text) : text
  let settings = loadSettings()
  let loadedName = 'color-block.png'
  let hasImage = false
  let latestPreviewRequest = 0
  let latestDisplayedRequest = 0
  let exportRequest = 0
  let requestCounter = 0
  let draftTimer = 0
  let finalTimer = 0
  let history: AppSettings[] = [cloneSettings(settings)]
  let historyIndex = 0
  let historyTimer = 0
  let zoom = 1

  root.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">${tr('LOCAL CANVAS LAB')}</p>
        <h1>Image Color Block Stylizer</h1>
      </div>
      <div class="header-actions">
        <button id="language" class="ghost" title="中文 / English">${language === 'zh' ? 'EN' : '中文'}</button>
        <button id="undo" class="ghost" title="${tr('Undo')}">↶</button>
        <button id="redo" class="ghost" title="${tr('Redo')}">↷</button>
        <button id="pick" class="ghost">${tr('Select image')}</button>
        <button id="export" class="primary" disabled>${tr('Export PNG')}</button>
        <input id="file" type="file" accept="image/*" hidden>
      </div>
    </header>

    <nav class="mode-tabs" aria-label="处理模式">
      <button data-mode="normal">${tr('Normal')}</button>
      <button data-mode="pixel">${tr('Pixel / Dither')}</button>
      <button data-mode="color-block">${tr('Color Block')}</button>
    </nav>

    <main class="workspace">
      <aside class="sidebar">
        <section class="panel">
          <div class="section-title"><h2>${tr('Base Color')}</h2></div>
          ${range(tr('Brightness'), 'base.brightness', -100, 100)}
          ${range(tr('Contrast'), 'base.contrast', -100, 100)}
          ${range(tr('Warmth'), 'base.warmth', -100, 100)}
        </section>

        <div id="pixel-controls">
          <section class="panel">
            <div class="section-title"><h2>${tr('Pixel / Dither')}</h2></div>
            ${range(tr('Pixel Scale'), 'pixel.pixelScale', 1, 12)}
            ${select(tr('Dither'), 'pixel.dither', [
              ['none', tr('None')], ['bayer4', 'Bayer 4×4'], ['bayer8', 'Bayer 8×8'],
              ['floyd', 'Floyd–Steinberg'], ['atkinson', 'Atkinson'],
            ])}
            ${range(tr('Levels'), 'pixel.levels', 2, 12)}
            ${range(tr('Dither Strength'), 'pixel.ditherStrength', 0, 100, 1, '%')}
            ${range(tr('Pre-Grain'), 'pixel.grain', 0, 80)}
            ${range(tr('Chromatic Offset'), 'pixel.chroma', 0, 8)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${tr('Pixel Palette')}</h2></div>
            <label class="check"><input type="checkbox" data-setting="pixel.usePalette"> ${tr('Use custom palette')}</label>
            <div id="pixel-palette" class="palette-edit"></div>
            <label class="check"><input type="checkbox" data-setting="pixel.duotone"> ${tr('Duotone')}</label>
            <div class="color-pair">
              <input type="color" data-setting="pixel.dark">
              <input type="color" data-setting="pixel.light">
            </div>
          </section>
        </div>

        <div id="color-block-controls">
          <section class="panel">
            <div class="section-title"><h2>${tr('Simplification')}</h2></div>
            ${range(tr('Working Resolution'), 'colorBlock.workingResolution', 320, 1800, 40, 'px')}
            ${range(tr('Preview Quality'), 'colorBlock.previewQuality', 25, 100, 5, '%')}
            <label class="check"><input type="checkbox" data-setting="colorBlock.kuwaharaEnabled"> ${tr('Enable Kuwahara')}</label>
            ${range(tr('Smoothing Radius'), 'colorBlock.kuwaharaRadius', 1, 10)}
            ${range(tr('Smoothing Strength'), 'colorBlock.kuwaharaStrength', 0, 100, 1, '%')}
            ${range(tr('Kuwahara Passes'), 'colorBlock.kuwaharaPasses', 1, 3)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${tr('Palette')}</h2><div id="result-palette" class="result-palette"></div></div>
            ${range(tr('Palette Size'), 'colorBlock.paletteSize', 4, 16)}
            ${select(tr('Palette Source'), 'colorBlock.paletteSource', [['auto', tr('Auto extract')], ['custom', tr('Custom')]])}
            <div id="custom-palette" class="palette-edit"></div>
          </section>
          <section class="panel">
            <div class="section-title"><h2>${tr('Shape Cleanup')}</h2></div>
            ${range(tr('Minimum Island Area'), 'colorBlock.minimumIslandArea', 0, 120)}
            ${range(tr('Cleanup Radius'), 'colorBlock.cleanupRadius', 0, 3)}
            ${range(tr('Cleanup Passes'), 'colorBlock.cleanupPasses', 0, 3)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${tr('Texture')}</h2></div>
            ${range(tr('Organic Variation'), 'colorBlock.textureAmount', 0, 30)}
            ${range(tr('Texture Scale'), 'colorBlock.textureScale', 1, 20)}
            ${range(tr('Fine Grain'), 'colorBlock.grainAmount', 0, 20)}
          </section>
          <section class="panel presets">
            <div class="section-title"><h2>${tr('Presets')}</h2></div>
            ${Object.keys(COLOR_BLOCK_PRESETS).map((name) => `<button data-preset="${name}">${tr(name)}</button>`).join('')}
          </section>
        </div>
      </aside>

      <section id="stage" class="stage">
        <div id="drop" class="drop-message">
          <strong>${tr('Drop, paste, or choose an image')}</strong>
          <span>${tr('Images stay entirely in your browser.')}</span>
          <button id="stage-pick" class="primary">${tr('Select image')}</button>
        </div>
        <div class="canvas-wrap" id="canvas-wrap">
          <div class="canvas-content"><canvas id="preview"></canvas></div>
          <div class="zoom-controls" aria-label="Zoom controls">
            <button id="zoom-out" class="ghost" title="${tr('Zoom out')}" aria-label="${tr('Zoom out')}">−</button>
            <button id="zoom-fit" class="ghost zoom-value" title="${tr('Fit to view')}">100%</button>
            <button id="zoom-in" class="ghost" title="${tr('Zoom in')}" aria-label="${tr('Zoom in')}">+</button>
          </div>
        </div>
        <footer class="statusbar">
          <span id="image-info">${tr('No image')}</span>
          <span id="status">${tr('Ready')}</span>
        </footer>
      </section>
    </main>
  `

  const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
    type: 'module',
  })
  const canvas = root.querySelector<HTMLCanvasElement>('#preview')!
  const canvasWrap = root.querySelector<HTMLElement>('#canvas-wrap')!
  const status = root.querySelector<HTMLElement>('#status')!
  const imageInfo = root.querySelector<HTMLElement>('#image-info')!
  const fileInput = root.querySelector<HTMLInputElement>('#file')!

  const applyZoom = (nextZoom: number): void => {
    zoom = Math.min(8, Math.max(0.1, nextZoom))
    canvas.style.width = `${canvas.width * zoom}px`
    canvas.style.height = `${canvas.height * zoom}px`
    root.querySelector<HTMLButtonElement>('#zoom-fit')!.textContent = `${Math.round(zoom * 100)}%`
  }

  const fitCanvas = (): void => {
    if (!canvas.width || !canvas.height) return
    const availableWidth = Math.max(1, canvasWrap.clientWidth - 64)
    const availableHeight = Math.max(1, canvasWrap.clientHeight - 64)
    applyZoom(Math.min(1, availableWidth / canvas.width, availableHeight / canvas.height))
  }

  const getPath = (path: string): unknown => {
    const [group, key] = path.split('.') as [keyof AppSettings, string]
    return (settings[group] as unknown as Record<string, unknown>)[key]
  }

  const setPath = (path: string, value: unknown): void => {
    const [group, key] = path.split('.') as [keyof AppSettings, string]
    ;(settings[group] as unknown as Record<string, unknown>)[key] = value
  }

  const updateHistoryButtons = (): void => {
    root.querySelector<HTMLButtonElement>('#undo')!.disabled = historyIndex <= 0
    root.querySelector<HTMLButtonElement>('#redo')!.disabled = historyIndex >= history.length - 1
  }

  const commitHistory = (): void => {
    window.clearTimeout(historyTimer)
    historyTimer = window.setTimeout(() => {
      const snapshot = cloneSettings(settings)
      if (JSON.stringify(snapshot) === JSON.stringify(history[historyIndex])) return
      history = history.slice(0, historyIndex + 1)
      history.push(snapshot)
      if (history.length > 80) history.shift()
      historyIndex = history.length - 1
      updateHistoryButtons()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }, 300)
  }

  const renderPaletteEditors = (): void => {
    const custom = root.querySelector<HTMLElement>('#custom-palette')!
    custom.innerHTML = settings.colorBlock.customPalette
      .map((color, index) => `<input type="color" value="${color}" data-custom-color="${index}" title="Custom color ${index + 1}">`)
      .join('')
    custom.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.addEventListener('input', () => {
        settings.colorBlock.customPalette[Number(input.dataset.customColor)] = input.value
        queueRender('draft')
        commitHistory()
      })
      input.addEventListener('change', () => queueRender('preview'))
    })

    const pixel = root.querySelector<HTMLElement>('#pixel-palette')!
    pixel.innerHTML = settings.pixel.palette
      .map((color, index) => `<input type="color" value="${color}" data-pixel-color="${index}">`)
      .join('')
    pixel.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.addEventListener('input', () => {
        settings.pixel.palette[Number(input.dataset.pixelColor)] = input.value
        queueRender('draft')
        commitHistory()
      })
    })
  }

  const syncUi = (): void => {
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]').forEach((input) => {
      const path = input.dataset.setting!
      const value = getPath(path)
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        input.checked = Boolean(value)
      } else {
        input.value = String(value)
      }
      const output = root.querySelector<HTMLOutputElement>(`[data-output="${path}"]`)
      if (output) output.textContent = ` ${value}${input.dataset.suffix ?? ''}`
    })
    root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === settings.mode)
    })
    root.querySelector<HTMLElement>('#pixel-controls')!.hidden = settings.mode !== 'pixel'
    root.querySelector<HTMLElement>('#color-block-controls')!.hidden = settings.mode !== 'color-block'
    renderPaletteEditors()
    updateHistoryButtons()
  }

  const postRender = (quality: RenderQuality): number => {
    if (!hasImage) return 0
    const requestId = ++requestCounter
    if (quality !== 'export') latestPreviewRequest = requestId
    status.textContent =
      quality === 'export' ? tr('Rendering export…') : tr('Processing…')
    worker.postMessage({ type: 'render', requestId, quality, settings: cloneSettings(settings) })
    return requestId
  }

  const queueRender = (quality: 'draft' | 'preview'): void => {
    if (!hasImage) return
    if (quality === 'draft') {
      window.clearTimeout(draftTimer)
      draftTimer = window.setTimeout(() => postRender('draft'), 35)
      window.clearTimeout(finalTimer)
      finalTimer = window.setTimeout(() => postRender('preview'), 360)
    } else {
      window.clearTimeout(draftTimer)
      window.clearTimeout(finalTimer)
      postRender('preview')
    }
  }

  const loadDecoded = (image: DecodedImage): void => {
    hasImage = true
    loadedName = image.name.replace(/\.[^.]+$/, '') || 'color-block'
    imageInfo.textContent = `${image.name} · ${image.width} × ${image.height}`
    root.querySelector<HTMLButtonElement>('#export')!.disabled = false
    root.querySelector<HTMLElement>('#stage')!.classList.add('has-image')
    const sourceId = `${image.name}:${image.width}x${image.height}:${Date.now()}`
    worker.postMessage(
      { type: 'load', sourceId, width: image.width, height: image.height, data: image.data.buffer },
      [image.data.buffer],
    )
  }

  const loadFile = async (file?: File): Promise<void> => {
    if (!file) return
    try {
      status.textContent = tr('Reading image…')
      loadDecoded(await decodeImage(file))
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : String(error)
    }
  }

  worker.onmessage = (event: MessageEvent<WorkerResult | { type: string; requestId?: number; error?: string }>) => {
    const message = event.data
    if (message.type === 'loaded') {
      postRender('preview')
      return
    }
    if (message.type === 'error') {
      status.textContent = `Error: ${message.error}`
      return
    }
    const result = message as WorkerResult
    const pixels = new Uint8ClampedArray(result.data)
    if (result.requestId === exportRequest) {
      exportRequest = 0
      status.textContent = tr('Encoding PNG…')
      void exportPng(
        result.width,
        result.height,
        pixels,
        settings.mode,
        settings.pixel.pixelScale,
        `${loadedName}-stylized.png`,
      ).then(() => {
        status.textContent = `${tr('Exported')} · ${Math.round(result.duration)} ms`
      }).catch((error) => {
        status.textContent = error instanceof Error ? error.message : String(error)
      })
      return
    }
    if (result.requestId < latestPreviewRequest || result.requestId < latestDisplayedRequest) return
    latestDisplayedRequest = result.requestId
    drawResult(canvas, result.width, result.height, pixels, settings.mode)
    applyZoom(zoom)
    const cache = result.cacheHits.length
      ? ` · ${tr('cache')} ${result.cacheHits.join(', ')}`
      : ''
    status.textContent = `${result.width} × ${result.height} · ${Math.round(result.duration)} ms${cache}`
    root.querySelector<HTMLElement>('#result-palette')!.innerHTML = result.palette
      .map((color) => `<i style="--swatch:${color}" title="${color}"></i>`)
      .join('')
  }

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]').forEach((input) => {
    const update = (): void => {
      const value =
        input instanceof HTMLInputElement && input.type === 'checkbox'
          ? input.checked
          : input instanceof HTMLInputElement && input.type === 'range'
            ? Number(input.value)
            : input.value
      setPath(input.dataset.setting!, value)
      const output = root.querySelector<HTMLOutputElement>(
        `[data-output="${input.dataset.setting}"]`,
      )
      if (output) output.textContent = ` ${value}${input.dataset.suffix ?? ''}`
      queueRender('draft')
      commitHistory()
    }
    input.addEventListener('input', update)
    input.addEventListener('change', () => queueRender('preview'))
  })

  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      settings.mode = button.dataset.mode as AppSettings['mode']
      syncUi()
      queueRender('preview')
      commitHistory()
    })
  })
  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      settings.mode = 'color-block'
      Object.assign(settings.colorBlock, COLOR_BLOCK_PRESETS[button.dataset.preset!])
      syncUi()
      queueRender('preview')
      commitHistory()
    })
  })

  const travelHistory = (step: number): void => {
    const next = historyIndex + step
    if (next < 0 || next >= history.length) return
    historyIndex = next
    settings = cloneSettings(history[historyIndex])
    syncUi()
    queueRender('preview')
  }
  root.querySelector<HTMLButtonElement>('#undo')!.addEventListener('click', () => travelHistory(-1))
  root.querySelector<HTMLButtonElement>('#redo')!.addEventListener('click', () => travelHistory(1))
  window.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault()
      travelHistory(event.shiftKey ? 1 : -1)
    } else if (event.key.toLowerCase() === 'y') {
      event.preventDefault()
      travelHistory(1)
    }
  })

  root.querySelector<HTMLButtonElement>('#language')!.addEventListener('click', () => {
    localStorage.setItem(LANGUAGE_KEY, language === 'zh' ? 'en' : 'zh')
    window.location.reload()
  })
  root.querySelector<HTMLButtonElement>('#pick')!.addEventListener('click', () => fileInput.click())
  root.querySelector<HTMLButtonElement>('#stage-pick')!.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => void loadFile(fileInput.files?.[0]))
  root.querySelector<HTMLButtonElement>('#export')!.addEventListener('click', () => {
    exportRequest = postRender('export')
  })

  root.querySelector<HTMLButtonElement>('#zoom-out')!.addEventListener('click', () => applyZoom(zoom / 1.25))
  root.querySelector<HTMLButtonElement>('#zoom-in')!.addEventListener('click', () => applyZoom(zoom * 1.25))
  root.querySelector<HTMLButtonElement>('#zoom-fit')!.addEventListener('click', fitCanvas)
  canvasWrap.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey) || !hasImage) return
    event.preventDefault()
    const bounds = canvas.getBoundingClientRect()
    const imageX = (event.clientX - bounds.left) / zoom
    const imageY = (event.clientY - bounds.top) / zoom
    const wrapBounds = canvasWrap.getBoundingClientRect()
    const nextZoom = zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)
    applyZoom(nextZoom)
    const nextBounds = canvas.getBoundingClientRect()
    canvasWrap.scrollLeft += nextBounds.left + imageX * zoom - event.clientX
    canvasWrap.scrollTop += nextBounds.top + imageY * zoom - event.clientY
    // Keep the pointer's image position stable while zooming.
    if (event.clientX < wrapBounds.left || event.clientY < wrapBounds.top) fitCanvas()
  }, { passive: false })

  const stage = root.querySelector<HTMLElement>('#stage')!
  stage.addEventListener('dragover', (event) => {
    event.preventDefault()
    stage.classList.add('dragging')
  })
  stage.addEventListener('dragleave', () => stage.classList.remove('dragging'))
  stage.addEventListener('drop', (event) => {
    event.preventDefault()
    stage.classList.remove('dragging')
    void loadFile(event.dataTransfer?.files[0])
  })
  window.addEventListener('paste', (event) => {
    const item = [...event.clipboardData?.items ?? []].find((entry) => entry.type.startsWith('image/'))
    if (item) void loadFile(item.getAsFile() ?? undefined)
  })

  syncUi()
}
