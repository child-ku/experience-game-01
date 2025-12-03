<template>
  <div class="json-editor">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <h1 class="title">JSON可视化编辑器</h1>
      
      <div class="actions">
        <button 
          class="btn btn-primary" 
          @click="formatJSON"
          :disabled="!isValidJSON || formatting"
          :class="{ active: formatting }"
          title="格式化JSON">
          <span>{{ formatting ? '🔄 格式化中' : '🧹 格式化' }}</span>
        </button>
        <button 
          class="btn btn-secondary" 
          @click="compressJSON"
          :disabled="!isValidJSON || compressing"
          :class="{ active: compressing }"
          title="压缩JSON为单行">
          <span>{{ compressing ? '🔄 压缩中' : '🗜️ 压缩' }}</span>
        </button>
        <button 
          class="btn btn-secondary" 
          @click="clearJSON"
          title="清空内容">
          <span>🗑️ 清空</span>
        </button>
        <button 
          class="btn btn-secondary" 
          @click="copyJSON"
          :disabled="!isValidJSON"
          title="复制JSON">
          <span>📋 复制</span>
        </button>
      </div>

      <div class="mode-switch">
        <label class="switch-label">
          <input 
            type="checkbox" 
            v-model="isTreeMode"
            class="switch-input"
          >
          <span class="switch-slider"></span>
        </label>
        <span class="mode-text">{{ isTreeMode ? '树形模式' : '文本模式' }}</span>
      </div>
    </header>

    <!-- 统计信息面板 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总字符数:</span>
        <span class="stat-value">{{ stats.charCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">键值对数量:</span>
        <span class="stat-value">{{ stats.keyCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">JSON深度:</span>
        <span class="stat-value">{{ stats.depth }}</span>
      </div>
      <div class="stat-item status">
        <span class="stat-label">状态:</span>
        <span class="stat-value" :class="isValidJSON ? 'valid' : 'invalid'">
          {{ isValidJSON ? '✓ 格式正确' : '✗ 格式错误' }}
        </span>
      </div>
      <div v-if="errorMessage" class="stat-item error">
        <span class="stat-value error-text">{{ errorMessage }}</span>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <main class="editor-container">
      <!-- 文本编辑器模式 -->
      <div v-show="!isTreeMode" class="editor-wrapper">
        <MonacoEditor
          v-model="jsonContent"
          language="json"
          :options="editorOptions"
        />
      </div>

      <!-- 树形可视化模式 -->
      <div v-show="isTreeMode" class="tree-view-wrapper">
        <div v-if="isValidJSON" class="tree-view">
          <VueJsonPretty
          :data="parsedJSON"
          :show-expand-all="false"
          :show-search="true"
          :show-copy="true"
          @change="handleTreeChange"
        />
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">❌</div>
          <p class="empty-text">JSON格式错误，请切换到文本模式修正</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import MonacoEditor from './components/MonacoEditor.vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const jsonContent = ref(`{
  "name": "JSON可视化编辑器",
  "version": "1.0.0",
  "description": "基于Vue3 + Monaco Editor的JSON可视化工具",
  "features": [
    "语法高亮",
    "自动补全",
    "实时验证",
    "格式化/压缩",
    "树形可视化"
  ],
  "author": {
    "name": "开发者",
    "email": "dev@example.com"
  },
  "settings": {
    "theme": "light",
    "autoSave": true,
    "fontSize": 14
  }
}`)

const isTreeMode = ref(false)
const isValidJSON = ref(true)
const errorMessage = ref('')
const parsedJSON = ref({})
const formatting = ref(false)
const compressing = ref(false)

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  formatOnType: true,
  tabSize: 2
}

// 解析JSON并验证格式
const parseAndValidate = (content) => {
  try {
    if (!content.trim()) {
      isValidJSON.value = false
      errorMessage.value = '内容不能为空'
      parsedJSON.value = {}
      return
    }
    
    const parsed = JSON.parse(content)
    isValidJSON.value = true
    errorMessage.value = ''
    parsedJSON.value = parsed
    return parsed
  } catch (e) {
    isValidJSON.value = false
    errorMessage.value = `解析错误: ${e.message}`
    parsedJSON.value = {}
    return null
  }
}

// 处理编辑器内容变化
const handleEditorChange = (value) => {
  parseAndValidate(value)
}

// 处理树形视图变化
const handleTreeChange = (data) => {
  jsonContent.value = JSON.stringify(data, null, 2)
}

// 格式化JSON
const formatJSON = async () => {
  formatting.value = true
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed, null, 2)
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (e) {
    errorMessage.value = `格式化失败: ${e.message}`
  } finally {
    formatting.value = false
  }
}

// 压缩JSON
const compressJSON = async () => {
  compressing.value = true
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed)
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (e) {
    errorMessage.value = `压缩失败: ${e.message}`
  } finally {
    compressing.value = false
  }
}

// 清空JSON
const clearJSON = () => {
  jsonContent.value = ''
  isValidJSON.value = false
  errorMessage.value = ''
  parsedJSON.value = {}
}

// 复制JSON
const copyJSON = async () => {
  try {
    await navigator.clipboard.writeText(jsonContent.value)
    alert('已复制到剪贴板')
  } catch (e) {
    errorMessage.value = `复制失败: ${e.message}`
  }
}

// 统计信息计算
const stats = computed(() => {
  const stats = {
    charCount: jsonContent.value.length,
    keyCount: 0,
    depth: 0
  }

  if (isValidJSON.value) {
    // 计算键值对数量
    const countKeys = (obj, currentDepth = 1) => {
      stats.depth = Math.max(stats.depth, currentDepth)
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          stats.keyCount++
          countKeys(obj[key], currentDepth + 1)
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(item => countKeys(item, currentDepth + 1))
      }
    }
    countKeys(parsedJSON.value)
  }

  return stats
})

// 初始化解析
parseAndValidate(jsonContent.value)

// 监听内容变化
watch(jsonContent, (newValue) => {
  parseAndValidate(newValue)
})
</script>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  gap: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary.active {
  background-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn-secondary {
  background-color: #f1f5f9;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-secondary.active {
  background-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.switch-label {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.2s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.switch-input:checked + .switch-slider {
  background-color: var(--primary-color);
}

.switch-input:checked + .switch-slider:before {
  transform: translateX(24px);
}

.mode-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.stats-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem 2rem;
  gap: 2rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  color: var(--text-color);
}

.stat-value.valid {
  color: var(--success-color);
}

.stat-value.invalid {
  color: var(--error-color);
}

.error-text {
  color: var(--error-color);
  font-weight: 400;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor-wrapper {
  width: 100%;
  height: 100%;
}

.tree-view-wrapper {
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow: auto;
  background: var(--card-bg);
}

.tree-view {
  width: 100%;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
}

.empty-text {
  font-size: 1.125rem;
}
</style>
