<template>
  <div class="workflow-designer-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <a-space size="middle">
        <a-button type="primary" @click="newWorkflow">新建</a-button>
        <a-button type="primary" @click="saveWorkflow">保存</a-button>
        <a-button @click="exportWorkflow">导出</a-button>
        <a-button @click="importWorkflow">导入</a-button>
        <a-divider type="vertical" />
        <a-button @click="zoomIn">放大</a-button>
        <a-button @click="zoomOut">缩小</a-button>
        <a-button @click="resetZoom">重置</a-button>
        <a-divider type="vertical" />
        <a-button @click="toggleGrid">
          {{ showGrid ? '隐藏网格' : '显示网格' }}
        </a-button>
        <a-button @click="toggleRuler">
          {{ showRuler ? '隐藏标尺' : '显示标尺' }}
        </a-button>
      </a-space>
    </div>

    <div class="designer-content">
      <!-- 左侧节点库 -->
      <div class="node-library">
        <a-collapse v-model:activeKey="activeNodeCategories" :bordered="false">
          <a-collapse-panel key="basic" header="基础节点">
            <div class="node-item" v-for="node in basicNodes" :key="node.type" draggable="true" @dragstart="onDragStart($event, node)">
              <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
              <span>{{ node.label }}</span>
            </div>
          </a-collapse-panel>
          <a-collapse-panel key="advanced" header="高级节点">
            <div class="node-item" v-for="node in advancedNodes" :key="node.type" draggable="true" @dragstart="onDragStart($event, node)">
              <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
              <span>{{ node.label }}</span>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-container" ref="canvasContainer" @drop="onDrop" @dragover="onDragOver">
        <!-- 标尺 -->
        <div class="ruler-container" v-if="showRuler">
          <div class="ruler ruler-top">
            <div v-for="pos in generateRulerMarks()" :key="pos" class="ruler-mark" :style="{ left: pos + 'px' }">
              <div class="ruler-tick"></div>
              <span class="ruler-label">{{ pos }}</span>
            </div>
          </div>
          <div class="ruler ruler-left">
            <div v-for="pos in generateRulerMarks()" :key="pos" class="ruler-mark" :style="{ top: pos + 'px' }">
              <div class="ruler-tick"></div>
              <span class="ruler-label">{{ pos }}</span>
            </div>
          </div>
        </div>

        <!-- 画布 -->
        <div class="canvas" ref="canvas" :style="canvasStyle">
          <!-- 网格背景 -->
          <div class="grid-background" v-if="showGrid"></div>

          <!-- 泳道 -->
          <div class="swimlanes" v-if="swimlanes.length > 0">
            <div class="swimlane" v-for="lane in swimlanes" :key="lane.id" :style="{ width: lane.width + '%' }">
              <div class="swimlane-header">{{ lane.name }}</div>
              <div class="swimlane-content"></div>
            </div>
          </div>

          <!-- 节点 -->
      <div 
        v-for="node in nodes" 
        :key="node.id"
        class="workflow-node-wrapper"
        :style="{
          position: 'absolute',
          left: node.x + 'px',
          top: node.y + 'px',
          zIndex: selectedNode?.id === node.id ? 100 : 10
        }"
      >
        <WorkflowNode
          :node="node"
          :selected="selectedNode?.id === node.id"
          @select="onNodeSelect"
          @move="onNodeMove"
          @connect="onNodeConnect"
          @delete="onNodeDelete"
        />
        
        <!-- 子流程内部节点 -->
        <div 
          v-if="node.type === 'subprocess' && node.children"
          class="subprocess-content"
          :style="{
            position: 'absolute',
            left: '20px',
            top: '60px',
            right: '20px',
            bottom: '20px',
            overflow: 'hidden',
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px dashed #d9d9d9',
            border-radius: '4px'
          }"
          @dragover.prevent
          @drop="(e) => handleSubprocessDrop(e, node)"
        >
          <div 
            v-for="childNode in node.children" 
            :key="childNode.id"
            class="workflow-node-wrapper"
            :style="{
              position: 'absolute',
              left: childNode.x + 'px',
              top: childNode.y + 'px',
              zIndex: selectedNode?.id === childNode.id ? 100 : 10
            }"
          >
            <WorkflowNode
              :node="childNode"
              :selected="selectedNode?.id === childNode.id"
              @select="onNodeSelect"
              @move="onNodeMove"
              @connect="onNodeConnect"
              @delete="onNodeDelete"
            />
          </div>
        </div>
      </div>

          <!-- 连接线 -->
          <svg class="connections" :width="canvasWidth" :height="canvasHeight">
            <g>
              <path
                v-for="edge in edges"
                :key="edge.id"
                :d="getEdgePath(edge)"
                stroke="#1890ff"
                stroke-width="2"
                fill="none"
                marker-end="url(#arrowhead)"
              />
            </g>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <a-card title="属性设置" :bordered="false" class="property-card">
          <div v-if="selectedNode" class="node-properties">
            <a-form layout="vertical">
              <a-form-item label="节点名称">
                <a-input v-model:value="selectedNode.label" placeholder="输入节点名称" />
              </a-form-item>
              <a-form-item label="节点类型">
                <a-tag :color="getNodeColor(selectedNode.type)">{{ getNodeLabel(selectedNode.type) }}</a-tag>
              </a-form-item>
              <a-form-item label="描述">
                <a-textarea v-model:value="selectedNode.description" placeholder="输入节点描述" :rows="3" />
              </a-form-item>
              <a-form-item label="位置">
                <a-space>
                  <a-input-number v-model:value="selectedNode.x" :min="0" placeholder="X" style="width: 80px" />
                  <a-input-number v-model:value="selectedNode.y" :min="0" placeholder="Y" style="width: 80px" />
                </a-space>
              </a-form-item>
            </a-form>
          </div>
          <div v-else class="no-selection">请选择一个节点</div>
        </a-card>

        <a-card title="泳道管理" :bordered="false" class="property-card" style="margin-top: 16px">
          <a-space direction="vertical" style="width: 100%">
            <a-input v-model:value="newSwimlaneName" placeholder="泳道名称" style="margin-bottom: 8px" />
            <a-button type="primary" block @click="addSwimlane" :disabled="!newSwimlaneName.trim()">
              添加泳道
            </a-button>
            <div v-for="lane in swimlanes" :key="lane.id" class="swimlane-item">
              <a-space style="width: 100%" align="center">
                <span style="flex: 1">{{ lane.name }}</span>
                <a-button type="text" danger @click="removeSwimlane(lane.id)">
                  删除
                </a-button>
              </a-space>
            </div>
          </a-space>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import WorkflowNode from './WorkflowNode.vue'
import { PlusOutlined, CloseOutlined, PlayCircleOutlined, CheckCircleOutlined, QuestionCircleOutlined, BranchesOutlined, FolderOpenOutlined } from '@ant-design/icons-vue'
import _ from 'lodash-es'

export default {
  name: 'WorkflowDesigner',
  components: {
    WorkflowNode,
    PlusOutlined,
    CloseOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
    BranchesOutlined,
    FolderOpenOutlined
  },
  setup() {
    const canvasContainer = ref(null)
    const canvas = ref(null)
    const nodes = ref([])
    const edges = ref([])
    const swimlanes = ref([])
    const selectedNode = ref(null)
    const showGrid = ref(true)
    const showRuler = ref(true)
    const zoom = ref(1)
    const canvasWidth = ref(2000)
    const canvasHeight = ref(1500)
    const activeNodeCategories = ref(['basic'])
    const newSwimlaneName = ref('')
    let nodeIdCounter = 1
    let edgeIdCounter = 1
    let swimlaneIdCounter = 1

    const basicNodes = [
      { type: 'start', label: '开始', icon: 'PlayCircleOutlined', color: '#52c41a' },
      { type: 'end', label: '结束', icon: 'CheckCircleOutlined', color: '#1890ff' },
      { type: 'task', label: '任务', icon: 'PlusOutlined', color: '#faad14' },
      { type: 'decision', label: '决策', icon: 'QuestionCircleOutlined', color: '#f5222d' }
    ]

    const advancedNodes = [
      { type: 'parallel', label: '并行', icon: 'BranchesOutlined', color: '#722ed1' },
      { type: 'subprocess', label: '子流程', icon: 'FolderOpenOutlined', color: '#13c2c2' }
    ]

    const canvasStyle = computed(() => ({
      transform: `scale(${zoom.value})`,
      transformOrigin: 'top left',
      width: canvasWidth.value + 'px',
      height: canvasHeight.value + 'px'
    }))

    const onDragStart = (event, nodeType) => {
      event.dataTransfer.setData('nodeType', JSON.stringify(nodeType))
    }

    const onDragOver = (event) => {
      event.preventDefault()
    }

    const onDrop = (event) => {
      event.preventDefault()
      const nodeType = JSON.parse(event.dataTransfer.getData('nodeType'))
      const rect = canvasContainer.value.getBoundingClientRect()
      const x = event.clientX - rect.left - 75 // 节点宽度的一半
      const y = event.clientY - rect.top - 30 // 节点高度的一半
      const canvasX = x / zoom.value
      const canvasY = y / zoom.value

      const newNode = {
        id: `node_${nodeIdCounter++}`,
        type: nodeType.type,
        label: nodeType.label,
        x: canvasX,
        y: canvasY,
        width: 150,
        height: 60,
        description: '',
        properties: {},
        parentId: null
      }

      nodes.value.push(newNode)
    }

    const handleSubprocessDrop = (event, parentNode) => {
      event.preventDefault()
      const nodeType = JSON.parse(event.dataTransfer.getData('nodeType'))
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left - 75 // 节点宽度的一半
      const y = event.clientY - rect.top - 30 // 节点高度的一半
      const canvasX = x / zoom.value
      const canvasY = y / zoom.value

      // 限制节点在子流程内部
      const maxX = parentNode.width - 40 - 150 // 20px padding on each side + node width
      const maxY = parentNode.height - 80 - 60 // 60px header + 20px padding + node height
      const constrainedX = Math.max(0, Math.min(canvasX, maxX))
      const constrainedY = Math.max(0, Math.min(canvasY, maxY))

      const newNode = {
        id: `node_${nodeIdCounter++}`,
        type: nodeType.type,
        label: nodeType.label,
        x: constrainedX,
        y: constrainedY,
        width: 150,
        height: 60,
        description: '',
        properties: {},
        parentId: parentNode.id
      }

      if (!parentNode.children) {
        parentNode.children = []
      }
      parentNode.children.push(newNode)
    }

    const onNodeSelect = (nodeId) => {
      // 查找节点（包括子流程内部节点）
      let node = nodes.value.find(n => n.id === nodeId)
      
      if (!node) {
        // 在子流程内部查找
        for (const parent of nodes.value) {
          if (parent.children) {
            node = parent.children.find(n => n.id === nodeId)
            if (node) {
              break
            }
          }
        }
      }
      
      selectedNode.value = node || null
    }

    const onNodeMove = (nodeId, x, y) => {
      // 查找节点（包括子流程内部节点）
      let node = nodes.value.find(n => n.id === nodeId)
      let parentNode = null
      
      if (!node) {
        // 在子流程内部查找
        for (const parent of nodes.value) {
          if (parent.children) {
            node = parent.children.find(n => n.id === nodeId)
            if (node) {
              parentNode = parent
              break
            }
          }
        }
      }
      
      if (node) {
        if (parentNode) {
          // 子流程内部节点移动，限制在子流程范围内
          const maxX = parentNode.width - 40 - node.width
          const maxY = parentNode.height - 80 - node.height
          node.x = Math.max(0, Math.min(x, maxX))
          node.y = Math.max(0, Math.min(y, maxY))
        } else {
          // 普通节点移动
          node.x = x
          node.y = y
        }
      }
    }

    const onNodeConnect = (sourceNodeId, targetNodeId) => {
      const newEdge = {
        id: `edge_${edgeIdCounter++}`,
        source: sourceNodeId,
        target: targetNodeId
      }
      edges.value.push(newEdge)
    }

    const onNodeDelete = (nodeId) => {
      // 删除节点（包括子流程内部节点）
      let nodeDeleted = false
      
      // 先在顶层节点中查找
      const topIndex = nodes.value.findIndex(n => n.id === nodeId)
      if (topIndex !== -1) {
        nodes.value.splice(topIndex, 1)
        nodeDeleted = true
      } else {
        // 在子流程内部查找
        for (const parent of nodes.value) {
          if (parent.children) {
            const childIndex = parent.children.findIndex(n => n.id === nodeId)
            if (childIndex !== -1) {
              parent.children.splice(childIndex, 1)
              nodeDeleted = true
              break
            }
          }
        }
      }
      
      if (nodeDeleted) {
        // 删除相关的连接线
        edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
        // 清除选择
        if (selectedNode.value?.id === nodeId) {
          selectedNode.value = null
        }
      }
    }

    const getEdgePath = (edge) => {
      const source = nodes.value.find(n => n.id === edge.source)
      const target = nodes.value.find(n => n.id === edge.target)
      if (!source || !target) return ''

      const sourceX = source.x + source.width
      const sourceY = source.y + source.height / 2
      const targetX = target.x
      const targetY = target.y + target.height / 2

      const controlX = (sourceX + targetX) / 2

      return `M ${sourceX} ${sourceY} Q ${controlX} ${sourceY}, ${controlX} ${(sourceY + targetY) / 2} Q ${controlX} ${targetY}, ${targetX} ${targetY}`
    }

    const getNodeColor = (type) => {
      const node = [...basicNodes, ...advancedNodes].find(n => n.type === type)
      return node?.color || '#666'
    }

    const getNodeLabel = (type) => {
      const node = [...basicNodes, ...advancedNodes].find(n => n.type === type)
      return node?.label || type
    }

    const generateRulerMarks = () => {
      return Array.from({ length: 20 }, (_, i) => i * 100)
    }

    const zoomIn = () => {
      zoom.value = Math.min(zoom.value + 0.1, 2)
    }

    const zoomOut = () => {
      zoom.value = Math.max(zoom.value - 0.1, 0.5)
    }

    const resetZoom = () => {
      zoom.value = 1
    }

    const toggleGrid = () => {
      showGrid.value = !showGrid.value
    }

    const toggleRuler = () => {
      showRuler.value = !showRuler.value
    }

    const addSwimlane = () => {
      if (!newSwimlaneName.value.trim()) return
      const newLane = {
        id: `lane_${swimlaneIdCounter++}`,
        name: newSwimlaneName.value.trim(),
        width: 100 / (swimlanes.value.length + 1)
      }
      swimlanes.value.push(newLane)
      // 重新计算所有泳道宽度
      swimlanes.value.forEach(lane => {
        lane.width = 100 / swimlanes.value.length
      })
      newSwimlaneName.value = ''
    }

    const removeSwimlane = (laneId) => {
      if (swimlanes.value.length <= 1) return
      swimlanes.value = swimlanes.value.filter(lane => lane.id !== laneId)
      swimlanes.value.forEach(lane => {
        lane.width = 100 / swimlanes.value.length
      })
    }

    const saveWorkflow = () => {
      const workflow = {
        nodes: nodes.value,
        edges: edges.value,
        swimlanes: swimlanes.value,
        version: '1.0'
      }
      localStorage.setItem('workflow', JSON.stringify(workflow))
      alert('工作流已保存到本地存储')
    }

    const exportWorkflow = () => {
      const workflow = {
        nodes: nodes.value,
        edges: edges.value,
        swimlanes: swimlanes.value,
        version: '1.0'
      }
      const dataStr = JSON.stringify(workflow, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workflow_${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    }

    const newWorkflow = () => {
      if (confirm('确定要新建工作流吗？当前未保存的内容将丢失。')) {
        nodes.value = []
        edges.value = []
        swimlanes.value = []
        selectedNode.value = null
        nodeIdCounter = 1
        edgeIdCounter = 1
        swimlaneIdCounter = 1
        // 添加默认的开始节点
        const startNode = {
          id: `node_${nodeIdCounter++}`,
          type: 'start',
          label: '开始',
          x: 100,
          y: 100,
          width: 60,
          height: 60,
          description: '',
          properties: {}
        }
        nodes.value.push(startNode)
      }
    }

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
              edges.value = workflow.edges || []
              swimlanes.value = workflow.swimlanes || []
              // 更新计数器
              nodeIdCounter = Math.max(...nodes.value.map(n => parseInt(n.id.split('_')[1]) || 0), 0) + 1
              edgeIdCounter = Math.max(...edges.value.map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1
              swimlaneIdCounter = Math.max(...swimlanes.value.map(l => parseInt(l.id.split('_')[1]) || 0), 0) + 1
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

    onMounted(() => {
      // 从本地存储加载工作流
      const savedWorkflow = localStorage.getItem('workflow')
      if (savedWorkflow) {
        try {
          const workflow = JSON.parse(savedWorkflow)
          nodes.value = workflow.nodes || []
          edges.value = workflow.edges || []
          swimlanes.value = workflow.swimlanes || []
          nodeIdCounter = Math.max(...nodes.value.map(n => parseInt(n.id.split('_')[1]) || 0), 0) + 1
          edgeIdCounter = Math.max(...edges.value.map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1
          swimlaneIdCounter = Math.max(...swimlanes.value.map(l => parseInt(l.id.split('_')[1]) || 0), 0) + 1
        } catch (error) {
          console.error('Failed to load saved workflow:', error)
        }
      }
    })

    return {
      canvasContainer,
      canvas,
      nodes,
      edges,
      swimlanes,
      selectedNode,
      showGrid,
      showRuler,
      zoom,
      canvasWidth,
      canvasHeight,
      activeNodeCategories,
      newSwimlaneName,
      basicNodes,
      advancedNodes,
      canvasStyle,
      onDragStart,
      onDragOver,
      onDrop,
      handleSubprocessDrop,
      onNodeSelect,
      onNodeMove,
      onNodeConnect,
      onNodeDelete,
      getEdgePath,
      getNodeColor,
      getNodeLabel,
      generateRulerMarks,
      zoomIn,
      zoomOut,
      resetZoom,
      toggleGrid,
      toggleRuler,
      addSwimlane,
      removeSwimlane,
      newWorkflow,
      saveWorkflow,
      exportWorkflow,
      importWorkflow
    }
  }
}
</script>

<style scoped>
.workflow-designer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f0f2f5;
}

.toolbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  z-index: 100;
}

.designer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.node-library {
  width: 250px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
}

.node-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: translateX(4px);
}

.node-icon {
  font-size: 20px;
  margin-right: 10px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #fafafa;
}

.ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none;
}

.ruler {
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  position: relative;
}

.ruler-top {
  height: 20px;
  width: 100%;
  margin-left: 20px;
}

.ruler-left {
  width: 20px;
  height: 100%;
  margin-top: 20px;
}

.ruler-mark {
  position: absolute;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ruler-tick {
  width: 1px;
  height: 100%;
  background: #999;
}

.ruler-label {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.canvas {
  position: relative;
  background: #fff;
  margin: 20px 0 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

.swimlanes {
  display: flex;
  height: 100%;
}

.swimlane {
  height: 100%;
  border-right: 1px solid #e8e8e8;
  position: relative;
}

.swimlane:last-child {
  border-right: none;
}

.swimlane-header {
  height: 40px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 500;
  color: #333;
}

.swimlane-content {
  flex: 1;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
}

.property-panel {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.property-card {
  margin-bottom: 16px;
}

.node-properties {
  padding: 8px 0;
}

.no-selection {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.swimlane-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.swimlane-item:last-child {
  border-bottom: none;
}
</style>