<template>
  <div class="app-container">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">
          <i class="fa fa-sticky-note"></i>
          笔记管理
        </h1>
      </div>

      <!-- 分类列表 -->
      <div class="category-section">
        <div class="section-title">
          <i class="fa fa-folder"></i>
          分类
        </div>
        <ul class="category-list">
          <li 
            v-for="category in categories" 
            :key="category.id"
            :class="{ active: activeCategory === category.id }"
            @click="setActiveCategory(category.id)"
          >
            <span class="category-icon">{{ getCategoryIcon(category.id) }}</span>
            <span class="category-name">{{ category.name }}</span>
          </li>
        </ul>
      </div>

      <!-- 标签列表 -->
      <div class="tag-section">
        <div class="section-title">
          <i class="fa fa-tags"></i>
          标签
        </div>
        <div class="tag-list">
          <span 
            v-for="tag in tags" 
            :key="tag"
            :class="{ active: activeTag === tag }"
            @click="setActiveTag(tag)"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 回收站 -->
      <div class="trash-section">
        <button 
          :class="{ active: viewTrash }"
          @click="toggleTrash"
          class="trash-btn"
        >
          <i class="fa fa-trash"></i>
          回收站
          <span v-if="trashedNotes.length > 0" class="badge">{{ trashedNotes.length }}</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部工具栏 -->
      <header class="toolbar">
        <div class="toolbar-left">
          <button 
            v-if="!viewTrash"
            class="btn btn-primary"
            @click="createNewNote"
          >
            <i class="fa fa-plus"></i>
            新建笔记
          </button>
          <button 
            v-else
            class="btn btn-secondary"
            @click="restoreAllTrashed"
          >
            <i class="fa fa-undo"></i>
            恢复全部
          </button>
        </div>
        <div class="toolbar-right">
          <div class="search-box">
            <i class="fa fa-search"></i>
            <input 
              type="text" 
              placeholder="搜索笔记..."
              v-model="searchQuery"
              @input="filterNotes"
            />
          </div>
          <select 
            class="sort-select"
            v-model="sortBy"
            @change="sortNotes"
          >
            <option value="time_desc">按时间降序</option>
            <option value="time_asc">按时间升序</option>
            <option value="title_asc">按标题升序</option>
            <option value="title_desc">按标题降序</option>
          </select>
        </div>
      </header>

      <!-- 笔记列表 -->
      <div class="notes-list">
        <div 
          v-for="note in filteredNotes" 
          :key="note.id"
          class="note-item"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title || '无标题笔记' }}</h3>
            <div class="note-actions">
              <button 
                v-if="!viewTrash"
                class="btn-icon"
                @click="editNote(note.id)"
                title="编辑"
              >
                <i class="fa fa-edit"></i>
              </button>
              <button 
                v-if="!viewTrash"
                class="btn-icon btn-danger"
                @click="deleteNote(note.id)"
                title="删除"
              >
                <i class="fa fa-trash"></i>
              </button>
              <button 
                v-if="viewTrash"
                class="btn-icon btn-success"
                @click="restoreNote(note.id)"
                title="恢复"
              >
                <i class="fa fa-undo"></i>
              </button>
              <button 
                v-if="viewTrash"
                class="btn-icon btn-danger"
                @click="permanentlyDelete(note.id)"
                title="彻底删除"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
          <div class="note-meta">
            <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
            <span class="note-category">{{ getCategoryName(note.categoryId) }}</span>
          </div>
          <div class="note-tags">
            <span 
              v-for="tag in note.tags" 
              :key="tag"
              class="note-tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="note-preview">{{ note.content.substring(0, 100) }}...</div>
        </div>
      </div>
    </main>

    <!-- 编辑器模态框 -->
    <div 
      v-if="isEditorOpen"
      class="editor-modal"
      @click.self="closeEditor"
    >
      <div class="editor-container">
        <div class="editor-header">
          <input 
            type="text" 
            class="editor-title" 
            placeholder="笔记标题"
            v-model="currentNote.title"
          />
          <div class="editor-actions">
            <button class="btn-icon" @click="closeEditor">
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>
        <div class="editor-body">
          <Editor 
            v-model="currentNote.content"
            :fullscreen="false"
          />
        </div>
        <div class="editor-footer">
          <button class="btn btn-secondary" @click="closeEditor">取消</button>
          <button class="btn btn-primary" @click="saveNote">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Editor from './components/Editor.vue'

export default {
  name: 'App',
  components: {
    Editor
  },
  setup() {
    // 分类数据
    const categories = ref([
      { id: 'all', name: '全部笔记', icon: 'fa fa-th' },
      { id: 'work', name: '工作', icon: 'fa fa-briefcase' },
      { id: 'study', name: '学习', icon: 'fa fa-book' },
      { id: 'personal', name: '个人', icon: 'fa fa-user' }
    ])

    // 标签数据
    const tags = ref(['重要', '待办', '思路', '分享', '教程'])

    // 笔记数据
    const notes = ref([])
    const trashedNotes = ref([])

    // 状态管理
    const activeCategory = ref('all')
    const activeTag = ref(null)
    const searchQuery = ref('')
    const sortBy = ref('time_desc')
    const viewTrash = ref(false)
    const isEditorOpen = ref(false)
    const currentNote = ref(null)

    // 过滤后的笔记
    const filteredNotes = computed(() => {
      let result = viewTrash.value ? trashedNotes.value : notes.value

      // 分类过滤
      if (activeCategory.value !== 'all') {
        result = result.filter(note => note.categoryId === activeCategory.value)
      }

      // 标签过滤
      if (activeTag.value) {
        result = result.filter(note => note.tags.includes(activeTag.value))
      }

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(note => 
          (note.title && note.title.toLowerCase().includes(query)) ||
          (note.content && note.content.toLowerCase().includes(query))
        )
      }

      // 排序
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'time_desc':
            return new Date(b.updatedAt) - new Date(a.updatedAt)
          case 'time_asc':
            return new Date(a.updatedAt) - new Date(b.updatedAt)
          case 'title_asc':
            return (a.title || '').localeCompare(b.title || '', 'zh-CN')
          case 'title_desc':
            return (b.title || '').localeCompare(a.title || '', 'zh-CN')
          default:
            return 0
        }
      })

      return result
    })

    // 方法
    const getCategoryIcon = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.icon : 'fa fa-folder'
    }

    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    }

    const setActiveCategory = (categoryId) => {
      activeCategory.value = categoryId
    }

    const setActiveTag = (tag) => {
      activeTag.value = activeTag.value === tag ? null : tag
    }

    const toggleTrash = () => {
      viewTrash.value = !viewTrash.value
    }

    const filterNotes = () => {
      // 由 computed 自动处理
    }

    const sortNotes = () => {
      // 由 computed 自动处理
    }

    const createNewNote = () => {
      currentNote.value = {
        id: Date.now().toString(),
        title: '',
        content: '',
        categoryId: activeCategory.value === 'all' ? 'work' : activeCategory.value,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      isEditorOpen.value = true
    }

    const editNote = (noteId) => {
      const note = notes.value.find(n => n.id === noteId)
      if (note) {
        currentNote.value = { ...note }
        isEditorOpen.value = true
      }
    }

    const deleteNote = (noteId) => {
      const index = notes.value.findIndex(n => n.id === noteId)
      if (index > -1) {
        const note = notes.value.splice(index, 1)[0]
        trashedNotes.value.push(note)
      }
    }

    const restoreNote = (noteId) => {
      const index = trashedNotes.value.findIndex(n => n.id === noteId)
      if (index > -1) {
        const note = trashedNotes.value.splice(index, 1)[0]
        notes.value.push(note)
      }
    }

    const restoreAllTrashed = () => {
      notes.value.push(...trashedNotes.value)
      trashedNotes.value = []
    }

    const permanentlyDelete = (noteId) => {
      const index = trashedNotes.value.findIndex(n => n.id === noteId)
      if (index > -1) {
        trashedNotes.value.splice(index, 1)
      }
    }

    const saveNote = () => {
      if (currentNote.value) {
        currentNote.value.updatedAt = new Date().toISOString()
        const existingIndex = notes.value.findIndex(n => n.id === currentNote.value.id)
        if (existingIndex > -1) {
          notes.value[existingIndex] = { ...currentNote.value }
        } else {
          notes.value.push({ ...currentNote.value })
        }
        isEditorOpen.value = false
      }
    }

    const closeEditor = () => {
      isEditorOpen.value = false
      currentNote.value = null
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 初始化示例数据
    onMounted(() => {
      notes.value = [
        {
          id: '1',
          title: 'Vue 3 学习笔记',
          content: '# Vue 3 核心概念\n\nVue 3 是一个渐进式 JavaScript 框架，提供了响应式数据绑定和组件化开发。\n\n## 主要特性\n\n- Composition API\n- Teleport\n- Suspense\n- 性能优化',
          categoryId: 'study',
          tags: ['学习', '教程'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          title: '项目需求文档',
          content: '# 项目需求\n\n## 功能模块\n\n1. 用户管理\n2. 权限控制\n3. 数据可视化',
          categoryId: 'work',
          tags: ['工作', '重要'],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    })

    return {
      categories,
      tags,
      notes,
      trashedNotes,
      activeCategory,
      activeTag,
      searchQuery,
      sortBy,
      viewTrash,
      isEditorOpen,
      currentNote,
      filteredNotes,
      getCategoryIcon,
      getCategoryName,
      setActiveCategory,
      setActiveTag,
      toggleTrash,
      filterNotes,
      sortNotes,
      createNewNote,
      editNote,
      deleteNote,
      restoreNote,
      restoreAllTrashed,
      permanentlyDelete,
      saveNote,
      closeEditor,
      formatDate
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
}

.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #eaecef;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #eaecef;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-list {
  padding: 0 10px;
}

.category-list li {
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.category-list li:hover {
  background-color: #f5f7fa;
}

.category-list li.active {
  background-color: #409eff;
  color: #fff;
}

.tag-section {
  padding: 0 20px;
  margin-top: 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag {
  padding: 4px 10px;
  background-color: #f5f7fa;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background-color: #e6f7ff;
}

.tag.active {
  background-color: #409eff;
  color: #fff;
}

.trash-section {
  margin-top: auto;
  padding: 0 20px 20px;
}

.trash-btn {
  width: 100%;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #eaecef;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.trash-btn:hover {
  background-color: #f5f7fa;
}

.trash-btn.active {
  background-color: #67c23a;
  color: #fff;
  border-color: #67c23a;
}

.badge {
  background-color: #f56c6c;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  padding: 20px 30px;
  background-color: #fff;
  border-bottom: 1px solid #eaecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #409eff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-secondary {
  background-color: #f5f7fa;
  color: #333;
  border: 1px solid #eaecef;
}

.btn-secondary:hover {
  background-color: #e6f7ff;
}

.search-box {
  position: relative;
  width: 250px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 35px;
  border: 1px solid #eaecef;
  border-radius: 6px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #409eff;
}

.sort-select {
  padding: 10px 12px;
  border: 1px solid #eaecef;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.notes-list {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-item {
  background-color: #fff;
  border: 1px solid #eaecef;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.note-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.btn-icon.btn-danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

.btn-icon.btn-success:hover {
  background-color: #f0f9ff;
  color: #67c23a;
}

.note-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
}

.note-tag {
  padding: 2px 8px;
  background-color: #f5f7fa;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.note-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.editor-container {
  width: 90%;
  height: 90%;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: 20px;
  border-bottom: 1px solid #eaecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-title {
  flex: 1;
  padding: 10px;
  border: 1px solid #eaecef;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
}

.editor-title:focus {
  outline: none;
  border-color: #409eff;
}

.editor-body {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.editor-footer {
  padding: 20px;
  border-top: 1px solid #eaecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
