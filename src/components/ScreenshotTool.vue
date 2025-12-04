<template>
  <div class="screenshot-tool">
    <!-- 网址输入区域 -->
    <div class="url-input-section">
      <input 
        v-model="url" 
        type="text" 
        class="url-input" 
        placeholder="请输入要截图的网页URL（如：https://www.example.com）"
      />
      <button class="load-btn" @click="loadUrl" :disabled="!url.trim()">
        加载网页
      </button>
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h1>📸 Web网页截图工具</h1>
      <div class="tool-buttons">
        <button class="tool-btn" @click="captureVisible" title="截取当前可见区域">
          <span class="tooltip">可视区域截图</span>
        </button>
        <button class="tool-btn" @click="captureFullPage" title="截取整个网页内容">
          <span class="tooltip">整页截图</span>
        </button>
        <button class="tool-btn" @click="startCustomCapture" title="拖动鼠标选择区域">
          <span class="tooltip">自定义区域截图</span>
        </button>
        <button class="tool-btn" @click="openEditor" title="对图片进行标注编辑">
          <span class="tooltip">标注编辑</span>
        </button>
        <button class="tool-btn" @click="downloadImage" title="保存为PNG图片">
          <span class="tooltip">下载图片</span>
        </button>
        <button class="tool-btn" @click="clearCanvas" title="清除所有内容">
          <span class="tooltip">清空画布</span>
        </button>
      </div>
    </div>

    <!-- 状态提示 -->
    <div v-if="statusMessage" class="status-bar">{{ statusMessage }}</div>

    <!-- 网页加载区域 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在加载网页...</p>
    </div>

    <!-- 网页预览区域 -->
    <div v-if="iframeUrl" class="iframe-container">
      <iframe 
        ref="iframeRef" 
        :src="iframeUrl" 
        class="preview-iframe"
        @load="iframeLoaded"
      ></iframe>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container">
      <canvas ref="canvasRef" id="screenshotCanvas"></canvas>
    </div>

    <!-- 自定义区域选择遮罩 -->
    <div v-if="isCustomCapturing" class="capture-overlay">
      <div class="capture-area" ref="captureAreaRef" @mousedown="startDrawing" @mousemove="drawArea" @mouseup="stopDrawing"></div>
    </div>

    <!-- 标注工具栏 -->
    <div v-if="isEditing" class="editor-toolbar">
      <div class="editor-tools">
        <button class="editor-btn" :class="{ active: currentTool === 'arrow' }" @click="selectTool('arrow')" title="绘制箭头">
          <span class="tooltip">箭头</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'rectangle' }" @click="selectTool('rectangle')" title="绘制矩形">
          <span class="tooltip">矩形</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'circle' }" @click="selectTool('circle')" title="绘制圆形">
          <span class="tooltip">圆形</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'line' }" @click="selectTool('line')" title="绘制直线">
          <span class="tooltip">直线</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'text' }" @click="selectTool('text')" title="添加文字">
          <span class="tooltip">文字</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'mosaic' }" @click="selectTool('mosaic')" title="隐私保护">
          <span class="tooltip">马赛克</span>
        </button>
        <button class="editor-btn" :class="{ active: currentTool === 'blur' }" @click="selectTool('blur')" title="模糊处理">
          <span class="tooltip">模糊</span>
        </button>
        <input type="color" v-model="currentColor" class="color-picker" title="选择颜色" />
        <input type="range" v-model="currentSize" min="1" max="50" class="size-slider" title="调整大小" />
        <span class="tool-info">当前工具: {{ currentToolName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'
import { fabric } from 'fabric'

const canvasRef = ref(null)
const captureAreaRef = ref(null)
const iframeRef = ref(null)
const isCustomCapturing = ref(false)
const isEditing = ref(false)
const currentColor = ref('#ff0000')
const currentSize = ref(5)
const currentTool = ref('arrow')
const statusMessage = ref('')
const currentToolName = ref('箭头')
const url = ref('')
const iframeUrl = ref('')
const isLoading = ref(false)
const targetUrl = ref('')
let canvas = null
let fabricCanvas = null
let startX = 0
let startY = 0
let isDrawing = false
let captureArea = null
let currentDrawing = null

// 初始化画布
onMounted(() => {
  canvas = canvasRef.value
  if (canvas) {
    canvas.width = window.innerWidth - 400
    canvas.height = window.innerHeight - 150
  }
})

// 显示状态消息
const showStatus = (message, duration = 3000) => {
  statusMessage.value = message
  setTimeout(() => {
    statusMessage.value = ''
  }, duration)
}

// 加载网页
const loadUrl = () => {
  if (!url.value.trim()) {
    showStatus('请输入有效的URL', 3000)
    return
  }
  
  // 验证URL格式
  try {
    let urlStr = url.value.trim()
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = 'https://' + urlStr
    }
    
    const urlObj = new URL(urlStr)
    iframeUrl.value = urlObj.href
    isLoading.value = true
    showStatus('正在加载网页...')
  } catch (error) {
    showStatus('URL格式不正确', 3000)
  }
}

// iframe加载完成
const iframeLoaded = () => {
  isLoading.value = false
  showStatus('网页加载完成，可以开始截图了', 3000)
}

// 可视区域截图
const captureVisible = async () => {
  showStatus('正在截取可视区域...')
  try {
    const targetElement = iframeRef.value ? iframeRef.value.contentDocument.body : document.body
    const screenshot = await html2canvas(targetElement, {
      scale: window.devicePixelRatio,
      logging: false
    })
    displayImage(screenshot)
    showStatus('可视区域截图完成!')
  } catch (error) {
    console.error('截图失败:', error)
    showStatus('截图失败，请重试', 5000)
  }
}

// 整页截图
const captureFullPage = async () => {
  showStatus('正在截取整页内容...')
  try {
    const targetElement = iframeRef.value ? iframeRef.value.contentDocument.body : document.body
    
    const screenshot = await html2canvas(targetElement, {
      scale: window.devicePixelRatio,
      logging: false,
      useCORS: true,
      allowTaint: true
    })
    
    displayImage(screenshot)
    showStatus('整页截图完成!')
  } catch (error) {
    console.error('整页截图失败:', error)
    showStatus('整页截图失败，请重试', 5000)
  }
}

// 开始自定义区域截图
const startCustomCapture = () => {
  isCustomCapturing.value = true
  showStatus('拖动鼠标选择区域，点击任意位置取消')
  setTimeout(() => {
    captureArea = captureAreaRef.value
  }, 0)
}

// 停止自定义区域截图
const stopCustomCapture = () => {
  isCustomCapturing.value = false
  statusMessage.value = ''
}

// 开始绘制选择区域
const startDrawing = (e) => {
  e.preventDefault()
  e.stopPropagation()
  isDrawing = true
  startX = e.clientX
  startY = e.clientY
  captureArea.style.left = startX + 'px'
  captureArea.style.top = startY + 'px'
  captureArea.style.width = '0px'
  captureArea.style.height = '0px'
  captureArea.style.display = 'block'
}

// 绘制选择区域
const drawArea = (e) => {
  e.preventDefault()
  e.stopPropagation()
  if (!isDrawing) return
  const currentX = e.clientX
  const currentY = e.clientY
  const width = Math.abs(currentX - startX)
  const height = Math.abs(currentY - startY)
  const left = Math.min(startX, currentX)
  const top = Math.min(startY, currentY)
  captureArea.style.left = left + 'px'
  captureArea.style.top = top + 'px'
  captureArea.style.width = width + 'px'
  captureArea.style.height = height + 'px'
}

// 停止绘制并截图
const stopDrawing = async () => {
  if (!isDrawing) return
  isDrawing = false
  
  const rect = captureArea.getBoundingClientRect()
  
  try {
    const targetElement = iframeRef.value ? iframeRef.value.contentDocument.body : document.body
    const screenshot = await html2canvas(targetElement, {
      scale: window.devicePixelRatio,
      logging: false,
      useCORS: true,
      allowTaint: true,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    })
    
    displayImage(screenshot)
    stopCustomCapture()
    showStatus('自定义区域截图完成!')
  } catch (error) {
    console.error('自定义截图失败:', error)
    showStatus('自定义截图失败，请重试', 5000)
    stopCustomCapture()
  }
}

// 在画布上显示图片
const displayImage = (image) => {
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const maxWidth = window.innerWidth - 400
  const maxHeight = window.innerHeight - 150
  
  let width = image.width
  let height = image.height
  
  if (width > maxWidth) {
    height = (maxWidth / width) * height
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (maxHeight / height) * width
    height = maxHeight
  }
  
  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)
}

// 打开标注编辑器
const openEditor = () => {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    showStatus('请先截取一张图片', 3000)
    return
  }
  
  isEditing.value = true
  showStatus('进入标注编辑模式')
  
  // 创建fabric画布并保留原有内容
  if (fabricCanvas) {
    fabricCanvas.dispose()
  }
  
  fabricCanvas = new fabric.Canvas('screenshotCanvas', {
    width: canvas.width,
    height: canvas.height
  })
  
  // 将当前画布内容转换为fabric对象
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const fabricImage = new fabric.Image(imageData)
  fabricCanvas.add(fabricImage)
  fabricCanvas.renderAll()
}

// 选择标注工具
const selectTool = (tool) => {
  currentTool.value = tool
  const toolNames = {
    'arrow': '箭头',
    'rectangle': '矩形',
    'circle': '圆形',
    'line': '直线',
    'text': '文字',
    'mosaic': '马赛克',
    'blur': '模糊'
  }
  currentToolName.value = toolNames[tool] || tool
  
  if (!fabricCanvas) return
  
  // 根据选择的工具设置fabric画布的事件
  fabricCanvas.off('mouse:down')
  fabricCanvas.off('mouse:move')
  fabricCanvas.off('mouse:up')
  fabricCanvas.off('object:added')
  
  switch (tool) {
    case 'arrow':
      setupArrowTool()
      break
    case 'rectangle':
      setupRectangleTool()
      break
    case 'circle':
      setupCircleTool()
      break
    case 'line':
      setupLineTool()
      break
    case 'text':
      setupTextTool()
      break
    case 'mosaic':
      setupMosaicTool()
      break
    case 'blur':
      setupBlurTool()
      break
  }
}

// 设置箭头工具
const setupArrowTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = false
  let isDrawing = false
  let startPoint = null
  let tempObjects = []
  
  fabricCanvas.on('mouse:down', (options) => {
    isDrawing = true
    startPoint = fabricCanvas.getPointer(options.e)
    tempObjects = []
  })
  
  fabricCanvas.on('mouse:move', (options) => {
    if (!isDrawing || !startPoint) return
    
    // 清除临时对象
    tempObjects.forEach(obj => fabricCanvas.remove(obj))
    tempObjects = []
    
    const pointer = fabricCanvas.getPointer(options.e)
    
    // 绘制箭头线
    const arrowLine = new fabric.Line(
      [startPoint.x, startPoint.y, pointer.x, pointer.y],
      {
        stroke: currentColor.value,
        strokeWidth: currentSize.value,
        selectable: false
      }
    )
    fabricCanvas.add(arrowLine)
    tempObjects.push(arrowLine)
    
    // 添加箭头头部
    const angle = Math.atan2(pointer.y - startPoint.y, pointer.x - startPoint.x)
    const arrowHead = new fabric.Triangle({
      left: pointer.x,
      top: pointer.y,
      width: currentSize.value * 3,
      height: currentSize.value * 3,
      fill: currentColor.value,
      angle: angle * 180 / Math.PI,
      originX: 'center',
      originY: 'center',
      selectable: false
    })
    fabricCanvas.add(arrowHead)
    tempObjects.push(arrowHead)
  })
  
  fabricCanvas.on('mouse:up', () => {
    if (!isDrawing) return
    
    isDrawing = false
    startPoint = null
    
    // 使箭头对象可选择
    tempObjects.forEach(obj => {
      obj.selectable = true
    })
    tempObjects = []
  })
}

// 设置矩形工具
const setupRectangleTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = false
  let isDrawing = false
  let startPoint = null
  let tempRect = null
  
  fabricCanvas.on('mouse:down', (options) => {
    isDrawing = true
    startPoint = fabricCanvas.getPointer(options.e)
  })
  
  fabricCanvas.on('mouse:move', (options) => {
    if (!isDrawing || !startPoint) return
    
    const pointer = fabricCanvas.getPointer(options.e)
    
    // 清除临时矩形
    if (tempRect) {
      fabricCanvas.remove(tempRect)
    }
    
    // 绘制临时矩形
    tempRect = new fabric.Rect({
      left: Math.min(startPoint.x, pointer.x),
      top: Math.min(startPoint.y, pointer.y),
      width: Math.abs(pointer.x - startPoint.x),
      height: Math.abs(pointer.y - startPoint.y),
      fill: 'transparent',
      stroke: currentColor.value,
      strokeWidth: currentSize.value,
      selectable: false
    })
    fabricCanvas.add(tempRect)
  })
  
  fabricCanvas.on('mouse:up', () => {
    if (!isDrawing) return
    
    isDrawing = false
    startPoint = null
    
    // 使矩形可选择
    if (tempRect) {
      tempRect.selectable = true
      tempRect = null
    }
  })
}

// 设置圆形工具
const setupCircleTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = false
  let isDrawing = false
  let startPoint = null
  let tempCircle = null
  
  fabricCanvas.on('mouse:down', (options) => {
    isDrawing = true
    startPoint = fabricCanvas.getPointer(options.e)
  })
  
  fabricCanvas.on('mouse:move', (options) => {
    if (!isDrawing || !startPoint) return
    
    const pointer = fabricCanvas.getPointer(options.e)
    
    // 清除临时圆形
    if (tempCircle) {
      fabricCanvas.remove(tempCircle)
    }
    
    // 绘制临时圆形
    const radius = Math.sqrt(
      Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)
    )
    
    tempCircle = new fabric.Circle({
      left: startPoint.x,
      top: startPoint.y,
      radius: radius,
      fill: 'transparent',
      stroke: currentColor.value,
      strokeWidth: currentSize.value,
      originX: 'center',
      originY: 'center',
      selectable: false
    })
    fabricCanvas.add(tempCircle)
  })
  
  fabricCanvas.on('mouse:up', () => {
    if (!isDrawing) return
    
    isDrawing = false
    startPoint = null
    
    // 使圆形可选择
    if (tempCircle) {
      tempCircle.selectable = true
      tempCircle = null
    }
  })
}

// 设置直线工具
const setupLineTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = false
  let isDrawing = false
  let startPoint = null
  let tempLine = null
  
  fabricCanvas.on('mouse:down', (options) => {
    isDrawing = true
    startPoint = fabricCanvas.getPointer(options.e)
  })
  
  fabricCanvas.on('mouse:move', (options) => {
    if (!isDrawing || !startPoint) return
    
    const pointer = fabricCanvas.getPointer(options.e)
    
    // 清除临时直线
    if (tempLine) {
      fabricCanvas.remove(tempLine)
    }
    
    // 绘制临时直线
    tempLine = new fabric.Line(
      [startPoint.x, startPoint.y, pointer.x, pointer.y],
      {
        stroke: currentColor.value,
        strokeWidth: currentSize.value,
        selectable: false
      }
    )
    fabricCanvas.add(tempLine)
  })
  
  fabricCanvas.on('mouse:up', () => {
    if (!isDrawing) return
    
    isDrawing = false
    startPoint = null
    
    // 使直线可选择
    if (tempLine) {
      tempLine.selectable = true
      tempLine = null
    }
  })
}

// 设置文字工具
const setupTextTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = false
  
  fabricCanvas.on('mouse:down', (options) => {
    const pointer = fabricCanvas.getPointer(options.e)
    const text = new fabric.IText('双击编辑文字', {
      left: pointer.x,
      top: pointer.y,
      fontSize: currentSize.value * 2,
      fill: currentColor.value,
      fontFamily: 'Arial'
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
  })
}

// 设置马赛克工具
const setupMosaicTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = true
  fabricCanvas.freeDrawingBrush.color = '#000000'
  fabricCanvas.freeDrawingBrush.width = currentSize.value * 10
  fabricCanvas.freeDrawingBrush.opacity = 0.8
}

// 设置模糊工具
const setupBlurTool = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.isDrawingMode = true
  fabricCanvas.freeDrawingBrush.color = '#ffffff'
  fabricCanvas.freeDrawingBrush.width = currentSize.value * 10
  fabricCanvas.freeDrawingBrush.opacity = 0.3
}

// 下载图片
const downloadImage = () => {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    showStatus('没有可下载的图片', 3000)
    return
  }
  
  const link = document.createElement('a')
  link.download = `screenshot_${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  showStatus('图片下载成功!')
}

// 清空画布
const clearCanvas = () => {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  canvas.width = window.innerWidth - 400
  canvas.height = window.innerHeight - 150
  isEditing.value = false
  showStatus('画布已清空')
}
</script>

<style scoped>
.screenshot-tool {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.url-input-section {
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 10px;
  align-items: center;
}

.url-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.url-input:focus {
  border-color: #667eea;
}

.load-btn {
  padding: 10px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.load-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.toolbar h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.url-input-section {
  display: flex;
  gap: 10px;
  flex: 1;
  max-width: 500px;
}

.url-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #667eea;
  border-radius: 5px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.url-input:focus {
  border-color: #764ba2;
}

.url-btn {
  padding: 10px 25px;
}

.tool-buttons {
  display: flex;
  gap: 10px;
}

.tool-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto;
}

#screenshotCanvas {
  border: 2px dashed #ccc;
  border-radius: 10px;
  background: white;
  max-width: 100%;
  max-height: 100%;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.webpage-iframe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  z-index: 1500;
}

.capture-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  cursor: crosshair;
}

.iframe-container {
  flex: 1;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.capture-area {
  position: absolute;
  border: 2px solid #ff0000;
  background: rgba(255, 0, 0, 0.1);
  display: none;
  z-index: 1001;
}

.editor-toolbar {
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #eee;
}

.editor-tools {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.editor-btn {
  padding: 8px 15px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.editor-btn:hover {
  background: #764ba2;
}

.color-picker {
  width: 50px;
  height: 35px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.size-slider {
  width: 100px;
  cursor: pointer;
}

.status-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 20px;
  text-align: center;
  font-size: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-btn.active {
  background: #764ba2;
  transform: scale(1.05);
}

.tool-info {
  margin-left: 20px;
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>