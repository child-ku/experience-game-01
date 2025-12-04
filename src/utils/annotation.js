/**
 * 标注编辑工具类
 * 支持基本图形标注、文字标注、马赛克和模糊处理
 */
export class AnnotationTool {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.isDrawing = false
    this.currentTool = 'arrow'
    this.startPoint = null
    this.annotations = []
    this.currentAnnotation = null
    
    // 默认样式
    this.strokeColor = '#FF0000'
    this.fillColor = 'rgba(255, 0, 0, 0.3)'
    this.lineWidth = 2
    this.fontSize = 16
    this.fontFamily = 'Arial'
    
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 移除之前的事件监听器，防止重复绑定
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick.bind(this))
    
    // 添加新的事件监听器
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this))
  }

  /**
   * 处理鼠标按下事件
   */
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect()
    this.startPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    this.isDrawing = true

    if (this.currentTool === 'text') {
      this.createTextAnnotation(this.startPoint)
    } else {
      this.currentAnnotation = {
        type: this.currentTool,
        start: { ...this.startPoint },
        end: { ...this.startPoint },
        strokeColor: this.strokeColor,
        fillColor: this.fillColor,
        lineWidth: this.lineWidth,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily
      }
    }
  }

  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(e) {
    if (!this.isDrawing || !this.startPoint) return

    const rect = this.canvas.getBoundingClientRect()
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    if (this.currentAnnotation) {
      this.currentAnnotation.end = { ...currentPoint }
      this.redraw()
    }
  }

  /**
   * 处理鼠标释放事件
   */
  handleMouseUp(e) {
    if (!this.isDrawing) return

    this.isDrawing = false
    
    if (this.currentAnnotation) {
      this.annotations.push(this.currentAnnotation)
      this.currentAnnotation = null
    }
  }

  /**
   * 重绘所有标注
   */
  redraw() {
    // 清除画布但保留原始图像
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = this.canvas.width
    tempCanvas.height = this.canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(this.canvas, 0, 0)
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(tempCanvas, 0, 0)

    // 绘制所有标注
    this.annotations.forEach(annotation => {
      this.drawAnnotation(annotation)
    })

    // 绘制当前正在绘制的标注
    if (this.currentAnnotation) {
      this.drawAnnotation(this.currentAnnotation)
    }
  }

  /**
   * 绘制单个标注
   */
  drawAnnotation(annotation) {
    this.ctx.strokeStyle = annotation.strokeColor
    this.ctx.fillStyle = annotation.fillColor
    this.ctx.lineWidth = annotation.lineWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    switch (annotation.type) {
      case 'arrow':
        this.drawArrow(annotation.start, annotation.end, annotation)
        break
      case 'rectangle':
        this.drawRectangle(annotation.start, annotation.end, annotation)
        break
      case 'circle':
        this.drawCircle(annotation.start, annotation.end, annotation)
        break
      case 'line':
        this.drawLine(annotation.start, annotation.end, annotation)
        break
      case 'text':
        this.drawText(annotation)
        break
      case 'mosaic':
        this.drawMosaic(annotation.start, annotation.end, annotation)
        break
      case 'blur':
        this.drawBlur(annotation.start, annotation.end, annotation)
        break
    }
  }

  /**
   * 绘制箭头
   */
  drawArrow(start, end, annotation) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    // 箭杆
    this.ctx.beginPath()
    this.ctx.moveTo(start.x, start.y)
    this.ctx.lineTo(end.x, end.y)
    this.ctx.stroke()

    // 箭头
    const arrowSize = 10
    const arrowAngle = Math.PI / 6

    this.ctx.beginPath()
    this.ctx.moveTo(end.x, end.y)
    this.ctx.lineTo(
      end.x - arrowSize * Math.cos(angle - arrowAngle),
      end.y - arrowSize * Math.sin(angle - arrowAngle)
    )
    this.ctx.lineTo(
      end.x - arrowSize * Math.cos(angle + arrowAngle),
      end.y - arrowSize * Math.sin(angle + arrowAngle)
    )
    this.ctx.closePath()
    this.ctx.fill()
  }

  /**
   * 绘制矩形
   */
  drawRectangle(start, end, annotation) {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    this.ctx.beginPath()
    this.ctx.rect(x, y, width, height)
    this.ctx.stroke()
    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
      this.ctx.fill()
    }
  }

  /**
   * 绘制圆形
   */
  drawCircle(start, end, annotation) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const radius = Math.sqrt(dx * dx + dy * dy)

    this.ctx.beginPath()
    this.ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
    this.ctx.stroke()
    if (annotation.fillColor && annotation.fillColor !== 'transparent') {
      this.ctx.fill()
    }
  }

  /**
   * 绘制直线
   */
  drawLine(start, end, annotation) {
    this.ctx.beginPath()
    this.ctx.moveTo(start.x, start.y)
    this.ctx.lineTo(end.x, end.y)
    this.ctx.stroke()
  }

  /**
   * 绘制文字
   */
  drawText(annotation) {
    this.ctx.font = `${annotation.fontSize}px ${annotation.fontFamily}`
    this.ctx.fillStyle = annotation.strokeColor
    this.ctx.fillText(annotation.text || '双击编辑文字', annotation.start.x, annotation.start.y)
  }

  /**
   * 绘制马赛克
   */
  drawMosaic(start, end, annotation) {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    
    const mosaicSize = 10
    const imageData = this.ctx.getImageData(x, y, width, height)
    const data = imageData.data
    
    for (let i = 0; i < height; i += mosaicSize) {
      for (let j = 0; j < width; j += mosaicSize) {
        const index = (i * width + j) * 4
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]
        
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        this.ctx.fillRect(x + j, y + i, mosaicSize, mosaicSize)
      }
    }
  }

  /**
   * 绘制模糊效果
   */
  drawBlur(start, end, annotation) {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    
    // 简单的模糊实现
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')
    
    tempCtx.drawImage(this.canvas, x, y, width, height, 0, 0, width, height)
    
    // 应用模糊滤镜
    tempCtx.filter = 'blur(10px)'
    tempCtx.drawImage(tempCanvas, 0, 0)
    
    this.ctx.drawImage(tempCanvas, 0, 0, width, height, x, y, width, height)
  }

  /**
   * 创建文字标注
   */
  createTextAnnotation(point) {
    const annotation = {
      type: 'text',
      start: { ...point },
      text: '',
      strokeColor: this.strokeColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily
    }

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = '输入文字...'
    input.style.position = 'absolute'
    input.style.left = (this.canvas.offsetLeft + point.x) + 'px'
    input.style.top = (this.canvas.offsetTop + point.y - this.fontSize) + 'px'
    input.style.font = `${this.fontSize}px ${this.fontFamily}`
    input.style.border = '1px solid #ccc'
    input.style.padding = '2px 5px'
    input.style.zIndex = '1000'

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        annotation.text = input.value || '文字标注'
        this.annotations.push(annotation)
        document.body.removeChild(input)
        this.redraw()
      } else if (e.key === 'Escape') {
        document.body.removeChild(input)
      }
    })

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        annotation.text = input.value
        this.annotations.push(annotation)
        this.redraw()
      }
      document.body.removeChild(input)
    })

    document.body.appendChild(input)
    input.focus()
  }

  /**
   * 设置当前工具
   */
  setTool(tool) {
    this.currentTool = tool
  }

  /**
   * 设置样式
   */
  setStyle(options) {
    if (options.strokeColor) this.strokeColor = options.strokeColor
    if (options.fillColor) this.fillColor = options.fillColor
    if (options.lineWidth) this.lineWidth = options.lineWidth
    if (options.fontSize) this.fontSize = options.fontSize
    if (options.fontFamily) this.fontFamily = options.fontFamily
  }

  /**
   * 清除所有标注
   */
  clearAll() {
    this.annotations = []
    this.currentAnnotation = null
    this.redraw()
  }

  /**
   * 导出带标注的图片
   */
  exportImage(format = 'png', quality = 0.95) {
    return this.canvas.toDataURL(`image/${format}`, quality)
  }

  /**
   * 下载图片
   * @param {string} filename - 文件名
   * @param {string} format - 图片格式 (png/jpeg/webp)
   * @param {number} quality - 图片质量 (0-1)
   */
  downloadImage(filename = 'screenshot.png', format = 'png', quality = 0.95) {
    const dataUrl = this.exportImage(format, quality)
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  /**
   * 获取所有标注
   */
  getAnnotations() {
    return [...this.annotations]
  }
}