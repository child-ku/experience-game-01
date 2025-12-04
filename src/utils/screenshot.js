import html2canvas from 'html2canvas'

/**
 * 网页截图工具类
 * 提供整页截图、可视区域截图、自定义区域截图功能
 */
export class ScreenshotTool {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.screenshotData = null
  }

  /**
   * 整页截图
   * @param {HTMLElement} targetElement - 目标元素（可选，默认为document.body）
   * @returns {Promise<{canvas: HTMLCanvasElement, dataUrl: string}>}
   */
  async captureFullPage(targetElement = document.body) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: window.devicePixelRatio,
        useCORS: true,
        logging: false
      })
      
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
      this.screenshotData = canvas.toDataURL('image/png')
      
      return {
        canvas,
        dataUrl: this.screenshotData
      }
    } catch (error) {
      console.error('整页截图失败:', error)
      throw new Error('无法完成整页截图')
    }
  }

  /**
   * 可视区域截图
   * @param {HTMLElement} targetElement - 目标元素（可选，默认为document.documentElement）
   * @returns {Promise<{canvas: HTMLCanvasElement, dataUrl: string}>}
   */
  async captureViewport(targetElement = document.documentElement) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: window.devicePixelRatio,
        useCORS: true,
        logging: false,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      })
      
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
      this.screenshotData = canvas.toDataURL('image/png')
      
      return {
        canvas,
        dataUrl: this.screenshotData
      }
    } catch (error) {
      console.error('可视区域截图失败:', error)
      throw new Error('无法完成可视区域截图')
    }
  }

  /**
   * 自定义区域截图
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {HTMLElement} targetElement - 目标元素（可选，默认为document.body）
   * @returns {Promise<{canvas: HTMLCanvasElement, dataUrl: string}>}
   */
  async captureCustomArea(x, y, width, height, targetElement = document.body) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: window.devicePixelRatio,
        useCORS: true,
        logging: false,
        x: x,
        y: y,
        width: width,
        height: height
      })
      
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
      this.screenshotData = canvas.toDataURL('image/png')
      
      return {
        canvas,
        dataUrl: this.screenshotData
      }
    } catch (error) {
      console.error('自定义区域截图失败:', error)
      throw new Error('无法完成自定义区域截图')
    }
  }

  /**
   * 获取截图数据
   * @returns {string|null}
   */
  getScreenshotData() {
    return this.screenshotData
  }

  /**
   * 获取Canvas对象
   * @returns {HTMLCanvasElement|null}
   */
  getCanvas() {
    return this.canvas
  }

  /**
   * 清除当前截图
   */
  clear() {
    this.canvas = null
    this.ctx = null
    this.screenshotData = null
  }
}

/**
 * 创建截图选择器（用于自定义区域选择）
 * @param {Function} onSelect - 选择完成后的回调函数
 * @returns {HTMLElement}
 */
export function createSelectionOverlay(onSelect) {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    cursor: crosshair;
  `

  const selection = document.createElement('div')
  selection.style.cssText = `
    position: absolute;
    border: 2px solid #409EFF;
    background: rgba(64, 158, 255, 0.1);
    display: none;
  `
  overlay.appendChild(selection)

  let startX, startY, isDragging = false

  overlay.addEventListener('mousedown', (e) => {
    startX = e.clientX
    startY = e.clientY
    isDragging = true
    
    selection.style.left = startX + 'px'
    selection.style.top = startY + 'px'
    selection.style.width = '0px'
    selection.style.height = '0px'
    selection.style.display = 'block'
  })

  overlay.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    
    const currentX = e.clientX
    const currentY = e.clientY
    
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    const left = Math.min(startX, currentX)
    const top = Math.min(startY, currentY)
    
    selection.style.left = left + 'px'
    selection.style.top = top + 'px'
    selection.style.width = width + 'px'
    selection.style.height = height + 'px'
  })

  overlay.addEventListener('mouseup', (e) => {
    if (!isDragging) return
    
    isDragging = false
    const currentX = e.clientX
    const currentY = e.clientY
    
    const x = Math.min(startX, currentX)
    const y = Math.min(startY, currentY)
    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    
    if (width > 10 && height > 10) {
      onSelect(x, y, width, height)
    }
    
    document.body.removeChild(overlay)
  })

  overlay.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false
      document.body.removeChild(overlay)
    }
  })

  document.body.appendChild(overlay)
  return overlay
}