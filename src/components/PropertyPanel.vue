<template>
  <div class="property-panel">
    <a-card title="节点属性" :bordered="false" style="margin-bottom: 16px;">
      <div v-if="selectedNode" class="property-content">
        <!-- 节点ID -->
        <div class="property-item">
          <label class="property-label">节点ID:</label>
          <a-input :value="selectedNode.id" disabled />
        </div>

        <!-- 节点类型 -->
        <div class="property-item">
          <label class="property-label">节点类型:</label>
          <a-input :value="getNodeTypeLabel(selectedNode.shape)" disabled />
        </div>

        <!-- 节点标签 -->
        <div class="property-item">
          <label class="property-label">节点标签:</label>
          <a-input 
            v-model:value="nodeProperties.label" 
            placeholder="请输入节点标签"
            @change="handlePropertyChange"
          />
        </div>

        <!-- 填充颜色 -->
        <div class="property-item">
          <label class="property-label">填充颜色:</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a-color-picker 
              v-model:value="nodeProperties.fill" 
              show-text
              @change="handlePropertyChange"
            />
            <span>{{ nodeProperties.fill }}</span>
          </div>
        </div>

        <!-- 边框颜色 -->
        <div class="property-item">
          <label class="property-label">边框颜色:</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a-color-picker 
              v-model:value="nodeProperties.stroke" 
              show-text
              @change="handlePropertyChange"
            />
            <span>{{ nodeProperties.stroke }}</span>
          </div>
        </div>

        <!-- 节点宽度 -->
        <div class="property-item">
          <label class="property-label">节点宽度:</label>
          <a-input-number 
            v-model:value="nodeProperties.width" 
            :min="50" 
            :max="500" 
            @change="handlePropertyChange"
          />
        </div>

        <!-- 节点高度 -->
        <div class="property-item">
          <label class="property-label">节点高度:</label>
          <a-input-number 
            v-model:value="nodeProperties.height" 
            :min="30" 
            :max="300" 
            @change="handlePropertyChange"
          />
        </div>
      </div>

      <div v-else class="no-selection">
        <a-empty description="请选择一个节点查看属性" />
      </div>
    </a-card>

    <a-card title="连接线属性" :bordered="false">
      <div class="connection-properties">
        <div class="property-item">
          <label class="property-label">线条颜色:</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a-color-picker v-model:value="edgeProperties.color" show-text />
            <span>{{ edgeProperties.color }}</span>
          </div>
        </div>

        <div class="property-item">
          <label class="property-label">线条宽度:</label>
          <a-input-number 
            v-model:value="edgeProperties.width" 
            :min="1" 
            :max="10" 
          />
        </div>

        <div class="property-item">
          <label class="property-label">箭头类型:</label>
          <a-select v-model:value="edgeProperties.arrowType">
            <a-select-option value="classic">经典箭头</a-select-option>
            <a-select-option value="block">方块箭头</a-select-option>
            <a-select-option value="diamond">菱形箭头</a-select-option>
          </a-select>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  selectedNode: Object
})

const emit = defineEmits(['update-node'])

const nodeProperties = ref({
  label: '',
  fill: '',
  stroke: '',
  width: 120,
  height: 60
})

const edgeProperties = ref({
  color: '#5F95FF',
  width: 2,
  arrowType: 'classic'
})

// 监听选中节点变化
watch(() => props.selectedNode, (newNode) => {
  if (newNode) {
    // 从节点对象中获取属性
    nodeProperties.value.label = newNode.attrs?.label?.text || ''
    nodeProperties.value.fill = newNode.attrs?.body?.fill || ''
    nodeProperties.value.stroke = newNode.attrs?.body?.stroke || ''
    nodeProperties.value.width = newNode.size?.width || 120
    nodeProperties.value.height = newNode.size?.height || 60
  }
}, { immediate: true, deep: true })

// 处理属性变化
const handlePropertyChange = () => {
  if (props.selectedNode) {
    emit('update-node', props.selectedNode.id, { ...nodeProperties.value })
  }
}

// 获取节点类型标签
const getNodeTypeLabel = (shape) => {
  const typeMap = {
    'circle': '圆形节点',
    'rect': '矩形节点',
    'diamond': '菱形节点'
  }
  return typeMap[shape] || '未知节点类型'
}
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.property-content {
  padding-top: 8px;
}

.property-item {
  margin-bottom: 16px;
}

.property-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #666;
}

.no-selection {
  padding: 40px 20px;
}

.connection-properties {
  padding-top: 8px;
}
</style>
