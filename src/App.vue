<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">JSON 数据可视化工具</h1>
    </header>

    <main class="app-main">
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 模式切换按钮 -->
        <div class="mode-switcher">
          <button 
            class="mode-btn" 
            :class="{ active: currentMode === 'text' }"
            @click="switchMode('text')"
          >
            <span class="btn-icon">📝</span>
            文本编辑
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: currentMode === 'tree' }"
            @click="switchMode('tree')"
            :disabled="!isValid"
          >
            <span class="btn-icon">🌳</span>
            树形可视化
          </button>
        </div>

        <div class="tool-separator"></div>

        <button class="tool-btn" @click="formatJSON" :disabled="!isValid">
          <span class="btn-icon">✨</span>
          格式化
        </button>
        <button class="tool-btn" @click="compressJSON" :disabled="!isValid">
          <span class="btn-icon">📦</span>
          压缩
        </button>
        <button class="tool-btn" @click="clearJSON">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>

      <!-- 主内容区域 -->
      <div class="content-area">
        <!-- 编辑器/树形视图区域 -->
        <div class="editor-panel">
          <div class="panel-header">
            <h3>{{ currentMode === 'text' ? 'JSON 编辑器' : 'JSON 树形视图' }}</h3>
          </div>
          
          <!-- 文本编辑器模式 -->
          <MonacoEditor 
            v-if="currentMode === 'text'"
            ref="editorRef" 
            v-model:value="jsonText" 
            language="json" 
            @change="handleTextChange"
          />

          <!-- 树形视图模式 -->
          <div v-else class="tree-view-container">
            <JSONTree v-if="isValid" :data="jsonData" :path="'root'" />
            <div v-else class="invalid-state">
              <span class="error-icon">⚠️</span>
              <p>JSON 格式错误，请检查后重试</p>
            </div>
          </div>

          <!-- 验证状态提示 -->
          <div class="validation-status" :class="isValid ? 'valid' : 'invalid'">
            <span class="status-icon">{{ isValid ? '✓' : '⚠️' }}</span>
            <span class="status-text">{{ isValid ? 'JSON 格式有效' : 'JSON 格式错误' }}</span>
          </div>
        </div>

        <!-- 统计信息面板 -->
        <div class="stats-panel">
          <div class="panel-header">
            <h3>JSON 统计</h3>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">文件大小:</span>
              <span class="stat-value">{{ fileSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">键值对数量:</span>
              <span class="stat-value">{{ keyCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">嵌套深度:</span>
              <span class="stat-value">{{ depth }}</span>
            </div>
            <div class="stat-item status">
              <span class="stat-label">状态:</span>
              <span :class="['stat-value', isValid ? 'valid' : 'invalid']">
                {{ isValid ? '有效' : '无效' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import MonacoEditor from './components/MonacoEditor.vue'
import JSONTree from './components/JSONTree.vue'

const currentMode = ref('text')
const jsonText = ref('{"name": "JSON 可视化工具","version": "1.0.0","features": ["语法高亮","自动补全","实时验证","双模式编辑"],"settings": {"theme": "dark","fontSize": 14}}')
const jsonData = ref(null)
const isValid = ref(true)
const editorRef = ref(null)

// 切换模式
function switchMode(mode) {
  currentMode.value = mode
}

const fileSize = computed(() => {
  const size = new Blob([jsonText.value]).size
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
})

const keyCount = computed(() => {
  if (!isValid.value) return 0
  return countKeys(jsonData.value)
})

const depth = computed(() => {
  if (!isValid.value) return 0
  return getDepth(jsonData.value)
})

function countKeys(obj) {
  if (!obj || typeof obj !== 'object') return 0
  let count = 0
  if (Array.isArray(obj)) {
    for (let item of obj) {
      count += countKeys(item)
    }
  } else {
    count += Object.keys(obj).length
    for (let key in obj) {
      count += countKeys(obj[key])
    }
  }
  return count
}

function getDepth(obj) {
  if (!obj || typeof obj !== 'object') return 0
  let maxDepth = 0
  if (Array.isArray(obj)) {
    for (let item of obj) {
      const currentDepth = getDepth(item)
      if (currentDepth > maxDepth) maxDepth = currentDepth
    }
  } else {
    for (let key in obj) {
      const currentDepth = getDepth(obj[key])
      if (currentDepth > maxDepth) maxDepth = currentDepth
    }
  }
  return maxDepth + 1
}



function handleTextChange() {
  validateJSON()
}

function validateJSON() {
  try {
    jsonData.value = JSON.parse(jsonText.value)
    isValid.value = true
  } catch (e) {
    isValid.value = false
  }
}

function formatJSON() {
  if (isValid.value) {
    jsonText.value = JSON.stringify(jsonData.value, null, 2)
  }
}

function compressJSON() {
  if (isValid.value) {
    jsonText.value = JSON.stringify(jsonData.value)
  }
}

function clearJSON() {
  if (confirm('确定要清空所有内容吗？')) {
    jsonText.value = ''
    jsonData.value = null
    isValid.value = false
  }
}

watch(jsonText, () => {
  validateJSON()
})

// 初始化验证
validateJSON()
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  align-items: center;
}

.mode-switcher {
  display: flex;
  gap: 5px;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #424242;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.2);
}

.mode-btn.active:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-separator {
  width: 1px;
  height: 30px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 5px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tool-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.tool-btn:active:not(:disabled) {
  transform: translateY(0);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.content-area {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.editor-panel,
.stats-panel {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.editor-panel {
  flex: 2;
}

.stats-panel {
  flex: 1;
}

.panel-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.tree-view-container {
  flex: 1;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: 10px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
}

.validation-status.valid {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}

.validation-status.invalid {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
}

.status-icon {
  font-size: 16px;
}

.stats-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: auto;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #424242;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.stat-value.valid {
  color: #43e97b;
}

.stat-value.invalid {
  color: #fa709a;
}
</style>
