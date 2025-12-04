<template>
  <div
    ref="nodeRef"
    class="workflow-node"
    :class="[
      `node-type-${node.type}`,
      { 'node-selected': isSelected }
    ]"
    :style="{
      left: node.x + 'px',
      top: node.y + 'px',
      width: node.width + 'px',
      height: node.height + 'px',
      backgroundColor: nodeColor,
      borderColor: borderColor
    }"
    @mousedown="onMouseDown"
    @click.stop="onClick"
  >
    <!-- 节点头部 -->
    <div class="node-header">
      <component :is="nodeIcon" class="node-icon" :style="{ color: iconColor }" />
      <span class="node-label">{{ node.label }}</span>
      <a-button
        type="text"
        size="small"
        class="delete-btn"
        @click.stop="onDelete"
      >
        <CloseOutlined />
      </a-button>
    </div>

    <!-- 节点内容 -->
    <div class="node-content" v-if="node.description">
      <span class="node-description">{{ node.description }}</span>
    </div>

    <!-- 连接点 -->
    <div class="connection-points">
      <!-- 输入连接点 -->
      <div
        class="connection-point input-point"
        :style="{ backgroundColor: connectionColor }"
        @mouseenter="onInputPointHover"
        @mouseleave="onInputPointLeave"
        @mousedown.stop="onInputPointMouseDown"
      ></div>
      <!-- 输出连接点 -->
      <div
        class="connection-point output-point"
        :style="{ backgroundColor: connectionColor }"
        @mouseenter="onOutputPointHover"
        @mouseleave="onOutputPointLeave"
        @mousedown.stop="onOutputPointMouseDown"
      ></div>
    </div>

    <!-- 调整大小手柄 -->
    <div
      class="resize-handle resize-right"
      @mousedown.stop="onResizeStart('right')"
    ></div>
    <div
      class="resize-handle resize-bottom"
      @mousedown.stop="onResizeStart('bottom')"
    ></div>
    <div
      class="resize-handle resize-corner"
      @mousedown.stop="onResizeStart('corner')"
    ></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { PlayCircleOutlined, CheckCircleOutlined, PlusOutlined, QuestionCircleOutlined, BranchesOutlined, FolderOpenOutlined, CloseOutlined } from '@ant-design/icons-vue'
import _ from 'lodash-es'

export default {
  name: 'WorkflowNode',
  components: {
    PlayCircleOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    BranchesOutlined,
    FolderOpenOutlined,
    CloseOutlined
  },
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['select', 'move', 'connect', 'delete'],
  setup(props, { emit }) {
    const isSelected = ref(false)
    const isDragging = ref(false)
    const isResizing = ref(false)
    const currentConnectionSource = ref(null)
    const nodeRef = ref(null)
    const isConnecting = ref(false)
    const resizeDirection = ref(null)
    const dragStartX = ref(0)
    const dragStartY = ref(0)
    const nodeStartX = ref(0)
    const nodeStartY = ref(0)
    const nodeStartWidth = ref(0)
    const nodeStartHeight = ref(0)
    const connectStartNode = ref(null)
    const tempConnection = ref(null)

    const nodeIcon = computed(() => {
      const iconMap = {
        start: 'PlayCircleOutlined',
        end: 'CheckCircleOutlined',
        task: 'PlusOutlined',
        decision: 'QuestionCircleOutlined',
        parallel: 'BranchesOutlined',
        subprocess: 'FolderOpenOutlined'
      }
      return iconMap[props.node.type] || 'PlusOutlined'
    })

    const nodeColor = computed(() => {
      const colorMap = {
        start: '#f6ffed',
        end: '#e6f7ff',
        task: '#fffbe6',
        decision: '#fff1f0',
        parallel: '#f9f0ff',
        subprocess: '#e6fffb'
      }
      return colorMap[props.node.type] || '#fff'
    })

    const borderColor = computed(() => {
      const colorMap = {
        start: '#b7eb8f',
        end: '#91d5ff',
        task: '#ffeeba',
        decision: '#ffccc7',
        parallel: '#e9d5ff',
        subprocess: '#87e8de'
      }
      return isSelected.value ? '#1890ff' : (colorMap[props.node.type] || '#d9d9d9')
    })

    const iconColor = computed(() => {
      const colorMap = {
        start: '#52c41a',
        end: '#1890ff',
        task: '#faad14',
        decision: '#f5222d',
        parallel: '#722ed1',
        subprocess: '#13c2c2'
      }
      return colorMap[props.node.type] || '#666'
    })

    const connectionColor = computed(() => {
      return isSelected.value ? '#1890ff' : '#91d5ff'
    })

    const onClick = () => {
      isSelected.value = true
      emit('select', props.node.id)
    }

    const onDelete = () => {
      emit('delete', props.node.id)
    }

    const onMouseDown = (event) => {
      // 防止点击连接点时触发拖动
      if (event.target.classList.contains('connection-point') || 
          event.target.closest('.connection-point')) {
        return
      }

      isDragging.value = true
      isSelected.value = true
      emit('select', props.node)

      dragStartX.value = event.clientX
      dragStartY.value = event.clientY
      nodeStartX.value = props.node.x
      nodeStartY.value = props.node.y

      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', onDragEnd)
    }

    const onDrag = (event) => {
      if (!isDragging.value) return

      const deltaX = event.clientX - dragStartX.value
      const deltaY = event.clientY - dragStartY.value
      const newX = Math.max(0, nodeStartX.value + deltaX)
      const newY = Math.max(0, nodeStartY.value + deltaY)

      emit('move', props.node.id, newX, newY)
    }

    const onDragEnd = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', onDragEnd)
    }

    const onResizeStart = (direction) => {
      isResizing.value = true
      resizeDirection.value = direction
      nodeStartX.value = props.node.x
      nodeStartY.value = props.node.y
      nodeStartWidth.value = props.node.width
      nodeStartHeight.value = props.node.height
      dragStartX.value = event.clientX
      dragStartY.value = event.clientY

      document.addEventListener('mousemove', onResize)
      document.addEventListener('mouseup', onResizeEnd)
    }

    const onResize = (event) => {
      if (!isResizing.value) return

      const deltaX = event.clientX - dragStartX.value
      const deltaY = event.clientY - dragStartY.value
      let newWidth = nodeStartWidth.value
      let newHeight = nodeStartHeight.value
      let newX = nodeStartX.value
      let newY = nodeStartY.value

      switch (resizeDirection.value) {
        case 'right':
          newWidth = Math.max(100, nodeStartWidth.value + deltaX)
          break
        case 'bottom':
          newHeight = Math.max(40, nodeStartHeight.value + deltaY)
          break
        case 'corner':
          newWidth = Math.max(100, nodeStartWidth.value + deltaX)
          newHeight = Math.max(40, nodeStartHeight.value + deltaY)
          break
      }

      props.node.width = newWidth
      props.node.height = newHeight
      if (newX !== nodeStartX.value || newY !== nodeStartY.value) {
        emit('move', props.node.id, newX, newY)
      }
    }

    const onResizeEnd = () => {
      isResizing.value = false
      resizeDirection.value = null
      document.removeEventListener('mousemove', onResize)
      document.removeEventListener('mouseup', onResizeEnd)
    }

    const onOutputPointMouseDown = (event) => {
      isConnecting.value = true
      connectStartNode.value = props.node
      dragStartX.value = event.clientX
      dragStartY.value = event.clientY

      // 创建临时连接线
      createTempConnection()

      document.addEventListener('mousemove', onConnectDrag)
      document.addEventListener('mouseup', onConnectEnd)
    }

    const onInputPointMouseDown = (event) => {
      // 可以在这里处理从输入点开始连接的逻辑
    }

    const createTempConnection = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'temp-connection')
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.style.position = 'fixed'
      svg.style.top = '0'
      svg.style.left = '0'
      svg.style.pointerEvents = 'none'
      svg.style.zIndex = '9999'

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', '#1890ff')
      path.setAttribute('stroke-width', '2')
      path.setAttribute('fill', 'none')
      path.setAttribute('marker-end', 'url(#temp-arrowhead)')

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
      marker.setAttribute('id', 'temp-arrowhead')
      marker.setAttribute('markerWidth', '10')
      marker.setAttribute('markerHeight', '7')
      marker.setAttribute('refX', '9')
      marker.setAttribute('refY', '3.5')
      marker.setAttribute('orient', 'auto')
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7')
      polygon.setAttribute('fill', '#1890ff')
      marker.appendChild(polygon)
      defs.appendChild(marker)

      svg.appendChild(defs)
      svg.appendChild(path)
      document.body.appendChild(svg)
      tempConnection.value = { svg, path }
    }

    const onConnectDrag = (event) => {
      if (!isConnecting.value || !tempConnection.value) return

      // 获取节点在画布中的绝对位置
      const nodeElement = document.querySelector(`[data-node-id="${connectStartNode.value.id}"]`)
      if (!nodeElement) return

      const canvasRect = document.querySelector('.workflow-canvas').getBoundingClientRect()
      const nodeRect = nodeElement.getBoundingClientRect()
      
      // 计算输出点的绝对位置（相对于画布）
      const sourceX = nodeRect.left - canvasRect.left + nodeRect.width
      const sourceY = nodeRect.top - canvasRect.top + nodeRect.height / 2
      
      // 目标位置为鼠标位置（相对于画布）
      const targetX = event.clientX - canvasRect.left
      const targetY = event.clientY - canvasRect.top

      const controlX = (sourceX + targetX) / 2
      const d = `M ${sourceX} ${sourceY} Q ${controlX} ${sourceY}, ${controlX} ${(sourceY + targetY) / 2} Q ${controlX} ${targetY}, ${targetX} ${targetY}`
      tempConnection.value.path.setAttribute('d', d)
    }

    const onConnectEnd = (event) => {
      if (!isConnecting.value) return

      // 清理临时连接线
      if (tempConnection.value) {
        document.body.removeChild(tempConnection.value.svg)
        tempConnection.value = null
      }

      // 检查是否连接到另一个节点的输入点
      const targetElement = event.target.closest('.workflow-node')
      if (targetElement && targetElement !== event.currentTarget) {
        const targetNodeId = targetElement.dataset.nodeId
        if (targetNodeId && targetNodeId !== connectStartNode.value.id) {
          // 获取源节点和目标节点在画布中的绝对位置
          const sourceNodeElement = document.querySelector(`[data-node-id="${connectStartNode.value.id}"]`)
          const targetNodeElement = document.querySelector(`[data-node-id="${targetNodeId}"]`)
          const canvasRect = document.querySelector('.workflow-canvas').getBoundingClientRect()
          
          if (sourceNodeElement && targetNodeElement) {
            const sourceRect = sourceNodeElement.getBoundingClientRect()
            const targetRect = targetNodeElement.getBoundingClientRect()
            
            // 计算输出点和输入点的绝对位置（相对于画布）
            const sourceX = sourceRect.left - canvasRect.left + sourceRect.width
            const sourceY = sourceRect.top - canvasRect.top + sourceRect.height / 2
            const targetX = targetRect.left - canvasRect.left
            const targetY = targetRect.top - canvasRect.top + targetRect.height / 2
            
            emit('connect', {
              source: connectStartNode.value.id,
              target: targetNodeId,
              sourceX,
              sourceY,
              targetX,
              targetY
            })
          }
        }
      }

      isConnecting.value = false
      connectStartNode.value = null
      document.removeEventListener('mousemove', onConnectDrag)
      document.removeEventListener('mouseup', onConnectEnd)
    }

    const onInputPointHover = (event) => {
      event.currentTarget.style.transform = 'scale(1.5)'
    }

    const onInputPointLeave = (event) => {
      event.currentTarget.style.transform = 'scale(1)'
    }

    const onOutputPointHover = (event) => {
      event.currentTarget.style.transform = 'scale(1.5)'
    }

    const onOutputPointLeave = (event) => {
      event.currentTarget.style.transform = 'scale(1)'
    }

    onMounted(() => {
      // 设置节点元素的 data-node-id 属性
      if (nodeRef.value) {
        nodeRef.value.setAttribute('data-node-id', props.node.id)
      }
    })

    onUnmounted(() => {
      // 清理事件监听器
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', onDragEnd)
      document.removeEventListener('mousemove', onResize)
      document.removeEventListener('mouseup', onResizeEnd)
      document.removeEventListener('mousemove', onConnectDrag)
      document.removeEventListener('mouseup', onConnectEnd)

      // 清理临时连接线
      if (tempConnection.value) {
        document.body.removeChild(tempConnection.value.svg)
      }
    })

    return {
      isSelected,
      nodeIcon,
      nodeColor,
      borderColor,
      iconColor,
      connectionColor,
      onClick,
      onDelete,
      onMouseDown,
      onDrag,
      onDragEnd,
      onResizeStart,
      onResize,
      onResizeEnd,
      onOutputPointMouseDown,
      onInputPointMouseDown,
      onInputPointHover,
      onInputPointLeave,
      onOutputPointHover,
      onOutputPointLeave
    }
  }
}
</script>

<style scoped>
.workflow-node {
  position: absolute;
  border: 2px solid;
  border-radius: 8px;
  background: #fff;
  cursor: move;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
  min-width: 100px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
}

.workflow-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.workflow-node.node-selected {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.15);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.node-icon {
  font-size: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s;
  padding: 0;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.workflow-node:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ff4d4f;
}

.node-content {
  padding: 8px 12px;
  flex: 1;
  overflow: hidden;
}

.node-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.connection-points {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #fff;
  pointer-events: all;
  cursor: crosshair;
  transition: all 0.3s;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.connection-point:hover {
  transform: scale(1.5);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.3);
}

.input-point {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.output-point {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.resize-handle {
  position: absolute;
  background: #1890ff;
  border: 2px solid #fff;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  cursor: nwse-resize;
  pointer-events: all;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.resize-right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.resize-bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.resize-corner {
  right: -6px;
  bottom: -6px;
  cursor: nwse-resize;
}

.resize-handle:hover {
  background: #40a9ff;
  transform: scale(1.2);
}

/* 节点类型特定样式 */
.node-type-start {
  border-radius: 50%;
  width: 60px !important;
  height: 60px !important;
  min-width: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-type-start .node-header {
  border: none;
  padding: 0;
  flex-direction: column;
}

.node-type-start .node-icon {
  font-size: 24px;
  margin-right: 0;
  margin-bottom: 4px;
}

.node-type-start .node-label {
  font-size: 12px;
  text-align: center;
}

.node-type-start .delete-btn {
  display: none;
}

.node-type-end {
  border-radius: 50%;
  width: 60px !important;
  height: 60px !important;
  min-width: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-type-end .node-header {
  border: none;
  padding: 0;
  flex-direction: column;
}

.node-type-end .node-icon {
  font-size: 24px;
  margin-right: 0;
  margin-bottom: 4px;
}

.node-type-end .node-label {
  font-size: 12px;
  text-align: center;
}

.node-type-end .delete-btn {
  display: none;
}

.node-type-decision {
  border-radius: 0;
  transform: rotate(45deg);
}

.node-type-decision .node-header {
  transform: rotate(-45deg);
}

.node-type-decision .node-content {
  transform: rotate(-45deg);
}

.node-type-parallel {
  border-style: dashed;
}

.node-type-subprocess {
  border-style: double;
  border-width: 4px;
}
</style>