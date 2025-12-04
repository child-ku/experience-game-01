// 拖拽和连接功能工具类

// 计算两点之间的距离
export const getDistance = (p1, p2) => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算中点
export const getMidPoint = (p1, p2) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

// 计算角度
export const getAngle = (p1, p2) => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

// 创建贝塞尔曲线路径
export const createBezierPath = (start, end, curvature = 0.5) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = getDistance(start, end)
  
  // 控制点距离
  const controlPointDistance = Math.min(distance * curvature, 150)
  
  // 计算控制点
  const angle = getAngle(start, end)
  const controlPoint1 = {
    x: start.x + Math.cos(angle) * controlPointDistance,
    y: start.y + Math.sin(angle) * controlPointDistance
  }
  
  const controlPoint2 = {
    x: end.x - Math.cos(angle) * controlPointDistance,
    y: end.y - Math.sin(angle) * controlPointDistance
  }
  
  return `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`
}

// 创建直角路径
export const createRightAnglePath = (start, end, direction = 'horizontal') => {
  const midY = (start.y + end.y) / 2
  const midX = (start.x + end.x) / 2
  
  if (direction === 'horizontal') {
    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
  } else {
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
  }
}

// 检测点是否在路径上
export const isPointOnPath = (path, point, tolerance = 5) => {
  // 简化的路径检测逻辑
  // 实际应用中可以使用更精确的算法
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathElement.setAttribute('d', path)
  
  const pathLength = pathElement.getTotalLength()
  
  // 检查路径附近的点
  for (let i = 0; i <= pathLength; i += 5) {
    const pathPoint = pathElement.getPointAtLength(i)
    const distance = getDistance(pathPoint, point)
    if (distance <= tolerance) {
      return true
    }
  }
  
  return false
}

// 获取端口位置
export const getPortPosition = (node, port, canvasRect) => {
  const nodeRect = {
    left: node.x,
    top: node.y,
    right: node.x + node.width,
    bottom: node.y + node.height,
    centerX: node.x + node.width / 2,
    centerY: node.y + node.height / 2
  }
  
  switch (port) {
    case 'top':
      return { x: nodeRect.centerX, y: nodeRect.top }
    case 'right':
      return { x: nodeRect.right, y: nodeRect.centerY }
    case 'bottom':
      return { x: nodeRect.centerX, y: nodeRect.bottom }
    case 'left':
      return { x: nodeRect.left, y: nodeRect.centerY }
    default:
      return { x: nodeRect.centerX, y: nodeRect.centerY }
  }
}

// 拖拽辅助线对齐
export const getSnapPosition = (x, y, gridSize = 20) => {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  }
}

// 检测对齐
export const detectAlignment = (draggedNode, otherNodes, threshold = 5) => {
  const alignments = {
    left: null,
    right: null,
    top: null,
    bottom: null,
    centerX: null,
    centerY: null
  }
  
  const draggedRect = {
    left: draggedNode.x,
    right: draggedNode.x + draggedNode.width,
    top: draggedNode.y,
    bottom: draggedNode.y + draggedNode.height,
    centerX: draggedNode.x + draggedNode.width / 2,
    centerY: draggedNode.y + draggedNode.height / 2
  }
  
  otherNodes.forEach(node => {
    if (node.id === draggedNode.id) return
    
    const nodeRect = {
      left: node.x,
      right: node.x + node.width,
      top: node.y,
      bottom: node.y + node.height,
      centerX: node.x + node.width / 2,
      centerY: node.y + node.height / 2
    }
    
    // 左对齐
    if (Math.abs(draggedRect.left - nodeRect.left) <= threshold) {
      alignments.left = nodeRect.left
    }
    
    // 右对齐
    if (Math.abs(draggedRect.right - nodeRect.right) <= threshold) {
      alignments.right = nodeRect.right
    }
    
    // 顶部对齐
    if (Math.abs(draggedRect.top - nodeRect.top) <= threshold) {
      alignments.top = nodeRect.top
    }
    
    // 底部对齐
    if (Math.abs(draggedRect.bottom - nodeRect.bottom) <= threshold) {
      alignments.bottom = nodeRect.bottom
    }
    
    // 水平居中对齐
    if (Math.abs(draggedRect.centerX - nodeRect.centerX) <= threshold) {
      alignments.centerX = nodeRect.centerX
    }
    
    // 垂直居中对齐
    if (Math.abs(draggedRect.centerY - nodeRect.centerY) <= threshold) {
      alignments.centerY = nodeRect.centerY
    }
  })
  
  return alignments
}

// 计算连接点
export const calculateConnectionPoints = (startNode, startPort, endNode, endPort) => {
  const startPoint = getPortPosition(startNode, startPort)
  const endPoint = getPortPosition(endNode, endPort)
  
  return { startPoint, endPoint }
}

// 生成唯一ID
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 防抖函数
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}