<template>
  <div class="screenshot-tool">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <rect x="4" y="4" width="24" height="24" rx="4" fill="#667eea"/>
            <rect x="8" y="8" width="16" height="16" rx="2" fill="white" opacity="0.9"/>
            <circle cx="12" cy="12" r="2" fill="#667eea"/>
          </svg>
          <h1>Web截图工具</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="reset">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1L10 5H4L6 1M8 15L6 11H12L10 15M1 8L5 10V6L1 8M15 8L11 6V10L15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            重置
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Panel - URL Input -->
      <div class="left-panel">
        <div class="panel-section">
          <h2>网页截图</h2>
          <div class="input-group">
            <input
              v-model="url"
              type="url"
              placeholder="请输入网页URL（例如：http://localhost:40763/demo.html）"
              class="input-field"
              @keypress="handleKeyPress"
            />
            <button class="btn btn-primary" @click="captureScreenshot" :disabled="!url || isLoading">
              {{ isLoading ? '截图中...' : '开始截图' }}
            </button>
          </div>
          <div class="info-box">
            <strong>💡 使用提示：</strong>
            <ul>
              <li>由于浏览器同源策略限制，部分网站（如百度、Google等）无法直接截图</li>
              <li>您可以使用我们提供的示例页面进行测试：<code>http://localhost:40763/demo.html</code></li>
              <li>对于自己的网站，请确保配置了正确的CORS策略</li>
            </ul>
          </div>
        </div>

        <div class="panel-section">
          <h3>截图模式</h3>
          <div class="radio-group">
            <label class="radio-option">
              <input
                v-model="captureMode"
                type="radio"
                value="full"
              />
              <span class="radio-custom"></span>
              <span>整页截图</span>
            </label>
            <label class="radio-option">
              <input
                v-model="captureMode"
                type="radio"
                value="viewport"
              />
              <span class="radio-custom"></span>
              <span>可视区域</span>
            </label>
            <label class="radio-option">
              <input
                v-model="captureMode"
                type="radio"
                value="custom"
              />
              <span class="radio-custom"></span>
              <span>自定义区域</span>
            </label>
          </div>
        </div>

        <div class="panel-section">
          <h3>自定义区域形状</h3>
          <div class="shape-buttons">
            <button
              class="btn-shape"
              :class="{ active: customShape === 'rectangle' }"
              @click="customShape = 'rectangle'"
              title="矩形"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
            <button
              class="btn-shape"
              :class="{ active: customShape === 'circle' }"
              @click="customShape = 'circle'"
              title="圆形"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
            <button
              class="btn-shape"
              :class="{ active: customShape === 'free' }"
              @click="customShape = 'free'"
              title="自由形状"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M2 10C2 10 5 5 10 5C15 5 18 10 18 10C18 10 15 15 10 15C5 15 2 10 2 10Z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Center Panel - Preview -->
      <div class="center-panel">
        <div class="preview-container">
          <div class="preview-header">
            <h2>预览</h2>
            <div class="preview-actions">
              <button class="btn btn-success" @click="downloadImage" :disabled="!capturedImage">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 13L12 9M8 13L4 9M8 13V3M13 13H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                下载
              </button>
            </div>
          </div>
          <div class="preview-content">
            <div v-if="capturedImage" class="image-wrapper">
              <img ref="imageRef" :src="capturedImage" alt="截图预览" />
              <canvas
                ref="canvasRef"
                :width="canvasWidth"
                :height="canvasHeight"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart="handleTouchStart"
                @touchmove="handleTouchMove"
                @touchend="stopDrawing"
                class="annotation-canvas"
              />
            </div>
            <div v-else class="empty-state">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <rect x="10" y="10" width="60" height="60" rx="8" stroke="#94a3b8" stroke-width="2" fill="none"/>
                <circle cx="25" cy="25" r="4" fill="#94a3b8"/>
                <path d="M40 25L60 45L40 65" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>输入URL并点击开始截图</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Annotation Tools -->
      <div class="right-panel">
        <div class="panel-section">
          <h2>标注工具</h2>
          <div class="tool-grid">
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'arrow' }"
              @click="currentTool = 'arrow'"
              title="箭头"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'rectangle' }"
              @click="currentTool = 'rectangle'"
              title="矩形"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'circle' }"
              @click="currentTool = 'circle'"
              title="圆形"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'line' }"
              @click="currentTool = 'line'"
              title="直线"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'text' }"
              @click="currentTool = 'text'"
              title="文字"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M14 2H6A2 2 0 0 0 4 4v16A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8L14 2z" stroke="currentColor" stroke-width="2" fill="none"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
                <polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'mosaic' }"
              @click="currentTool = 'mosaic'"
              title="马赛克"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="3" y="3" width="5" height="5" fill="currentColor" opacity="0.3"/>
                <rect x="10" y="3" width="5" height="5" fill="currentColor" opacity="0.5"/>
                <rect x="17" y="3" width="4" height="5" fill="currentColor" opacity="0.7"/>
                <rect x="3" y="10" width="5" height="5" fill="currentColor" opacity="0.5"/>
                <rect x="10" y="10" width="5" height="5" fill="currentColor" opacity="0.7"/>
                <rect x="17" y="10" width="4" height="5" fill="currentColor" opacity="0.3"/>
                <rect x="3" y="17" width="5" height="4" fill="currentColor" opacity="0.7"/>
                <rect x="10" y="17" width="5" height="4" fill="currentColor" opacity="0.3"/>
                <rect x="17" y="17" width="4" height="4" fill="currentColor" opacity="0.5"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'blur' }"
              @click="currentTool = 'blur'"
              title="模糊"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              @click="undoAnnotation"
              title="撤销"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="tool-btn"
              @click="clearAnnotations"
              title="清除所有"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h3>颜色</h3>
          <div class="color-picker">
            <div
              v-for="color in colors"
              :key="color"
              class="color-option"
              :style="{ backgroundColor: color }"
              :class="{ active: currentColor === color }"
              @click="currentColor = color"
            ></div>
            <input
              v-model="currentColor"
              type="color"
              class="color-input"
            />
          </div>
        </div>

        <div class="panel-section">
          <h3>线宽</h3>
          <div class="slider-group">
            <input
              v-model.number="lineWidth"
              type="range"
              min="1"
              max="20"
              class="slider"
            />
            <span class="slider-value">{{ lineWidth }}px</span>
          </div>
        </div>

        <div v-if="currentTool === 'text'" class="panel-section">
          <h3>文字设置</h3>
          <div class="input-group">
            <select v-model="fontFamily" class="input-field">
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
          <div class="slider-group">
            <label>字体大小</label>
            <input
              v-model.number="fontSize"
              type="range"
              min="12"
              max="72"
              class="slider"
            />
            <span class="slider-value">{{ fontSize }}px</span>
          </div>
          <div class="input-group">
            <input
              v-model="textContent"
              type="text"
              placeholder="输入文字..."
              class="input-field"
            />
          </div>
        </div>

        <div v-if="currentTool === 'mosaic' || currentTool === 'blur'" class="panel-section">
          <h3>强度</h3>
          <div class="slider-group">
            <input
              v-model.number="effectIntensity"
              type="range"
              min="1"
              max="100"
              class="slider"
            />
            <span class="slider-value">{{ effectIntensity }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import domtoimage from 'dom-to-image'

export default {
  name: 'App',
  setup() {
    const url = ref('')
    const captureMode = ref('full')
    const customShape = ref('rectangle')
    const capturedImage = ref(null)
    const isLoading = ref(false)
    const currentTool = ref('arrow')
    const currentColor = ref('#ff4444')
    const lineWidth = ref(3)
    const fontSize = ref(24)
    const fontFamily = ref('Arial')
    const textContent = ref('')
    const effectIntensity = ref(50)
    const canvasWidth = ref(0)
    const canvasHeight = ref(0)
    const isDrawing = ref(false)
    const startX = ref(0)
    const startY = ref(0)
    const annotations = ref([])
    const tempAnnotation = ref(null)
    const imageRef = ref(null)
    const canvasRef = ref(null)

    const colors = [
      '#ff4444', '#ff9900', '#ffcc00', '#44cc00',
      '#44aaff', '#9944ff', '#cc00cc', '#000000',
      '#ffffff', '#666666', '#999999', '#cccccc'
    ]

    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        captureScreenshot()
      }
    }

    const captureScreenshot = async () => {
      if (!url.value) return

      // 自动添加协议头
      let targetUrl = url.value.trim()
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl
      }

      isLoading.value = true
      try {
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.top = '-9999px'
        iframe.style.left = '-9999px'
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)

        await new Promise((resolve, reject) => {
          iframe.onload = resolve
          iframe.onerror = reject
          iframe.src = targetUrl
        })

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        const iframeBody = iframeDoc.body

        let screenshot
        if (captureMode.value === 'full') {
          screenshot = await html2canvas(iframeBody, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
            width: iframeBody.scrollWidth,
            height: iframeBody.scrollHeight
          })
        } else if (captureMode.value === 'viewport') {
          screenshot = await html2canvas(iframeBody, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
            width: iframeBody.clientWidth,
            height: iframeBody.clientHeight
          })
        } else {
          screenshot = await html2canvas(iframeBody, {
            allowTaint: true,
            useCORS: true,
            scale: 2
          })
        }

        capturedImage.value = screenshot.toDataURL('image/png')
        annotations.value = []

        document.body.removeChild(iframe)
        
        // 初始化画布
        setTimeout(() => {
          initCanvas()
        }, 100)
      } catch (error) {
        console.error('截图失败:', error)
        document.body.removeChild(iframe)
        
        let errorMessage = '截图失败，请检查以下问题：\n\n'
        errorMessage += '1. URL是否正确（请包含http://或https://）\n'
        errorMessage += '2. 该网站是否允许被嵌入iframe（部分网站如百度、Google有跨域限制）\n'
        errorMessage += '3. 建议先使用我们的示例页面测试：http://localhost:40763/demo.html\n\n'
        errorMessage += '详细错误：' + error.message
        
        alert(errorMessage)
      } finally {
        isLoading.value = false
      }
    }

    const initCanvas = async () => {
      if (!imageRef.value || !canvasRef.value) return

      await nextTick()
      canvasWidth.value = imageRef.value.naturalWidth
      canvasHeight.value = imageRef.value.naturalHeight

      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    }

    const startDrawing = (event) => {
      if (!canvasRef.value) return

      isDrawing.value = true
      const rect = canvasRef.value.getBoundingClientRect()
      const scaleX = canvasWidth.value / rect.width
      const scaleY = canvasHeight.value / rect.height

      startX.value = (event.clientX - rect.left) * scaleX
      startY.value = (event.clientY - rect.top) * scaleY

      tempAnnotation.value = {
        type: currentTool.value,
        x: startX.value,
        y: startY.value,
        color: currentColor.value,
        lineWidth: lineWidth.value,
        fontSize: fontSize.value,
        fontFamily: fontFamily.value,
        text: textContent.value,
        intensity: effectIntensity.value
      }
    }

    const draw = (event) => {
      if (!isDrawing.value || !canvasRef.value || !tempAnnotation.value) return

      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvasWidth.value / rect.width
      const scaleY = canvasHeight.value / rect.height

      const currentX = (event.clientX - rect.left) * scaleX
      const currentY = (event.clientY - rect.top) * scaleY

      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
      redrawAnnotations()

      ctx.strokeStyle = currentColor.value
      ctx.fillStyle = currentColor.value
      ctx.lineWidth = lineWidth.value
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      switch (currentTool.value) {
        case 'arrow':
          drawArrow(ctx, startX.value, startY.value, currentX, currentY)
          break
        case 'rectangle':
          ctx.strokeRect(
            Math.min(startX.value, currentX),
            Math.min(startY.value, currentY),
            Math.abs(currentX - startX.value),
            Math.abs(currentY - startY.value)
          )
          break
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(currentX - startX.value, 2) + Math.pow(currentY - startY.value, 2)
          )
          ctx.beginPath()
          ctx.arc(startX.value, startY.value, radius, 0, Math.PI * 2)
          ctx.stroke()
          break
        case 'line':
          ctx.beginPath()
          ctx.moveTo(startX.value, startY.value)
          ctx.lineTo(currentX, currentY)
          ctx.stroke()
          break
        case 'text':
          ctx.font = `${fontSize.value}px ${fontFamily.value}`
          ctx.fillText(textContent.value || '双击输入文字', currentX, currentY)
          break
        case 'mosaic':
          drawMosaic(ctx, startX.value, startY.value, currentX, currentY)
          break
        case 'blur':
          drawBlur(ctx, startX.value, startY.value, currentX, currentY)
          break
      }

      tempAnnotation.value.endX = currentX
      tempAnnotation.value.endY = currentY
    }

    const stopDrawing = () => {
      if (!isDrawing.value || !tempAnnotation.value) return

      isDrawing.value = false
      annotations.value.push({ ...tempAnnotation.value })
      tempAnnotation.value = null
      redrawAnnotations()
    }

    const drawArrow = (ctx, fromX, fromY, toX, toY) => {
      const headlen = 15
      const angle = Math.atan2(toY - fromY, toX - fromX)

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(
        toX - headlen * Math.cos(angle - Math.PI / 6),
        toY - headlen * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        toX - headlen * Math.cos(angle + Math.PI / 6),
        toY - headlen * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fill()
    }

    const drawMosaic = (ctx, x1, y1, x2, y2) => {
      const img = imageRef.value
      if (!img) return

      const startX = Math.min(x1, x2)
      const startY = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)

      const blockSize = 10
      const cols = Math.ceil(width / blockSize)
      const rows = Math.ceil(height / blockSize)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const blockX = startX + i * blockSize
          const blockY = startY + j * blockSize
          const blockWidth = Math.min(blockSize, startX + width - blockX)
          const blockHeight = Math.min(blockSize, startY + height - blockY)

          const imageData = ctx.getImageData(blockX, blockY, blockWidth, blockHeight)
          const data = imageData.data
          let r = 0, g = 0, b = 0, count = 0

          for (let k = 0; k < data.length; k += 4) {
            r += data[k]
            g += data[k + 1]
            b += data[k + 2]
            count++
          }

          if (count > 0) {
            r = Math.floor(r / count)
            g = Math.floor(g / count)
            b = Math.floor(b / count)

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            ctx.fillRect(blockX, blockY, blockWidth, blockHeight)
          }
        }
      }
    }

    const drawBlur = (ctx, x1, y1, x2, y2) => {
      const img = imageRef.value
      if (!img) return

      const startX = Math.min(x1, x2)
      const startY = Math.min(y1, y2)
      const width = Math.abs(x2 - x1)
      const height = Math.abs(y2 - y1)

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')

      tempCtx.drawImage(img, startX, startY, width, height, 0, 0, width, height)

      const imageData = tempCtx.getImageData(0, 0, width, height)
      const blurredData = applyBlur(imageData, effectIntensity.value / 10)
      tempCtx.putImageData(blurredData, 0, 0)

      ctx.drawImage(tempCanvas, startX, startY)
    }

    const applyBlur = (imageData, radius) => {
      const data = imageData.data
      const width = imageData.width
      const height = imageData.height
      const tempData = new Uint8ClampedArray(data)

      const kernelSize = Math.floor(radius) * 2 + 1
      const kernel = []
      let kernelSum = 0

      for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
          const dx = i - Math.floor(kernelSize / 2)
          const dy = j - Math.floor(kernelSize / 2)
          const value = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))
          kernel.push(value)
          kernelSum += value
        }
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, a = 0

          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const px = Math.max(0, Math.min(width - 1, x + kx - Math.floor(kernelSize / 2)))
              const py = Math.max(0, Math.min(height - 1, y + ky - Math.floor(kernelSize / 2)))
              const index = (py * width + px) * 4
              const weight = kernel[ky * kernelSize + kx] / kernelSum

              r += tempData[index] * weight
              g += tempData[index + 1] * weight
              b += tempData[index + 2] * weight
              a += tempData[index + 3] * weight
            }
          }

          const index = (y * width + x) * 4
          data[index] = r
          data[index + 1] = g
          data[index + 2] = b
          data[index + 3] = a
        }
      }

      return imageData
    }

    const redrawAnnotations = () => {
      if (!canvasRef.value) return

      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

      annotations.value.forEach(annotation => {
        ctx.strokeStyle = annotation.color
        ctx.fillStyle = annotation.color
        ctx.lineWidth = annotation.lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        switch (annotation.type) {
          case 'arrow':
            drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY)
            break
          case 'rectangle':
            ctx.strokeRect(
              Math.min(annotation.x, annotation.endX),
              Math.min(annotation.y, annotation.endY),
              Math.abs(annotation.endX - annotation.x),
              Math.abs(annotation.endY - annotation.y)
            )
            break
          case 'circle':
            const radius = Math.sqrt(
              Math.pow(annotation.endX - annotation.x, 2) + Math.pow(annotation.endY - annotation.y, 2)
            )
            ctx.beginPath()
            ctx.arc(annotation.x, annotation.y, radius, 0, Math.PI * 2)
            ctx.stroke()
            break
          case 'line':
            ctx.beginPath()
            ctx.moveTo(annotation.x, annotation.y)
            ctx.lineTo(annotation.endX, annotation.endY)
            ctx.stroke()
            break
          case 'text':
            ctx.font = `${annotation.fontSize}px ${annotation.fontFamily}`
            ctx.fillText(annotation.text || '文字', annotation.endX, annotation.endY)
            break
        }
      })
    }

    const undoAnnotation = () => {
      if (annotations.value.length > 0) {
        annotations.value.pop()
        redrawAnnotations()
      }
    }

    const clearAnnotations = () => {
      if (confirm('确定要清除所有标注吗？')) {
        annotations.value = []
        redrawAnnotations()
      }
    }

    const downloadImage = () => {
      if (!capturedImage.value || !canvasRef.value) return

      const canvas = canvasRef.value
      const img = new Image()
      img.src = capturedImage.value

      img.onload = () => {
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = canvasWidth.value
        finalCanvas.height = canvasHeight.value
        const ctx = finalCanvas.getContext('2d')

        ctx.drawImage(img, 0, 0)
        ctx.drawImage(canvas, 0, 0)

        const link = document.createElement('a')
        link.download = `screenshot-${Date.now()}.png`
        link.href = finalCanvas.toDataURL('image/png')
        link.click()
      }
    }

    const reset = () => {
      url.value = ''
      capturedImage.value = null
      annotations.value = []
      currentTool.value = 'arrow'
      canvasWidth.value = 0
      canvasHeight.value = 0
    }

    const handleTouchStart = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvasRef.value.dispatchEvent(mouseEvent)
    }

    const handleTouchMove = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvasRef.value.dispatchEvent(mouseEvent)
    }

    onMounted(() => {
      if (capturedImage.value) {
        initCanvas()
      }
    })

    return {
      url,
      captureMode,
      customShape,
      capturedImage,
      isLoading,
      currentTool,
      currentColor,
      lineWidth,
      fontSize,
      fontFamily,
      textContent,
      effectIntensity,
      canvasWidth,
      canvasHeight,
      colors,
      imageRef,
      canvasRef,
      handleKeyPress,
      captureScreenshot,
      initCanvas,
      startDrawing,
      draw,
      stopDrawing,
      undoAnnotation,
      clearAnnotations,
      downloadImage,
      reset,
      handleTouchStart,
      handleTouchMove
    }
  }
}
</script>

<style scoped>
.screenshot-tool {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  box-shadow: var(--shadow-md);
}

.header-content {
  max-width: 1920px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.left-panel,
.right-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

.center-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-section {
  margin-bottom: 1.5rem;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.panel-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: var(--bg-primary);
}

.input-field:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.info-box {
  background: rgba(251, 191, 36, 0.1);
  border-left: 4px solid var(--warning-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.info-box strong {
  color: var(--warning-color);
  display: block;
  margin-bottom: 0.5rem;
}

.info-box ul {
  list-style: none;
  padding-left: 0;
}

.info-box li {
  padding-left: 1.25rem;
  position: relative;
  margin-bottom: 0.25rem;
}

.info-box li::before {
  content: '•';
  color: var(--warning-color);
  font-weight: bold;
  position: absolute;
  left: 0.5rem;
}

.info-box code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover {
  background: #22c55e;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.radio-option:hover {
  background: var(--bg-tertiary);
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-option input[type="radio"]:checked + .radio-custom {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
}

.shape-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-shape {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-shape:hover {
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}

.btn-shape.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-content {
  flex: 1;
  overflow: auto;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.image-wrapper img {
  display: block;
  max-width: 100%;
  height: auto;
  cursor: crosshair;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  touch-action: none;
}

.empty-state {
  text-align: center;
  color: var(--text-light);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tool-btn {
  width: 100%;
  height: 56px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}

.tool-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.color-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--text-primary);
  box-shadow: var(--shadow-md);
}

.color-input {
  width: 100%;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-input:hover {
  border-color: var(--primary-color);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-group label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.slider-value {
  min-width: 40px;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .left-panel,
  .right-panel {
    max-height: none;
  }

  .header {
    padding: 1rem;
  }

  .logo h1 {
    font-size: 1.25rem;
  }
}
</style>