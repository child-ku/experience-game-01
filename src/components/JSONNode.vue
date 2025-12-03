<template>
  <div class="json-node" :class="nodeClass">
    <span v-if="isString" class="string-value">"{{ data }}"</span>
    <span v-else-if="isNumber" class="number-value">{{ data }}</span>
    <span v-else-if="isBoolean" class="boolean-value">{{ data }}</span>
    <span v-else-if="isNull" class="null-value">null</span>
    <!-- 对于 Object 和 Array，递归显示它们的结构 -->
    <div v-else-if="isObject" class="object-content">
      <div class="object-header">
        <span class="expand-icon" :class="{ 'expanded': expanded }" @click="toggleExpand">
          {{ expanded ? '▼' : '▶' }}
        </span>
        <span class="object-type">Object</span>
        <span class="object-size">({{ Object.keys(data).length }} items)</span>
      </div>
      <div v-if="expanded" class="object-children">
        <div 
          v-for="(value, key) in data" 
          :key="key" 
          class="object-property"
        >
          <span class="property-key">"{{ key }}"</span>
          <span class="property-separator">:</span>
          <JSONNode :data="value" :path="`${path}.${key}`" /> 
        </div>
      </div>
    </div>
    <div v-else-if="isArray" class="array-content">
      <div class="array-header">
        <span class="expand-icon" :class="{ 'expanded': expanded }" @click="toggleExpand">
          {{ expanded ? '▼' : '▶' }}
        </span>
        <span class="array-type">Array</span>
        <span class="array-size">({{ data.length }} items)</span>
      </div>
      <div v-if="expanded" class="array-children">
        <div 
          v-for="(value, index) in data" 
          :key="index" 
          class="array-item"
        >
          <span class="item-index">{{ index }}:</span>
          <JSONNode :data="value" :path="`${path}[${index}]`" /> 
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean, null],
    default: null
  },
  path: {
    type: String,
    default: 'root'
  }
})

const expanded = ref(true)

const isString = computed(() => typeof props.data === 'string')
const isNumber = computed(() => typeof props.data === 'number')
const isBoolean = computed(() => typeof props.data === 'boolean')
const isNull = computed(() => props.data === null)
const isObject = computed(() => {
  return typeof props.data === 'object' && props.data !== null && !Array.isArray(props.data)
})
const isArray = computed(() => Array.isArray(props.data))

const nodeClass = computed(() => {
  if (isString.value) return 'string-node'
  if (isNumber.value) return 'number-node'
  if (isBoolean.value) return 'boolean-node'
  if (isNull.value) return 'null-node'
  if (isObject.value) return 'object-node'
  if (isArray.value) return 'array-node'
  return ''
})

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.json-node {
  display: inline-block;
  padding: 2px 0;
}

.string-node .string-value {
  color: #ce9178;
}

.number-node .number-value {
  color: #b5cea8;
}

.boolean-node .boolean-value {
  color: #569cd6;
}

.null-node .null-value {
  color: #569cd6;
}

.object-node .object-type,
.array-node .array-type {
  color: #dcdcaa;
  font-weight: bold;
}

.object-content,
.array-content {
  display: flex;
  flex-direction: column;
  margin-left: 0;
}

.object-header,
.array-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.object-header:hover,
.array-header:hover {
  background-color: #2d2d30;
}

.expand-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 12px;
  color: #6a9955;
  margin-right: 5px;
}

.object-size,
.array-size {
  color: #808080;
  font-size: 12px;
  margin-left: 5px;
}

.object-children,
.array-children {
  margin-left: 20px;
  padding-left: 5px;
  border-left: 1px solid #3e3e42;
}

.object-property,
.array-item {
  display: flex;
  align-items: flex-start;
  margin: 2px 0;
}

.property-key {
  color: #9cdcfe;
  margin-right: 5px;
}

.property-separator {
  color: #d4d4d4;
  margin-right: 5px;
}

.item-index {
  color: #6a9955;
  margin-right: 5px;
}
</style>
