<template>
  <div class="app-container">
    <!-- 左侧侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>📝 笔记</h1>
        <button @click="store.createNote()" class="btn-primary">+ 新建</button>
      </div>

      <!-- 搜索框 -->
      <div class="search-section">
        <input 
          v-model="store.searchKeyword" 
          placeholder="搜索笔记..."
          class="search-input"
        />
      </div>

      <!-- 分类管理 -->
      <div class="section">
        <h3>分类</h3>
        <div class="category-list">
          <div 
            v-for="category in store.categories" 
            :key="category"
            :class="['category-item', { active: store.activeCategory === category }]"
            @click="store.setActiveCategory(store.activeCategory === category ? '' : category)"
          >
            📁 {{ category }}
          </div>
        </div>
      </div>

      <!-- 标签系统 -->
      <div class="section">
        <h3>标签</h3>
        <div class="tag-list">
          <span 
            v-for="tag in store.allTags" 
            :key="tag"
            :class="['tag-item', { active: store.activeTag === tag }]"
            @click="store.setActiveTag(store.activeTag === tag ? '' : tag)"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- 回收站 -->
      <div class="section">
        <div class="trash-section" @click="showTrash = !showTrash">
          <h3>🗑️ 回收站</h3>
        </div>
        <div v-if="showTrash" class="trash-list">
          <div 
            v-for="note in store.deletedNotes" 
            :key="note.id"
            class="trash-item"
          >
            <span>{{ note.title }}</span>
            <div class="trash-actions">
              <button @click="store.restoreNote(note.id)">恢复</button>
              <button @click="store.permanentDelete(note.id)" class="btn-danger">删除</button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 笔记列表 -->
      <div class="note-list" v-if="!store.currentNote">
        <div class="list-header">
          <h2>笔记列表</h2>
        </div>
        <div class="notes-grid">
          <div 
            v-for="note in store.filteredNotes" 
            :key="note.id"
            class="note-card"
          >
            <div class="note-content" @click="store.setCurrentNote(note)">
              <div class="note-title">{{ note.title }}</div>
              <div class="note-meta">
                <span class="category">{{ note.category }}</span>
                <span class="time">{{ formatTime(note.updateTime) }}</span>
              </div>
              <div class="note-tags">
                <span v-for="tag in note.tags" :key="tag" class="tag-small">#{{ tag }}</span>
              </div>
            </div>
            <button 
              @click.stop="store.deleteNote(note.id)" 
              class="note-delete-btn"
              title="删除笔记"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 编辑器区域 -->
      <div class="editor-container" v-else>
        <div class="editor-header">
          <button @click="store.setCurrentNote(null)" class="btn-back">← 返回</button>
          <input 
            v-model="store.currentNote.title" 
            class="note-title-input"
            placeholder="请输入笔记标题"
          />
          <div class="editor-actions">
            <select v-model="store.currentNote.category" class="category-select">
              <option v-for="category in store.categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <input 
              v-model="tagInput" 
              placeholder="添加标签"
              class="tag-input"
              @keyup.enter="addTag"
            />
            <button @click="store.setViewMode(store.viewMode === 'split' ? 'edit' : 'split')" class="btn-mode">
              {{ store.viewMode === 'split' ? '📝' : '↔️' }}
            </button>
            <button @click="saveNote" class="btn-primary">💾 保存</button>
            <button @click="handleDeleteNote" class="btn-danger">🗑️ 删除</button>
          </div>
        </div>

        <div class="editor-body">
          <!-- 编辑模式 -->
          <div v-if="store.viewMode === 'edit'" class="full-editor">
            <textarea 
              v-model="store.currentNote.content"
              class="editor-textarea"
              placeholder="开始编写 Markdown..."
            ></textarea>
          </div>

          <!-- 分栏模式 -->
          <div v-else class="split-editor">
            <div class="edit-pane">
              <Toolbar @insert="insertToEditor" />
              <textarea 
                ref="editorRef"
                v-model="store.currentNote.content"
                class="editor-textarea"
                placeholder="开始编写 Markdown..."
              ></textarea>
            </div>
            <div class="preview-pane">
              <Preview :content="store.currentNote.content" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNoteStore } from './stores/noteStore'
import Toolbar from './components/Toolbar.vue'
import Preview from './components/Preview.vue'

const store = useNoteStore()
const showTrash = ref(false)
const tagInput = ref('')
const editorRef = ref(null)

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const addTag = () => {
  if (tagInput.value && !store.currentNote.tags.includes(tagInput.value)) {
    store.currentNote.tags.push(tagInput.value)
    tagInput.value = ''
  }
}

const saveNote = () => {
  store.saveCurrentNote()
}

const handleDeleteNote = () => {
  store.deleteNote(store.currentNote.id)
  store.setCurrentNote(null)
}

const insertToEditor = (text) => {
  const editor = editorRef.value
  if (!editor) return
  
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const value = editor.value
  
  editor.value = value.substring(0, start) + text + value.substring(end)
  editor.selectionStart = editor.selectionEnd = start + text.length
  editor.focus()
  store.currentNote.content = editor.value
}
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
}

.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sidebar-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2563eb;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #6b7280;
}

.category-list .category-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.category-list .category-item:hover,
.category-list .category-item.active {
  background: #eff6ff;
  color: #3b82f6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.tag-item:hover,
.tag-item.active {
  background: #3b82f6;
  color: white;
}

.trash-section {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
}

.trash-section:hover {
  background: #fef2f2;
  color: #ef4444;
}

.trash-list {
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}

.trash-actions button {
  background: transparent;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
}

.btn-danger {
  color: #ef4444;
}

.btn-danger:hover {
  background: #fef2f2;
}

.main-content {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.note-list {
  padding: 20px;
}

.list-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.note-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.note-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-small {
  font-size: 11px;
  background: #e5e7eb;
  padding: 1px 4px;
  border-radius: 3px;
}

.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-back {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px;
  border-radius: 4px;
}

.btn-back:hover {
  background: #e5e7eb;
}

.note-title-input {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  border: none;
  background: transparent;
  outline: none;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-select {
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.tag-input {
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  width: 120px;
  font-size: 14px;
}

.btn-mode {
  background: transparent;
  border: 1px solid #e5e7eb;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.full-editor {
  width: 100%;
  height: 100%;
}

.split-editor {
  display: flex;
  width: 100%;
  height: 100%;
}

.edit-pane,
.preview-pane {
  flex: 1;
  height: 100%;
  overflow: auto;
}

.edit-pane {
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
}
</style>