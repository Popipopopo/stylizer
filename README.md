# Image Color Block Stylizer

浏览器端、本地优先的图片色块化工具。图片不会上传到服务器。

## 开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
npm run build
```

第一阶段包含 Normal、Pixel / Dither 和 Color Block 三种模式。Color Block 管线使用
Web Worker 执行 Kuwahara 保边平滑、OKLab 自动色卡、连通区域清理、majority filter
及后置纹理，并按阶段缓存中间结果。
