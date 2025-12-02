import { defineStore } from 'pinia'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [
      {
        id: Date.now(),
        title: '欢迎使用 Markdown 笔记工具',
        content: '# 欢迎使用 Markdown 笔记工具\n\n这是一个功能强大的笔记管理工具，支持：\n\n## 主要功能\n\n1. **实时预览** - 左侧编辑，右侧实时查看效果\n2. **分类管理** - 多级文件夹分类\n3. **标签系统** - 快速筛选笔记\n4. **回收站** - 误删恢复功能\n\n## 使用示例\n\n```javascript\nconsole.log("Hello World!");\n```',
        category: '学习',
        tags: ['欢迎', '指南'],
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      }
    ],
    categories: ['工作', '学习', '个人'],
    currentNote: null,
    searchKeyword: '',
    activeCategory: '',
    activeTag: '',
    viewMode: 'split' // split, edit, preview
  }),
  getters: {
    filteredNotes: (state) => {
      let result = state.notes.filter(note => !note.isDeleted)
      
      if (state.searchKeyword) {
        result = result.filter(note => 
          note.title.includes(state.searchKeyword) || 
          note.content.includes(state.searchKeyword)
        )
      }
      
      if (state.activeCategory) {
        result = result.filter(note => note.category === state.activeCategory)
      }
      
      if (state.activeTag) {
        result = result.filter(note => note.tags.includes(state.activeTag))
      }
      
      return result.sort((a, b) => b.updateTime - a.updateTime)
    },
    deletedNotes: (state) => {
      return state.notes.filter(note => note.isDeleted).sort((a, b) => b.updateTime - a.updateTime)
    },
    allTags: (state) => {
      const tags = new Set()
      state.notes.forEach(note => note.tags.forEach(tag => tags.add(tag)))
      return Array.from(tags)
    }
  },
  actions: {
    createNote() {
      const newNote = {
        id: Date.now(),
        title: '新建笔记',
        content: '# 新建笔记\n\n开始记录你的想法吧！',
        category: '个人',
        tags: [],
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      }
      this.notes.unshift(newNote)
      this.currentNote = newNote
    },
    saveNote(note) {
      const index = this.notes.findIndex(n => n.id === note.id)
      if (index !== -1) {
        this.notes[index] = { ...note, updateTime: Date.now() }
      }
    },
    deleteNote(noteId) {
      const note = this.notes.find(n => n.id === noteId)
      if (note) {
        note.isDeleted = true
        note.updateTime = Date.now()
      }
    },
    restoreNote(noteId) {
      const note = this.notes.find(n => n.id === noteId)
      if (note) {
        note.isDeleted = false
        note.updateTime = Date.now()
      }
    },
    permanentDelete(noteId) {
      this.notes = this.notes.filter(n => n.id !== noteId)
    },
    addCategory(name) {
      if (!this.categories.includes(name)) {
        this.categories.push(name)
      }
    },
    setCurrentNote(note) {
      this.currentNote = note
    },
    setSearchKeyword(keyword) {
      this.searchKeyword = keyword
    },
    setActiveCategory(category) {
      this.activeCategory = category
    },
    setActiveTag(tag) {
      this.activeTag = tag
    },
    setViewMode(mode) {
      this.viewMode = mode
    }
  }
})