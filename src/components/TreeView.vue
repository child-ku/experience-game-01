<template>
  <div class="tree-view-component">
    <div 
      v-for="(item, index) in items" 
      :key="index"
      class="tree-item"
    >
      <div class="tree-item-header" @click="toggleItem(item)">
        <span class="tree-indicator" :class="{ expanded: item.expanded }">
          {{ item.expanded ? '▼' : '▶' }}
        </span>
        
        <span v-if="item.type === 'object'" class="tree-icon object-icon">{}</span>
        <span v-else-if="item.type === 'array'" class="tree-icon array-icon">[]</span>
        
        <span v-if="item.key !== undefined" class="tree-key">{{ item.key }}:</span>
        
        <span v-if="item.type === 'string'" class="tree-value string-value">"{{ item.value }}"</span>
        <span v-else-if="item.type === 'number'" class="tree-value number-value">{{ item.value }}</span>
        <span v-else-if="item.type === 'boolean'" class="tree-value boolean-value">{{ item.value }}</span>
        <span v-else-if="item.type === 'null'" class="tree-value null-value">null</span>
      </div>
      
      <div 
        v-if="(item.type === 'object' || item.type === 'array') && item.expanded"
        class="tree-children"
        :style="{ marginLeft: `${marginLeft}px` }"
      >
        <TreeView 
          :data="item.children" 
          :level="level + 1" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: [Object, Array],
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const marginLeft = computed(() => (props.level + 1) * 20)
const items = ref([])

function processData(data, key = undefined) {
  const item = {}
  
  if (key !== undefined) {
    item.key = key
  }
  
  if (data === null) {
    item.type = 'null'
    item.value = null
  } else if (typeof data === 'string') {
    item.type = 'string'
    item.value = data
  } else if (typeof data === 'number') {
    item.type = 'number'
    item.value = data
  } else if (typeof data === 'boolean') {
    item.type = 'boolean'
    item.value = data
  } else if (Array.isArray(data)) {
    item.type = 'array'
    item.value = `[${data.length} items]`
    item.expanded = false
    item.children = data.map((child, index) => processData(child, index))
  } else if (typeof data === 'object') {
    item.type = 'object'
    const keys = Object.keys(data)
    item.value = `{${keys.length} items}`
    item.expanded = false
    item.children = keys.map(key => processData(data[key], key))
  }
  
  return item
}

function toggleItem(item) {
  if (item.type === 'object' || item.type === 'array') {
    item.expanded = !item.expanded
  }
}

function updateItems() {
  if (Array.isArray(props.data)) {
    items.value = props.data.map((item, index) => processData(item, index))
  } else if (typeof props.data === 'object' && props.data !== null) {
    const keys = Object.keys(props.data)
    items.value = keys.map(key => processData(props.data[key], key))
  } else {
    items.value = [processData(props.data)]
  }
}

watch(() => props.data, () => {
  updateItems()
}, { deep: true })

updateItems()
</script>

<style scoped>
.tree-view-component {
  width: 100%;
}

.tree-item {
  margin-bottom: 2px;
}

.tree-item-header {
  display: flex;
  align-items: center;
  padding: 4px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.tree-item-header:hover {
  background-color: rgba(79, 172, 254, 0.1);
}

.tree-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.tree-indicator.expanded {
  transform: rotate(0deg);
}

.tree-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: bold;
  border-radius: 4px;
  margin-right: 6px;
}

.object-icon {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.array-icon {
  background-color: rgba(255, 193, 7, 0.1);
  color: #FFC107;
}

.tree-key {
  font-weight: 600;
  color: #2196F3;
  margin-right: 6px;
}

.tree-value {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
}

.string-value {
  color: #F44336;
}

.number-value {
  color: #9C27B0;
}

.boolean-value {
  color: #00BCD4;
}

.null-value {
  color: #607D8B;
  font-style: italic;
}

.tree-children {
  border-left: 1px solid #e0e0e0;
  padding-left: 4px;
}
</style>
