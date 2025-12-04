<template>
  <div class="node-library">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false">
      <!-- 开始/结束节点 -->
      <a-collapse-panel key="1" header="开始/结束">
        <div 
          class="node-item" 
          v-for="node in startEndNodes" 
          :key="node.type"
          draggable="true"
          @dragstart="handleDragStart($event, node)"
        >
          <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
          <span>{{ node.label }}</span>
        </div>
      </a-collapse-panel>

      <!-- 任务节点 -->
      <a-collapse-panel key="2" header="任务">
        <div 
          class="node-item" 
          v-for="node in taskNodes" 
          :key="node.type"
          draggable="true"
          @dragstart="handleDragStart($event, node)"
        >
          <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
          <span>{{ node.label }}</span>
        </div>
      </a-collapse-panel>

      <!-- 决策节点 -->
      <a-collapse-panel key="3" header="决策">
        <div 
          class="node-item" 
          v-for="node in decisionNodes" 
          :key="node.type"
          draggable="true"
          @dragstart="handleDragStart($event, node)"
        >
          <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
          <span>{{ node.label }}</span>
        </div>
      </a-collapse-panel>

      <!-- 并行节点 -->
      <a-collapse-panel key="4" header="并行">
        <div 
          class="node-item" 
          v-for="node in parallelNodes" 
          :key="node.type"
          draggable="true"
          @dragstart="handleDragStart($event, node)"
        >
          <component :is="node.icon" class="node-icon" :style="{ color: node.color }" />
          <span>{{ node.label }}</span>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  PlayCircleOutlined,
  StopOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'

const emit = defineEmits(['node-drag-start'])

const activeKeys = ref(['1', '2', '3', '4'])

// 开始/结束节点
const startEndNodes = [
  { type: 'start', label: '开始', icon: PlayCircleOutlined, color: '#52c41a' },
  { type: 'end', label: '结束', icon: StopOutlined, color: '#ff4d4f' }
]

// 任务节点
const taskNodes = [
  { type: 'task', label: '任务', icon: SolutionOutlined, color: '#1890ff' },
  { type: 'approval', label: '审批', icon: CheckCircleOutlined, color: '#52c41a' },
  { type: 'reject', label: '拒绝', icon: CloseCircleOutlined, color: '#ff4d4f' }
]

// 决策节点
const decisionNodes = [
  { type: 'decision', label: '决策', icon: BranchesOutlined, color: '#faad14' },
  { type: 'condition', label: '条件', icon: BranchesOutlined, color: '#fa8c16' }
]

// 并行节点
const parallelNodes = [
  { type: 'parallel', label: '并行', icon: SyncOutlined, color: '#722ed1' },
  { type: 'fork', label: '分叉', icon: SyncOutlined, color: '#eb2f96' },
  { type: 'join', label: '合并', icon: SyncOutlined, color: '#13c2c2' }
]

const handleDragStart = (event, node) => {
  // 阻止默认行为
  event.preventDefault()
  
  // 设置拖拽数据
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('text/plain', JSON.stringify(node))
  event.dataTransfer.setData('application/json', JSON.stringify(node))
  
  // 设置拖拽图像（可选）
  const dragImage = document.createElement('div')
  dragImage.textContent = node.label
  dragImage.style.padding = '8px 12px'
  dragImage.style.background = node.color
  dragImage.style.color = 'white'
  dragImage.style.borderRadius = '4px'
  dragImage.style.fontSize = '14px'
  document.body.appendChild(dragImage)
  
  event.dataTransfer.setDragImage(dragImage, 0, 0)
  
  // 延迟移除拖拽图像
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
  
  emit('node-drag-start', node)
}
</script>

<style scoped>
.node-library {
  padding: 16px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-icon {
  font-size: 20px;
  margin-right: 8px;
}

:deep(.ant-collapse) {
  background: transparent;
}

:deep(.ant-collapse-item) {
  border-bottom: 1px solid #e8e8e8;
}

:deep(.ant-collapse-header) {
  font-weight: 600;
  padding: 12px 0 !important;
}

:deep(.ant-collapse-content-box) {
  padding: 12px 0 !important;
}
</style>
