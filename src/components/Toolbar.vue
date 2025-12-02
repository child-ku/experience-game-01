<template>
  <div class="toolbar">
    <button @click="insert('**加粗**')" title="加粗 (Ctrl+B)">B</button>
    <button @click="insert('*斜体*')" title="斜体 (Ctrl+I)">I</button>
    <button @click="insert('[链接](https://example.com)')" title="链接">🔗</button>
    <button @click="insert('# 标题')" title="标题">H1</button>
    <button @click="insert('## 二级标题')" title="二级标题">H2</button>
    <button @click="insert('- 列表项')" title="列表">📋</button>
    <button @click="insert('> 引用')" title="引用">💬</button>
    <button @click="insert('```javascript\n代码\n```')" title="代码块">💻</button>
    <button @click="insert('![图片](https://example.com/image.jpg)')" title="图片">🖼️</button>
    <button @click="insert('---')" title="分割线">---</button>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['insert'])

const insert = (text) => {
  emit('insert', text)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-wrap: wrap;
}

.toolbar button {
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.toolbar button:nth-child(1) {
  font-weight: bold;
}

.toolbar button:nth-child(2) {
  font-style: italic;
}
</style>