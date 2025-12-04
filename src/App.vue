<template>
  <div class="screenshot-tool">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h1>📸 Web网页截图工具</h1>
      <div class="url-input-section">
        <input
          v-model="targetUrl"
          type="text"
          placeholder="输入要截图的网页URL（如：https://example.com）"
          class="url-input"
        />
        <button @click="openTargetUrl" class="btn btn-primary" :disabled="!targetUrl.trim()">
          <span>🔗</span> 打开网页
        </button>
      </div>
      <div class="tool-buttons">
        <button @click="captureFullPage" class="btn btn-primary">
          <span>📄</span> 整页截图
        </button>
        <button @click="captureViewport" class="btn btn-primary">
          <span>🖥️</span> 可视区域
        </button>
        <button @click="startCustomCapture" class="btn btn-primary">
          <span>✂️</span> 自定义区域
        </button>
        <button @click="clearScreenshot" class="btn btn-secondary" :disabled="!hasScreenshot">
          <span>🗑️</span> 清除
        </button>
        <button @click="downloadImage" class="btn btn-success" :disabled="!hasScreenshot">
          <span>💾</span> 下载
        </button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 网页显示区域 -->
      <div class="webpage-section" v-if="currentUrl">
        <div class="webpage-header">
          <span>🌐 当前网页: {{ currentUrl }}</span>
          <button @click="closeWebpage" class="btn btn-secondary btn-small">
            <span>✕</span> 关闭
          </button>
        </div>
        <iframe
          ref="webpageIframe"
          :src="currentUrl"
          class="webpage-iframe"
          @load="onWebpageLoaded"
        ></iframe>
      </div>

      <!-- 截图预览和编辑区域 -->
      <div class="preview-section" v-if="hasScreenshot">
        <div class="preview-container">
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            class="screenshot-canvas"
          ></canvas>
        </div>

        <!-- 标注工具栏 -->
        <div class="annotation-toolbar">
          <h3>✏️ 标注工具</h3>
          <div class="tool-group">
            <label>选择工具：</label>
            <select v-model="currentTool" @change="changeTool" class="tool-select">
              <option value="arrow">⬆️ 箭头</option>
              <option value="rectangle">▭ 矩形</option>
              <option value="circle">● 圆形</option>
              <option value="line">➖ 直线</option>
              <option value="text">📝 文字</option>
              <option value="mosaic">🔲 马赛克</option>
              <option value="blur">🔍 模糊</option>
            </select>
          </div>
          
          <div class="tool-group">
            <label>线条颜色：</label>
            <input
              type="color"
              v-model="strokeColor"
              @change="updateStyle"
              class="color-picker"
            />
          </div>
          
          <div class="tool-group">
            <label>填充颜色：</label>
            <input
              type="color"
              v-model="fillColor"
              @change="updateStyle"
              class="color-picker"
            />
          </div>
          
          <div class="tool-group">
            <label>线条宽度：</label>
            <input
              type="range"
              v-model.number="lineWidth"
              @change="updateStyle"
              min="1"
              max="10"
              class="slider"
            />
            <span class="value-display">{{ lineWidth }}px</span>
          </div>
          
          <div class="tool-group" v-if="currentTool === 'text'">
            <label>字体大小：</label>
            <input
              type="range"
              v-model.number="fontSize"
              @change="updateStyle"
              min="12"
              max="48"
              class="slider"
            />
            <span class="value-display">{{ fontSize }}px</span>
          </div>
          
          <div class="tool-group">
            <button @click="clearAnnotations" class="btn btn-warning">
              <span>🧹</span> 清除标注
            </button>
          </div>
        </div>
      </div>

        <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">📸</div>
        <h2>开始截图</h2>
        <p>在上方输入网页URL并打开，然后选择截图方式</p>
        <div class="feature-list">
          <div class="feature-item">
            <span>🔗</span>
            <div>
              <strong>打开网页</strong>
              <p>输入URL并打开要截图的网页</p>
            </div>
          </div>
          <div class="feature-item">
            <span>📄</span>
            <div>
              <strong>整页截图</strong>
              <p>捕获整个网页内容，包括滚动区域</p>
            </div>
          </div>
          <div class="feature-item">
            <span>🖥️</span>
            <div>
              <strong>可视区域</strong>
              <p>仅捕获当前可见的屏幕区域</p>
            </div>
          </div>
          <div class="feature-item">
            <span>✂️</span>
            <div>
              <strong>自定义区域</strong>
              <p>手动选择需要截图的区域</p>
            </div>
          </div>
          <div class="feature-item">
            <span>✏️</span>
            <div>
              <strong>标注编辑</strong>
              <p>添加箭头、文字、马赛克等标注</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载提示 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner"></div>
      <p>正在生成截图...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { ScreenshotTool, createSelectionOverlay } from './utils/screenshot'
import { AnnotationTool } from './utils/annotation'

export default {
  name: 'App',
  setup() {
    const canvasRef = ref(null)
    const webpageIframe = ref(null)
    const hasScreenshot = ref(false)
    const isLoading = ref(false)
    const canvasWidth = ref(0)
    const canvasHeight = ref(0)
    const targetUrl = ref('')
    const currentUrl = ref('')
    const webpageLoaded = ref(false)
    
    // 标注工具状态
    const currentTool = ref('arrow')
    const strokeColor = ref('#FF0000')
    const fillColor = ref('rgba(255, 0, 0, 0.3)')
    const lineWidth = ref(2)
    const fontSize = ref(16)
    
    let screenshotTool = null
    let annotationTool = null

    onMounted(() => {
      screenshotTool = new ScreenshotTool()
    })

    // 打开目标网页
    const openTargetUrl = () => {
      const url = targetUrl.value.trim()
      if (!url) return
      
      // 确保URL以http开头
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`
      currentUrl.value = formattedUrl
      webpageLoaded.value = false
      hasScreenshot.value = false
    }

    // 关闭网页
    const closeWebpage = () => {
      currentUrl.value = ''
      webpageLoaded.value = false
      hasScreenshot.value = false
    }

    // 网页加载完成
    const onWebpageLoaded = () => {
      webpageLoaded.value = true
    }

    // 整页截图
    const captureFullPage = async () => {
      if (!currentUrl.value) {
        alert('请先打开要截图的网页')
        return
      }
      
      isLoading.value = true
      try {
        const iframeDoc = webpageIframe.value.contentDocument || webpageIframe.value.contentWindow.document
        const result = await screenshotTool.captureFullPage(iframeDoc.body)
        displayScreenshot(result.canvas)
      } catch (error) {
        console.error('截图失败:', error)
        alert('截图失败：可能是跨域限制，请尝试其他网页或使用本地网页测试')
      } finally {
        isLoading.value = false
      }
    }

    // 可视区域截图
    const captureViewport = async () => {
      if (!currentUrl.value) {
        alert('请先打开要截图的网页')
        return
      }
      
      isLoading.value = true
      try {
        const iframeDoc = webpageIframe.value.contentDocument || webpageIframe.value.contentWindow.document
        const result = await screenshotTool.captureViewport(iframeDoc.body)
        displayScreenshot(result.canvas)
      } catch (error) {
        console.error('截图失败:', error)
        alert('截图失败：可能是跨域限制，请尝试其他网页或使用本地网页测试')
      } finally {
        isLoading.value = false
      }
    }

    // 自定义区域截图
    const startCustomCapture = () => {
      if (webpageLoaded.value) {
        const iframe = webpageIframe.value
        if (!iframe || !iframe.contentWindow) return
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        const iframeWindow = iframe.contentWindow
        
        // 创建选择覆盖层
        const overlay = iframeDoc.createElement('div')
        overlay.style.position = 'fixed'
        overlay.style.top = '0'
        overlay.style.left = '0'
        overlay.style.width = '100%'
        overlay.style.height = '100%'
        overlay.style.background = 'rgba(0, 0, 0, 0.3)'
        overlay.style.cursor = 'crosshair'
        overlay.style.zIndex = '999999'
        
        const selection = iframeDoc.createElement('div')
        selection.style.position = 'absolute'
        selection.style.border = '2px solid #409EFF'
        selection.style.background = 'rgba(64, 158, 255, 0.1)'
        selection.style.zIndex = '999999'
        
        iframeDoc.body.appendChild(overlay)
        iframeDoc.body.appendChild(selection)
        
        let startX, startY, isSelecting = false
        
        const handleMouseDown = (e) => {
          isSelecting = true
          startX = e.clientX
          startY = e.clientY
          selection.style.left = startX + 'px'
          selection.style.top = startY + 'px'
          selection.style.width = '0'
          selection.style.height = '0'
        }
        
        const handleMouseMove = (e) => {
          if (!isSelecting) return
          
          const currentX = e.clientX
          const currentY = e.clientY
          
          const width = Math.abs(currentX - startX)
          const height = Math.abs(currentY - startY)
          
          selection.style.left = Math.min(startX, currentX) + 'px'
          selection.style.top = Math.min(startY, currentY) + 'px'
          selection.style.width = width + 'px'
          selection.style.height = height + 'px'
        }
        
        const handleMouseUp = async (e) => {
          if (!isSelecting) return
          isSelecting = false
          
          const endX = e.clientX
          const endY = e.clientY
          
          const x = Math.min(startX, endX)
          const y = Math.min(startY, endY)
          const width = Math.abs(endX - startX)
          const height = Math.abs(endY - startY)
          
          if (width > 10 && height > 10) {
            isLoading.value = true
            try {
              // 使用iframe的文档对象进行截图
              const result = await screenshotTool.captureCustomArea(x, y, width, height, iframeDoc.body)
              displayScreenshot(result)
            } catch (error) {
              console.error('截图失败:', error)
              alert(`截图失败: ${error.message}`)
            } finally {
              isLoading.value = false
            }
          }
          
          // 清理
          iframeDoc.body.removeChild(overlay)
          iframeDoc.body.removeChild(selection)
          iframeWindow.removeEventListener('mousedown', handleMouseDown)
          iframeWindow.removeEventListener('mousemove', handleMouseMove)
          iframeWindow.removeEventListener('mouseup', handleMouseUp)
        }
        
        iframeWindow.addEventListener('mousedown', handleMouseDown)
        iframeWindow.addEventListener('mousemove', handleMouseMove)
        iframeWindow.addEventListener('mouseup', handleMouseUp)
      } else {
        alert('请先打开一个网页进行截图')
      }
    }

    // 显示截图
    const displayScreenshot = (result) => {
      if (!canvasRef.value || !result) return
      
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      
      // 设置canvas尺寸
      canvas.width = result.width
      canvas.height = result.height
      
      // 绘制截图
      ctx.drawImage(result, 0, 0)
      
      canvasWidth.value = result.width
      canvasHeight.value = result.height
      hasScreenshot.value = true
      
      // 初始化标注工具
      if (annotationTool) {
        annotationTool.clear()
      }
      annotationTool = new AnnotationTool(canvas)
      annotationTool.init()
    }

    // 切换工具
    const changeTool = (tool) => {
      currentTool.value = tool
      if (annotationTool) {
        annotationTool.setTool(tool)
      }
    }

    // 更新样式
    const updateStyle = () => {
      if (annotationTool) {
        annotationTool.setStyle({
          strokeColor: strokeColor.value,
          fillColor: fillColor.value,
          lineWidth: lineWidth.value,
          fontSize: fontSize.value
        })
      }
    }

    // 清除截图
    const clearScreenshot = () => {
      if (canvasRef.value) {
        const ctx = canvasRef.value.getContext('2d')
        ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
      }
      hasScreenshot.value = false
      if (annotationTool) {
        annotationTool.clear()
      }
    }

    // 清除所有标注
    const clearAnnotations = () => {
      if (annotationTool) {
        annotationTool.clearAnnotations()
      }
    }

    // 下载图片
    const downloadImage = () => {
      if (!canvasRef.value) return
      
      if (annotationTool) {
        annotationTool.downloadImage(`screenshot_${Date.now()}.png`)
      } else {
        const link = document.createElement('a')
        link.download = `screenshot_${Date.now()}.png`
        link.href = canvasRef.value.toDataURL('image/png')
        link.click()
      }
    }

    return {
      canvasRef,
      webpageIframe,
      hasScreenshot,
      isLoading,
      canvasWidth,
      canvasHeight,
      targetUrl,
      currentUrl,
      webpageLoaded,
      currentTool,
      strokeColor,
      fillColor,
      lineWidth,
      fontSize,
      captureFullPage,
      captureViewport,
      startCustomCapture,
      clearScreenshot,
      clearAnnotations,
      downloadImage,
      changeTool,
      updateStyle,
      openTargetUrl,
      closeWebpage
    }
  }
}
</script>

<style scoped>
.screenshot-tool {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

/* 工具栏样式 */
.toolbar {
  background: #fff;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.toolbar h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.tool-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #409EFF;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-secondary {
  background: #6C757D;
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-success {
  background: #67C23A;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #85ce61;
}

.btn-warning {
  background: #E6A23C;
  color: #fff;
}

.btn-warning:hover:not(:disabled) {
  background: #ebb563;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 预览区域 */
.preview-section {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.preview-container {
  flex: 1;
  overflow: auto;
  background: #e9ecef;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.screenshot-canvas {
  max-width: 100%;
  border: 1px solid #ddd;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

/* 标注工具栏 */
.annotation-toolbar {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  padding: 20px;
  overflow-y: auto;
}

.annotation-toolbar h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.tool-group {
  margin-bottom: 20px;
}

.tool-group label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.tool-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.color-picker {
  width: 100%;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.slider {
  width: 180px;
  margin-right: 12px;
}

.value-display {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
  padding: 40px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h2 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 40px 0;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 800px;
}

.feature-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.feature-item span {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-item div strong {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.feature-item div p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

/* 网页输入区域 */
.webpage-input {
  background: #fff;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.webpage-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.webpage-input input:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.webpage-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.webpage-header {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.webpage-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.webpage-content {
  flex: 1;
  overflow: auto;
  background: #e9ecef;
}

.webpage-content iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  font-size: 16px;
  margin: 0;
}
</style>