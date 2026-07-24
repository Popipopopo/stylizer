# 观测箱 · Stylizer

一个纯前端的图像风格化工具：抖动（dither）、色卡（palette）、胶片颗粒、色差。上传一张图 → 拉滑杆 → 实时预览 → 导出 PNG。全程在浏览器本地跑，不上传任何图片，无第三方依赖。

A tiny client-side image degrader: dithering, palette quantization, film grain, chromatic aberration. Everything runs locally in the browser — no uploads, no dependencies.

## 直接用

在线版：**https://popipopopo.github.io/stylizer/**

也可以把 `index.html` 下载到本地，用浏览器直接打开，功能完全一样。

## 部署到 GitHub Pages

1. 新建一个仓库，把 `index.html`（和这个 README）放进去
2. 仓库 **Settings → Pages**
3. Source 选 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`，保存
4. 等一两分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`（本仓库即 https://popipopopo.github.io/stylizer/ ）

因为文件叫 `index.html` 且在根目录，这个链接会直接打开工具。

## 功能

- 降分辨率、亮度 / 对比度 / 冷暖调色
- 抖动：无 / Bayer 4×4 / Bayer 8×8 / Floyd–Steinberg / Atkinson
- 色卡：可增删改的调色板 + 预设 + 从图提取；抖动会把画面量化到色卡里的颜色
- 双色调、胶片颗粒、色差
- 预设：内置几套，也能把当前设置存成命名预设；自动记住上次的设置
- 撤销 / 重做：`Ctrl/⌘ + Z` 撤销，`Ctrl/⌘ + Shift + Z`（或 `Ctrl + Y`）重做。拖一次滑杆算一步，不会被拆成几十步
- 导出 PNG：Chrome / Edge 里会弹出系统保存对话框，可以自己挑文件夹；Firefox / Safari 没有这个 API，自动退回直接下载

## 技术

单文件 HTML + Canvas 2D + 原生 JavaScript，无构建步骤、无外部库。所有效果都是逐像素的纯函数，想加新效果照着现有函数写一个即可。
