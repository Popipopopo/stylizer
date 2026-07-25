(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={mode:`color-block`,base:{brightness:0,contrast:4,warmth:0},pixel:{pixelScale:3,dither:`bayer8`,levels:4,ditherStrength:100,grain:14,chroma:1,usePalette:!1,palette:[`#17130d`,`#e7dcc4`],duotone:!1,dark:`#1a140c`,light:`#e8dcc2`},colorBlock:{workingResolution:1200,previewQuality:60,kuwaharaEnabled:!0,kuwaharaRadius:4,kuwaharaStrength:82,kuwaharaPasses:1,paletteSize:8,paletteSource:`auto`,customPalette:[`#1d2525`,`#4f6352`,`#879476`,`#c6c4a3`,`#e8ddc1`,`#5d4032`],minimumIslandArea:20,cleanupRadius:1,cleanupPasses:1,textureAmount:0,textureScale:5,grainAmount:0}},t={"Soft Painted Blocks":{kuwaharaRadius:3,kuwaharaStrength:72,kuwaharaPasses:1,paletteSize:10,minimumIslandArea:12,cleanupRadius:1,cleanupPasses:1,textureAmount:4,grainAmount:2},"Limited Green Environment":{kuwaharaRadius:4,kuwaharaStrength:86,paletteSize:6,paletteSource:`custom`,customPalette:[`#17231b`,`#304432`,`#52644a`,`#788365`,`#a7aa82`,`#d5cfaa`],minimumIslandArea:18,cleanupRadius:1,cleanupPasses:1,textureAmount:5,grainAmount:1},"Flat Landscape Illustration":{kuwaharaRadius:6,kuwaharaStrength:94,kuwaharaPasses:2,paletteSize:6,paletteSource:`auto`,minimumIslandArea:42,cleanupRadius:2,cleanupPasses:2,textureAmount:0,grainAmount:0}};function n(e){return JSON.parse(JSON.stringify(e))}async function r(e){if(!e.type.startsWith(`image/`))throw Error(`请选择图片文件。`);let t=await createImageBitmap(e),n=document.createElement(`canvas`);n.width=t.width,n.height=t.height;let r=n.getContext(`2d`,{willReadFrequently:!0});if(!r)throw Error(`浏览器无法创建 Canvas 2D。`);r.drawImage(t,0,0),t.close();let i=r.getImageData(0,0,n.width,n.height);return{width:i.width,height:i.height,data:i.data,name:e.name}}function i(e,t,n,r,i){e.width=t,e.height=n;let a=e.getContext(`2d`);a&&(a.putImageData(new ImageData(Uint8ClampedArray.from(r),t,n),0,0),e.classList.toggle(`pixelated`,i===`pixel`))}var a=e=>new Promise((t,n)=>{e.toBlob(e=>e?t(e):n(Error(`图片编码失败。`)),`image/png`)});async function o(e,t,n,r,i,o){let s=document.createElement(`canvas`);s.width=e,s.height=t,s.getContext(`2d`).putImageData(new ImageData(Uint8ClampedArray.from(n),e,t),0,0);let c=r===`pixel`?Math.max(1,Math.floor(Math.min(i,4096/e,4096/t))):1,l=document.createElement(`canvas`);l.width=e*c,l.height=t*c;let u=l.getContext(`2d`);u.imageSmoothingEnabled=!1,u.drawImage(s,0,0,l.width,l.height);let d=await a(l),f=window.showSaveFilePicker;if(f)try{let e=await(await f({suggestedName:o,types:[{description:`PNG 图片`,accept:{"image/png":[`.png`]}}]})).createWritable();await e.write(d),await e.close();return}catch(e){if(e instanceof DOMException&&e.name===`AbortError`)return}let p=URL.createObjectURL(d),m=document.createElement(`a`);m.href=p,m.download=o,m.click(),setTimeout(()=>URL.revokeObjectURL(p),1e3)}var s=`image-color-block-stylizer.settings.v1`,c=`image-color-block-stylizer.language`,l={"LOCAL CANVAS LAB":`本地画布实验室`,"Select image":`选择图片`,"Export PNG":`导出 PNG`,"Zoom out":`缩小`,"Zoom in":`放大`,"Fit to view":`适合窗口`,Undo:`撤销`,Redo:`重做`,Normal:`原图调色`,"Pixel / Dither":`像素 / 抖动`,"Color Block":`色块化`,"Base Color":`基础调色`,Brightness:`亮度`,Contrast:`对比度`,Warmth:`冷暖`,"Pixel Scale":`像素尺寸`,Dither:`抖动方式`,None:`无`,Levels:`色阶`,"Dither Strength":`抖动强度`,"Pre-Grain":`量化前颗粒`,"Chromatic Offset":`色差偏移`,"Pixel Palette":`像素色卡`,"Use custom palette":`使用自定义色卡`,Duotone:`双色调`,Simplification:`简化`,"Working Resolution":`工作分辨率`,"Preview Quality":`预览质量`,"Enable Kuwahara":`启用 Kuwahara`,"Smoothing Radius":`平滑半径`,"Smoothing Strength":`平滑强度`,"Kuwahara Passes":`Kuwahara 次数`,Palette:`色卡`,"Palette Size":`色卡数量`,"Palette Source":`色卡来源`,"Auto extract":`自动提取`,Custom:`自定义`,"Shape Cleanup":`形状清理`,"Minimum Island Area":`最小碎块面积`,"Cleanup Radius":`清理半径`,"Cleanup Passes":`清理次数`,Texture:`纹理`,"Organic Variation":`有机变化`,"Texture Scale":`纹理尺寸`,"Fine Grain":`细颗粒`,Presets:`预设`,"Soft Painted Blocks":`柔和绘画色块`,"Limited Green Environment":`限定绿色环境`,"Flat Landscape Illustration":`扁平风景插画`,"Drop, paste, or choose an image":`拖放、粘贴或选择一张图片`,"Images stay entirely in your browser.":`图片只在浏览器本地处理，不会上传。`,"No image":`尚未载入图片`,Ready:`就绪`,"Rendering export…":`正在计算导出图片…`,"Processing…":`正在处理…`,"Reading image…":`正在读取图片…`,"Encoding PNG…":`正在编码 PNG…`,Exported:`已导出`,cache:`缓存`};function u(){try{let t=JSON.parse(localStorage.getItem(s)??``);return{...n(e),...t,base:{...e.base,...t.base},pixel:{...e.pixel,...t.pixel},colorBlock:{...e.colorBlock,...t.colorBlock}}}catch{return n(e)}}var d=(e,t,n,r,i=1,a=``)=>`
  <label class="control">
    <span>${e}<output data-output="${t}"></output></span>
    <input type="range" min="${n}" max="${r}" step="${i}" data-setting="${t}" data-suffix="${a}">
  </label>`,f=(e,t,n)=>`
  <label class="control">
    <span>${e}</span>
    <select data-setting="${t}">
      ${n.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``)}
    </select>
  </label>`;function p(e){let a=localStorage.getItem(c)??`zh`,p=e=>a===`zh`?l[e]??e:e,m=u(),h=`color-block.png`,g=!1,_=0,v=0,y=0,b=0,x=0,S=0,C=[n(m)],w=0,T=0,E=1;e.innerHTML=`
    <header class="topbar">
      <div>
        <p class="eyebrow">${p(`LOCAL CANVAS LAB`)}</p>
        <h1>Image Color Block Stylizer</h1>
      </div>
      <div class="header-actions">
        <button id="language" class="ghost" title="中文 / English">${a===`zh`?`EN`:`中文`}</button>
        <button id="undo" class="ghost" title="${p(`Undo`)}">↶</button>
        <button id="redo" class="ghost" title="${p(`Redo`)}">↷</button>
        <button id="pick" class="ghost">${p(`Select image`)}</button>
        <button id="export" class="primary" disabled>${p(`Export PNG`)}</button>
        <input id="file" type="file" accept="image/*" hidden>
      </div>
    </header>

    <nav class="mode-tabs" aria-label="处理模式">
      <button data-mode="normal">${p(`Normal`)}</button>
      <button data-mode="pixel">${p(`Pixel / Dither`)}</button>
      <button data-mode="color-block">${p(`Color Block`)}</button>
    </nav>

    <main class="workspace">
      <aside class="sidebar">
        <section class="panel">
          <div class="section-title"><h2>${p(`Base Color`)}</h2></div>
          ${d(p(`Brightness`),`base.brightness`,-100,100)}
          ${d(p(`Contrast`),`base.contrast`,-100,100)}
          ${d(p(`Warmth`),`base.warmth`,-100,100)}
        </section>

        <div id="pixel-controls">
          <section class="panel">
            <div class="section-title"><h2>${p(`Pixel / Dither`)}</h2></div>
            ${d(p(`Pixel Scale`),`pixel.pixelScale`,1,12)}
            ${f(p(`Dither`),`pixel.dither`,[[`none`,p(`None`)],[`bayer4`,`Bayer 4×4`],[`bayer8`,`Bayer 8×8`],[`floyd`,`Floyd–Steinberg`],[`atkinson`,`Atkinson`]])}
            ${d(p(`Levels`),`pixel.levels`,2,12)}
            ${d(p(`Dither Strength`),`pixel.ditherStrength`,0,100,1,`%`)}
            ${d(p(`Pre-Grain`),`pixel.grain`,0,80)}
            ${d(p(`Chromatic Offset`),`pixel.chroma`,0,8)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${p(`Pixel Palette`)}</h2></div>
            <label class="check"><input type="checkbox" data-setting="pixel.usePalette"> ${p(`Use custom palette`)}</label>
            <div id="pixel-palette" class="palette-edit"></div>
            <label class="check"><input type="checkbox" data-setting="pixel.duotone"> ${p(`Duotone`)}</label>
            <div class="color-pair">
              <input type="color" data-setting="pixel.dark">
              <input type="color" data-setting="pixel.light">
            </div>
          </section>
        </div>

        <div id="color-block-controls">
          <section class="panel">
            <div class="section-title"><h2>${p(`Simplification`)}</h2></div>
            ${d(p(`Working Resolution`),`colorBlock.workingResolution`,320,1800,40,`px`)}
            ${d(p(`Preview Quality`),`colorBlock.previewQuality`,25,100,5,`%`)}
            <label class="check"><input type="checkbox" data-setting="colorBlock.kuwaharaEnabled"> ${p(`Enable Kuwahara`)}</label>
            ${d(p(`Smoothing Radius`),`colorBlock.kuwaharaRadius`,1,10)}
            ${d(p(`Smoothing Strength`),`colorBlock.kuwaharaStrength`,0,100,1,`%`)}
            ${d(p(`Kuwahara Passes`),`colorBlock.kuwaharaPasses`,1,3)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${p(`Palette`)}</h2><div id="result-palette" class="result-palette"></div></div>
            ${d(p(`Palette Size`),`colorBlock.paletteSize`,4,16)}
            ${f(p(`Palette Source`),`colorBlock.paletteSource`,[[`auto`,p(`Auto extract`)],[`custom`,p(`Custom`)]])}
            <div id="custom-palette" class="palette-edit"></div>
          </section>
          <section class="panel">
            <div class="section-title"><h2>${p(`Shape Cleanup`)}</h2></div>
            ${d(p(`Minimum Island Area`),`colorBlock.minimumIslandArea`,0,120)}
            ${d(p(`Cleanup Radius`),`colorBlock.cleanupRadius`,0,3)}
            ${d(p(`Cleanup Passes`),`colorBlock.cleanupPasses`,0,3)}
          </section>
          <section class="panel">
            <div class="section-title"><h2>${p(`Texture`)}</h2></div>
            ${d(p(`Organic Variation`),`colorBlock.textureAmount`,0,30)}
            ${d(p(`Texture Scale`),`colorBlock.textureScale`,1,20)}
            ${d(p(`Fine Grain`),`colorBlock.grainAmount`,0,20)}
          </section>
          <section class="panel presets">
            <div class="section-title"><h2>${p(`Presets`)}</h2></div>
            ${Object.keys(t).map(e=>`<button data-preset="${e}">${p(e)}</button>`).join(``)}
          </section>
        </div>
      </aside>

      <section id="stage" class="stage">
        <div id="drop" class="drop-message">
          <strong>${p(`Drop, paste, or choose an image`)}</strong>
          <span>${p(`Images stay entirely in your browser.`)}</span>
          <button id="stage-pick" class="primary">${p(`Select image`)}</button>
        </div>
        <div class="canvas-wrap" id="canvas-wrap">
          <div class="canvas-content"><canvas id="preview"></canvas></div>
          <div class="zoom-controls" aria-label="Zoom controls">
            <button id="zoom-out" class="ghost" title="${p(`Zoom out`)}" aria-label="${p(`Zoom out`)}">−</button>
            <button id="zoom-fit" class="ghost zoom-value" title="${p(`Fit to view`)}">100%</button>
            <button id="zoom-in" class="ghost" title="${p(`Zoom in`)}" aria-label="${p(`Zoom in`)}">+</button>
          </div>
        </div>
        <footer class="statusbar">
          <span id="image-info">${p(`No image`)}</span>
          <span id="status">${p(`Ready`)}</span>
        </footer>
      </section>
    </main>
  `;let D=new Worker(new URL(``+new URL(`image.worker-BDakSIWp.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),O=e.querySelector(`#preview`),k=e.querySelector(`#canvas-wrap`),A=e.querySelector(`#status`),j=e.querySelector(`#image-info`),M=e.querySelector(`#file`),N=t=>{E=Math.min(8,Math.max(.1,t)),O.style.width=`${O.width*E}px`,O.style.height=`${O.height*E}px`,e.querySelector(`#zoom-fit`).textContent=`${Math.round(E*100)}%`},P=()=>{if(!O.width||!O.height)return;let e=Math.max(1,k.clientWidth-64),t=Math.max(1,k.clientHeight-64);N(Math.min(1,e/O.width,t/O.height))},F=e=>{let[t,n]=e.split(`.`);return m[t][n]},I=(e,t)=>{let[n,r]=e.split(`.`);m[n][r]=t},L=()=>{e.querySelector(`#undo`).disabled=w<=0,e.querySelector(`#redo`).disabled=w>=C.length-1},R=()=>{window.clearTimeout(T),T=window.setTimeout(()=>{let e=n(m);JSON.stringify(e)!==JSON.stringify(C[w])&&(C=C.slice(0,w+1),C.push(e),C.length>80&&C.shift(),w=C.length-1,L(),localStorage.setItem(s,JSON.stringify(m)))},300)},z=()=>{let t=e.querySelector(`#custom-palette`);t.innerHTML=m.colorBlock.customPalette.map((e,t)=>`<input type="color" value="${e}" data-custom-color="${t}" title="Custom color ${t+1}">`).join(``),t.querySelectorAll(`input`).forEach(e=>{e.addEventListener(`input`,()=>{m.colorBlock.customPalette[Number(e.dataset.customColor)]=e.value,H(`draft`),R()}),e.addEventListener(`change`,()=>H(`preview`))});let n=e.querySelector(`#pixel-palette`);n.innerHTML=m.pixel.palette.map((e,t)=>`<input type="color" value="${e}" data-pixel-color="${t}">`).join(``),n.querySelectorAll(`input`).forEach(e=>{e.addEventListener(`input`,()=>{m.pixel.palette[Number(e.dataset.pixelColor)]=e.value,H(`draft`),R()})})},B=()=>{e.querySelectorAll(`[data-setting]`).forEach(t=>{let n=t.dataset.setting,r=F(n);t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked=!!r:t.value=String(r);let i=e.querySelector(`[data-output="${n}"]`);i&&(i.textContent=` ${r}${t.dataset.suffix??``}`)}),e.querySelectorAll(`[data-mode]`).forEach(e=>{e.classList.toggle(`active`,e.dataset.mode===m.mode)}),e.querySelector(`#pixel-controls`).hidden=m.mode!==`pixel`,e.querySelector(`#color-block-controls`).hidden=m.mode!==`color-block`,z(),L()},V=e=>{if(!g)return 0;let t=++b;return e!==`export`&&(_=t),A.textContent=p(e===`export`?`Rendering export…`:`Processing…`),D.postMessage({type:`render`,requestId:t,quality:e,settings:n(m)}),t},H=e=>{g&&(e===`draft`?(window.clearTimeout(x),x=window.setTimeout(()=>V(`draft`),35),window.clearTimeout(S),S=window.setTimeout(()=>V(`preview`),360)):(window.clearTimeout(x),window.clearTimeout(S),V(`preview`)))},U=t=>{g=!0,h=t.name.replace(/\.[^.]+$/,``)||`color-block`,j.textContent=`${t.name} · ${t.width} × ${t.height}`,e.querySelector(`#export`).disabled=!1,e.querySelector(`#stage`).classList.add(`has-image`);let n=`${t.name}:${t.width}x${t.height}:${Date.now()}`;D.postMessage({type:`load`,sourceId:n,width:t.width,height:t.height,data:t.data.buffer},[t.data.buffer])},W=async e=>{if(e)try{A.textContent=p(`Reading image…`),U(await r(e))}catch(e){A.textContent=e instanceof Error?e.message:String(e)}};D.onmessage=t=>{let n=t.data;if(n.type===`loaded`){V(`preview`);return}if(n.type===`error`){A.textContent=`Error: ${n.error}`;return}let r=n,a=new Uint8ClampedArray(r.data);if(r.requestId===y){y=0,A.textContent=p(`Encoding PNG…`),o(r.width,r.height,a,m.mode,m.pixel.pixelScale,`${h}-stylized.png`).then(()=>{A.textContent=`${p(`Exported`)} · ${Math.round(r.duration)} ms`}).catch(e=>{A.textContent=e instanceof Error?e.message:String(e)});return}if(r.requestId<_||r.requestId<v)return;v=r.requestId,i(O,r.width,r.height,a,m.mode),N(E);let s=r.cacheHits.length?` · ${p(`cache`)} ${r.cacheHits.join(`, `)}`:``;A.textContent=`${r.width} × ${r.height} · ${Math.round(r.duration)} ms${s}`,e.querySelector(`#result-palette`).innerHTML=r.palette.map(e=>`<i style="--swatch:${e}" title="${e}"></i>`).join(``)},e.querySelectorAll(`[data-setting]`).forEach(t=>{t.addEventListener(`input`,()=>{let n=t instanceof HTMLInputElement&&t.type===`checkbox`?t.checked:t instanceof HTMLInputElement&&t.type===`range`?Number(t.value):t.value;I(t.dataset.setting,n);let r=e.querySelector(`[data-output="${t.dataset.setting}"]`);r&&(r.textContent=` ${n}${t.dataset.suffix??``}`),H(`draft`),R()}),t.addEventListener(`change`,()=>H(`preview`))}),e.querySelectorAll(`[data-mode]`).forEach(e=>{e.addEventListener(`click`,()=>{m.mode=e.dataset.mode,B(),H(`preview`),R()})}),e.querySelectorAll(`[data-preset]`).forEach(e=>{e.addEventListener(`click`,()=>{m.mode=`color-block`,Object.assign(m.colorBlock,t[e.dataset.preset]),B(),H(`preview`),R()})});let G=e=>{let t=w+e;t<0||t>=C.length||(w=t,m=n(C[w]),B(),H(`preview`))};e.querySelector(`#undo`).addEventListener(`click`,()=>G(-1)),e.querySelector(`#redo`).addEventListener(`click`,()=>G(1)),window.addEventListener(`keydown`,e=>{(e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()===`z`?(e.preventDefault(),G(e.shiftKey?1:-1)):e.key.toLowerCase()===`y`&&(e.preventDefault(),G(1)))}),e.querySelector(`#language`).addEventListener(`click`,()=>{localStorage.setItem(c,a===`zh`?`en`:`zh`),window.location.reload()}),e.querySelector(`#pick`).addEventListener(`click`,()=>M.click()),e.querySelector(`#stage-pick`).addEventListener(`click`,()=>M.click()),M.addEventListener(`change`,()=>void W(M.files?.[0])),e.querySelector(`#export`).addEventListener(`click`,()=>{y=V(`export`)}),e.querySelector(`#zoom-out`).addEventListener(`click`,()=>N(E/1.25)),e.querySelector(`#zoom-in`).addEventListener(`click`,()=>N(E*1.25)),e.querySelector(`#zoom-fit`).addEventListener(`click`,P),k.addEventListener(`wheel`,e=>{if(!(e.ctrlKey||e.metaKey)||!g)return;e.preventDefault();let t=O.getBoundingClientRect(),n=(e.clientX-t.left)/E,r=(e.clientY-t.top)/E,i=k.getBoundingClientRect(),a=E*(e.deltaY<0?1.12:1/1.12);N(a);let o=O.getBoundingClientRect();k.scrollLeft+=o.left+n*E-e.clientX,k.scrollTop+=o.top+r*E-e.clientY,(e.clientX<i.left||e.clientY<i.top)&&P()},{passive:!1});let K=e.querySelector(`#stage`);K.addEventListener(`dragover`,e=>{e.preventDefault(),K.classList.add(`dragging`)}),K.addEventListener(`dragleave`,()=>K.classList.remove(`dragging`)),K.addEventListener(`drop`,e=>{e.preventDefault(),K.classList.remove(`dragging`),W(e.dataTransfer?.files[0])}),window.addEventListener(`paste`,e=>{let t=[...e.clipboardData?.items??[]].find(e=>e.type.startsWith(`image/`));t&&W(t.getAsFile()??void 0)}),B()}p(document.querySelector(`#app`));