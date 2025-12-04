<template>
  <div class="workflow-designer-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="saveWorkflow">保存</button>
        <button class="toolbar-btn" @click="exportWorkflow">导出</button>
        <button class="toolbar-btn" @click="importWorkflow">导入</button>
        <button class="toolbar-btn" @click="clearCanvas">清空</button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="zoomIn">放大</button>
        <button class="toolbar-btn" @click="zoomOut">缩小</button>
        <button class="toolbar-btn" @click="resetZoom">重置</button>
        <button class="toolbar-btn" @click="toggleSnapToGrid" :class="{ active: snapToGrid }" title="切换网格对齐">
          <span class="icon">📏</span>
        </button>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="workspace">
      <!-- 左侧节点库 -->
      <div class="node-library">
        <h3>节点库</h3>
        
        <!-- 分类标签 -->
        <div class="category-tabs">
          <button class="category-tab" 
                  v-for="category in categories" 
                  :key="category"
                  :class="{ active: currentCategory === category }"
                  @click="currentCategory = category">
            {{ NODE_CATEGORIES[category].category }}
          </button>
        </div>
        
        <!-- 节点列表 -->
        <div class="node-items">
          <div class="node-item" 
               v-for="nodeType in getNodeTypesByCategory(currentCategory)" 
               :key="nodeType.type"
               draggable="true"
               @dragstart="onDragStart($event, nodeType)">
            <div class="node-icon" :style="{ backgroundColor: nodeType.color }">{{ nodeType.icon }}</div>
            <span>{{ nodeType.label }}</span>
            <div class="node-description">{{ nodeType.description }}</div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-area">
        <div class="canvas-wrapper" ref="canvasWrapper">
          <div class="canvas-grid" ref="canvasGrid"></div>
          <div class="canvas" 
               ref="canvas"
               @drop="onDrop"
               @dragover="onDragOver"
               @click="onCanvasClick">
            <!-- 节点将动态渲染在这里 -->
            <!-- 对齐线 -->
            <div v-if="showAlignmentLines" class="alignment-lines">
              <!-- 水平对齐线 -->
              <div
                v-if="alignments?.horizontal"
                class="alignment-line horizontal"
                :style="{
                  top: alignments.horizontal + 'px',
                  left: 0,
                  right: 0
                }"
              ></div>
              <!-- 垂直对齐线 -->
              <div
                v-if="alignments?.vertical"
                class="alignment-line vertical"
                :style="{
                  left: alignments.vertical + 'px',
                  top: 0,
                  bottom: 0
                }"
              ></div>
            </div>
            <div class="workflow-node" 
                 v-for="node in nodes" 
                 :key="node.id"
                 :class="{ 'subprocess-expanded': subprocessStates[node.id] }"
                 :style="{ left: node.x + 'px', top: node.y + 'px', width: node.width + 'px', height: node.height + 'px' }"
                 :data-node-id="node.id"
                 @mousedown="onNodeMouseDown($event, node)">
              <div class="node-content" 
                   :class="['node-shape-' + node.shape]"
                   :style="{ 
                     backgroundColor: node.color, 
                     borderStyle: node.borderStyle, 
                     width: node.width + 'px', 
                     height: node.height + 'px' 
                   }">
                <div class="node-title">{{ node.label }}</div>
                <div class="node-text">{{ node.text }}</div>
                <div v-if="node.type === 'subprocess'" class="subprocess-toggle" @click.stop="toggleSubprocess(node)">
                  {{ subprocessStates[node.id] ? '▼' : '▶' }}
                </div>
              </div>
              <div class="node-ports">
                <div class="port port-top" @mousedown="onPortMouseDown($event, node, 'top')"></div>
                <div class="port port-right" @mousedown="onPortMouseDown($event, node, 'right')"></div>
                <div class="port port-bottom" @mousedown="onPortMouseDown($event, node, 'bottom')"></div>
                <div class="port port-left" @mousedown="onPortMouseDown($event, node, 'left')"></div>
              </div>
              <!-- 子流程内部画布 -->
              <div v-if="node.type === 'subprocess' && subprocessStates[node.id]" class="subprocess-canvas">
                <div class="subprocess-header">
                  <span>子流程: {{ node.text }}</span>
                  <button class="close-btn" @click.stop="toggleSubprocess(node)">×</button>
                </div>
                <div class="subprocess-inner-canvas">
                  <!-- 子流程内部节点将在这里渲染 -->
                  <div class="workflow-node" 
                       v-for="innerNode in getSubprocessNodes(node.id)" 
                       :key="innerNode.id"
                       :style="{ left: innerNode.x + 'px', top: innerNode.y + 'px', width: innerNode.width + 'px', height: innerNode.height + 'px' }"
                       @mousedown="onNodeMouseDown($event, innerNode)">
                    <div class="node-content" 
                         :class="['node-shape-' + innerNode.shape]"
                         :style="{ 
                           backgroundColor: innerNode.color, 
                           borderStyle: innerNode.borderStyle, 
                           width: innerNode.width + 'px', 
                           height: innerNode.height + 'px' 
                         }">
                      <div class="node-title">{{ innerNode.label }}</div>
                      <div class="node-text">{{ innerNode.text }}</div>
                    </div>
                    <div class="node-ports">
                      <div class="port port-top" @mousedown="onPortMouseDown($event, innerNode, 'top')"></div>
                      <div class="port port-right" @mousedown="onPortMouseDown($event, innerNode, 'right')"></div>
                      <div class="port port-bottom" @mousedown="onPortMouseDown($event, innerNode, 'bottom')"></div>
                      <div class="port port-left" @mousedown="onPortMouseDown($event, innerNode, 'left')"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 连接线将动态渲染在这里 -->
            <svg class="connections-svg" ref="connectionsSvg">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#666" />
                </marker>
              </defs>
              <path v-for="connection in connections" 
                    :key="connection.id"
                    :d="connection.path"
                    :style="{
                      stroke: connection.style.stroke,
                      'stroke-width': connection.style.strokeWidth
                    }"
                    fill="none"
                    marker-end="url(#arrowhead)"
                    @click="onConnectionClick($event, connection)"></path>
              <!-- 临时连接 -->
              <path v-if="tempConnection"
                    :d="tempConnection.path"
                    stroke="#666"
                    stroke-width="2"
                    fill="none"
                    stroke-dasharray="5,5"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="properties-panel">
        <h3>属性</h3>
        <div class="properties-content" v-if="selectedElement">
          <div class="property-group">
            <label>标签</label>
            <input type="text" v-model="selectedElement.label" @input="updateElement" />
          </div>
          <div class="property-group">
            <label>文本</label>
            <textarea v-model="selectedElement.text" @input="updateElement"></textarea>
          </div>
          <div class="property-group" v-if="selectedElement.type !== 'connection'">
            <label>位置</label>
            <div class="property-row">
              <input type="number" v-model.number="selectedElement.x" @input="updateElement" />
              <input type="number" v-model.number="selectedElement.y" @input="updateElement" />
            </div>
          </div>
          <button class="delete-btn" @click="deleteSelectedElement">删除</button>
        </div>
        <div class="properties-empty" v-else>
          选择一个节点或连接来编辑属性
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { NODE_TYPES, getNodeTypesList, NODE_CATEGORIES, getNodeTypesByCategory } from '../config/nodeTypes'
import { 
  getSnapPosition, 
  detectAlignment, 
  generateId,
  debounce 
} from '../utils/dragAndDrop'

// 节点类型定义
const nodeTypes = ref(getNodeTypesList())
const currentCategory = ref('BASIC')
const categories = ref(Object.keys(NODE_CATEGORIES))

// 状态管理
const nodes = ref([])
const connections = ref([])
const selectedElement = ref(null)
const draggedNodeType = ref(null)
const isDraggingNode = ref(false)
const draggedNode = ref(null)
const isConnecting = ref(false)
const connectionStart = ref(null)
const tempConnection = ref(null)
const alignments = ref(null)
const showAlignmentLines = ref(false)
const canvas = ref(null)
const canvasWrapper = ref(null)
const canvasGrid = ref(null)
const connectionsSvg = ref(null)
const nodeIdCounter = ref(0)

// 子流程状态管理
const subprocessStates = ref({})
const currentSubprocess = ref(null)
const connectionIdCounter = ref(0)
const gridSize = ref(20)
const snapToGrid = ref(true)

// 拖拽开始
const onDragStart = (event, nodeType) => {
  draggedNodeType.value = nodeType
  event.dataTransfer.effectAllowed = 'copy'
}

// 拖拽经过
const onDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

// 放置节点
const onDrop = (event) => {
  event.preventDefault()
  if (draggedNodeType.value) {
    const rect = canvas.value.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    
    // 对齐到网格
    if (snapToGrid.value) {
      const snapPos = getSnapPosition(x, y, gridSize.value)
      x = snapPos.x
      y = snapPos.y
    }
    
    const newNode = {
      id: generateId('node'),
      type: draggedNodeType.value.type,
      label: draggedNodeType.value.label,
      text: draggedNodeType.value.defaultText || '',
      x: x,
      y: y,
      width: draggedNodeType.value.width || 120,
      height: draggedNodeType.value.height || 60,
      color: draggedNodeType.value.color,
      shape: draggedNodeType.value.shape || 'rectangle',
      borderStyle: draggedNodeType.value.borderStyle || 'solid',
      parentId: currentSubprocess.value?.id || null
    }
    
    nodes.value.push(newNode)
    draggedNodeType.value = null
  }
}

// 节点鼠标按下
const onNodeMouseDown = (event, node) => {
  event.stopPropagation()
  selectedElement.value = node
  isDraggingNode.value = true
  draggedNode.value = node
  
  const startX = event.clientX
  const startY = event.clientY
  const startNodeX = node.x
  const startNodeY = node.y
  
  const onMouseMove = (e) => {
    if (isDraggingNode.value && draggedNode.value) {
      let newX = startNodeX + (e.clientX - startX)
      let newY = startNodeY + (e.clientY - startY)
      
      // 对齐到网格
      if (snapToGrid.value) {
        const snapPos = getSnapPosition(newX, newY, gridSize.value)
        newX = snapPos.x
        newY = snapPos.y
      }
      
      draggedNode.value.x = newX
      draggedNode.value.y = newY
      
      // 如果拖动的是子流程节点，同时移动其内部节点
      if (draggedNode.value.type === 'subprocess') {
        const innerNodes = getSubprocessNodes(draggedNode.value.id)
        const deltaX = newX - startNodeX
        const deltaY = newY - startNodeY
        
        innerNodes.forEach(innerNode => {
          innerNode.x += deltaX
          innerNode.y += deltaY
        })
      }
      
      // 检测对齐
      const otherNodes = nodes.value.filter(n => n.id !== node.id)
      const detectedAlignments = detectAlignment(draggedNode.value, otherNodes)
      
      if (Object.values(detectedAlignments).some(v => v !== null)) {
        alignments.value = detectedAlignments
        showAlignmentLines.value = true
      } else {
        showAlignmentLines.value = false
      }
      
      updateConnections()
    }
  }
  
  const onMouseUp = () => {
    isDraggingNode.value = false
    draggedNode.value = null
    showAlignmentLines.value = false
    alignments.value = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 端口鼠标按下（开始连接）
const onPortMouseDown = (event, node, port) => {
  event.stopPropagation()
  isConnecting.value = true
  connectionStart.value = { node, port }
  
  const rect = canvas.value.getBoundingClientRect()
  const startPoint = getPortPosition(node, port)
  
  const onMouseMove = (e) => {
    if (isConnecting.value) {
      const endX = e.clientX - rect.left
      const endY = e.clientY - rect.top
      
      tempConnection.value = {
        start: startPoint,
        end: { x: endX, y: endY },
        path: createBezierPath(startPoint, { x: endX, y: endY })
      }
    }
  }
  
  const onMouseUp = (e) => {
    if (isConnecting.value) {
      // 检查是否连接到另一个节点的端口
      const target = e.target
      if (target.classList.contains('port')) {
        const targetNodeElement = target.closest('.workflow-node')
        if (targetNodeElement) {
          const targetNodeId = targetNodeElement.getAttribute('data-node-id')
          const targetNode = nodes.value.find(n => n.id === targetNodeId)
          const targetPort = target.classList.contains('port-top') ? 'top' :
                           target.classList.contains('port-right') ? 'right' :
                           target.classList.contains('port-bottom') ? 'bottom' : 'left'
          
          if (targetNode && connectionStart.value.node.id !== targetNode.id) {
            createConnection(connectionStart.value, { node: targetNode, port: targetPort })
          }
        }
      }
      
      isConnecting.value = false
      connectionStart.value = null
      tempConnection.value = null
    }
    
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 创建连接
const createConnection = (start, end) => {
  const connection = {
    id: generateId('connection'),
    startNodeId: start.node.id,
    startPort: start.port,
    endNodeId: end.node.id,
    endPort: end.port,
    path: '',
    style: {
      stroke: '#666',
      strokeWidth: 2,
      arrowColor: '#666',
      arrowSize: 8
    }
  }
  
  connections.value.push(connection)
  updateConnections()
}

// 更新所有连接路径
const updateConnections = debounce(() => {
  connections.value.forEach(conn => {
    const startNode = nodes.value.find(n => n.id === conn.startNodeId)
    const endNode = nodes.value.find(n => n.id === conn.endNodeId)
    
    if (startNode && endNode) {
      const startPoint = getPortPosition(startNode, conn.startPort)
      const endPoint = getPortPosition(endNode, conn.endPort)
      conn.path = createBezierPath(startPoint, endPoint)
    }
  })
}, 16)



// 切换网格对齐
const toggleSnapToGrid = () => {
  snapToGrid.value = !snapToGrid.value
}

// 画布点击
const onCanvasClick = () => {
  selectedElement.value = null
}

// 连接点击
const onConnectionClick = (event, connection) => {
  event.stopPropagation()
  selectedElement.value = connection
}

// 更新元素属性
const updateElement = () => {
  if (selectedElement.value && selectedElement.value.type !== 'connection') {
    updateConnections()
  }
}

// 获取子流程内部节点
const getSubprocessNodes = (subprocessId) => {
  return nodes.value.filter(node => node.parentId === subprocessId)
}

// 切换子流程展开/收起
const toggleSubprocess = (node) => {
  if (node.type === 'subprocess') {
    subprocessStates.value[node.id] = !subprocessStates.value[node.id]
    
    if (subprocessStates.value[node.id]) {
      // 展开子流程
      currentSubprocess.value = node
      // 可以在这里添加子流程内部节点的加载逻辑
    } else {
      // 收起子流程
      currentSubprocess.value = null
    }
  }
}

// 删除选中元素
const deleteSelectedElement = () => {
  if (selectedElement.value) {
    if (selectedElement.value.type === 'connection') {
      // 删除连接
      const index = connections.value.findIndex(c => c.id === selectedElement.value.id)
      if (index > -1) {
        connections.value.splice(index, 1)
      }
    } else {
      // 删除节点及其所有连接和子节点
      const nodeId = selectedElement.value.id
      
      // 删除所有相关连接
      connections.value = connections.value.filter(c => 
        c.startNodeId !== nodeId && c.endNodeId !== nodeId
      )
      
      // 删除节点及其子节点
      const nodesToDelete = [nodeId, ...getSubprocessNodes(nodeId).map(n => n.id)]
      nodes.value = nodes.value.filter(n => !nodesToDelete.includes(n.id))
      
      // 清理子流程状态
      delete subprocessStates.value[nodeId]
      if (currentSubprocess.value?.id === nodeId) {
        currentSubprocess.value = null
      }
    }
    selectedElement.value = null
  }
}

// 保存工作流
const saveWorkflow = () => {
  const workflow = {
    nodes: nodes.value,
    connections: connections.value
  }
  localStorage.setItem('workflow', JSON.stringify(workflow))
  alert('工作流已保存到本地存储')
}

// 导出工作流
const exportWorkflow = () => {
  const workflow = {
    nodes: nodes.value,
    connections: connections.value
  }
  const dataStr = JSON.stringify(workflow, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'workflow.json'
  link.click()
  URL.revokeObjectURL(url)
}

// 导入工作流
const importWorkflow = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const workflow = JSON.parse(event.target.result)
          nodes.value = workflow.nodes || []
          connections.value = workflow.connections || []
          updateConnections()
          alert('工作流导入成功')
        } catch (error) {
          alert('导入失败：无效的 JSON 文件')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 清空画布
const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    nodes.value = []
    connections.value = []
    selectedElement.value = null
  }
}

// 获取端口位置
const getPortPosition = (node, port) => {
  const { x, y, width, height } = node
  
  switch (port) {
    case 'top':
      return { x: x + width / 2, y: y }
    case 'right':
      return { x: x + width, y: y + height / 2 }
    case 'bottom':
      return { x: x + width / 2, y: y + height }
    case 'left':
      return { x: x, y: y + height / 2 }
    default:
      return { x: x + width / 2, y: y + height / 2 }
  }
}

// 创建贝塞尔曲线路径
const createBezierPath = (start, end) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const controlPointDistance = Math.min(distance * 0.5, 100)
  
  const angle = Math.atan2(dy, dx)
  const cp1x = start.x + Math.cos(angle) * controlPointDistance
  const cp1y = start.y + Math.sin(angle) * controlPointDistance
  const cp2x = end.x - Math.cos(angle) * controlPointDistance
  const cp2y = end.y - Math.sin(angle) * controlPointDistance
  
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`
}

// 缩放功能
const zoomIn = () => {
  const currentScale = canvasWrapper.value.style.transform ? 
    parseFloat(canvasWrapper.value.style.transform.match(/scale\(([\d.]+)\)/)[1]) : 1
  canvasWrapper.value.style.transform = `scale(${Math.min(currentScale + 0.1, 3)})`
}

const zoomOut = () => {
  const currentScale = canvasWrapper.value.style.transform ? 
    parseFloat(canvasWrapper.value.style.transform.match(/scale\(([\d.]+)\)/)[1]) : 1
  canvasWrapper.value.style.transform = `scale(${Math.max(currentScale - 0.1, 0.3)})`
}

const resetZoom = () => {
  canvasWrapper.value.style.transform = 'scale(1)'
}

// 初始化网格背景
const initGrid = () => {
  if (canvasGrid.value) {
    const size = 20
    const width = 2000
    const height = 2000
    
    const gridStyle = `
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
      background-size: ${size}px ${size}px;
      width: ${width}px;
      height: ${height}px;
    `
    
    canvasGrid.value.style = gridStyle
  }
}

// 初始化
onMounted(() => {
  initGrid()
  
  // 恢复之前保存的工作流
  const savedWorkflow = localStorage.getItem('workflow')
  if (savedWorkflow) {
    try {
      const workflow = JSON.parse(savedWorkflow)
      nodes.value = workflow.nodes || []
      connections.value = workflow.connections || []
      updateConnections()
    } catch (error) {
      console.error('Failed to load saved workflow:', error)
    }
  }
})

// 监听节点变化，更新连接
watch(nodes, () => {
  updateConnections()
}, { deep: true })
</script>

<style scoped>
.workflow-designer-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 工具栏 */
.toolbar {
  height: 50px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: var(--shadow);
}

.toolbar-btn {
  padding: 8px 16px;
  margin-right: 10px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.toolbar-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 工作区 */
.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 节点库 */
.node-library {
  width: 200px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 20px;
  overflow-y: auto;
}

.node-library h3 {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.3s;
}

.node-item:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: white;
  font-weight: bold;
  margin-bottom: 8px;
}

.node-description {
  font-size: 12px;
  color: var(--text-light-color);
  margin-top: 4px;
  width: 100%;
}

/* 分类标签样式 */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-tab {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.category-tab:hover {
  background: #e9ecef;
}

.category-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.node-items {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.node-item:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: white;
  font-weight: bold;
}

/* 画布区域 */
.canvas-area {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #fafafa;
}

.canvas-wrapper {
  position: relative;
  width: 2000px;
  height: 2000px;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

/* 工作流节点 */
.workflow-node {
  position: absolute;
  cursor: move;
  user-select: none;
  z-index: 10;
}

.node-content {
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 节点形状样式 */
.node-shape-rectangle {
  border-radius: 8px;
}

.node-shape-circle {
  border-radius: 50%;
}

.node-shape-diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  border-radius: 0;
}

.node-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.node-text {
  font-size: 12px;
  opacity: 0.9;
}

/* 端口 */
.node-ports {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.port {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  cursor: crosshair;
  pointer-events: all;
  transition: all 0.3s;
}

.port:hover {
  background: var(--primary-color);
  transform: scale(1.2);
}

.port-top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.port-right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.port-bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.port-left {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

/* 连接线条 SVG */
.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 2000px;
  height: 2000px;
  pointer-events: none;
  z-index: 5;
}

.connections-svg path {
  pointer-events: stroke;
}

.connection-line {
  fill: none;
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s;
}

.temp-connection-line {
  stroke: #666;
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 5,5;
  pointer-events: none;
}

.connections-svg path:hover {
  stroke: var(--primary-color);
}

/* 属性面板 */
.properties-panel {
  width: 250px;
  background: white;
  border-left: 1px solid var(--border-color);
  padding: 20px;
  overflow-y: auto;
}

.properties-panel h3 {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.property-group {
  margin-bottom: 20px;
}

.property-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.property-group input,
.property-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
}

.property-group textarea {
  resize: vertical;
  min-height: 60px;
}

.property-row {
  display: flex;
  gap: 10px;
}

.property-row input {
  flex: 1;
}

.delete-btn {
  width: 100%;
  padding: 10px;
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: #f78989;
}

.properties-empty {
  text-align: center;
  color: var(--text-light-color);
  font-size: 14px;
  padding: 40px 20px;
}

/* 子流程样式 */
.subprocess-toggle {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.subprocess-toggle:hover {
  background: rgba(255, 255, 255, 1);
}

.subprocess-canvas {
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  min-height: 300px;
  background: white;
  border: 2px solid #1abc9c;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-top: 10px;
}

.subprocess-header {
  padding: 10px 15px;
  background: #1abc9c;
  color: white;
  border-radius: 6px 6px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subprocess-header span {
  font-weight: bold;
}

.subprocess-header .close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subprocess-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.subprocess-inner-canvas {
  padding: 20px;
  min-height: 250px;
  background: #fafafa;
  position: relative;
}
</style>