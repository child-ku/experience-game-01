<template>
  <div class="editor-wrapper" :class="{ fullscreen: fullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <button class="toolbar-btn" @click="formatText('bold')" title="加粗">
        <i class="fa fa-bold"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('italic')" title="斜体">
        <i class="fa fa-italic"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('underline')" title="下划线">
        <i class="fa fa-underline"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('strike')" title="删除线">
        <i class="fa fa-strikethrough"></i>
      </button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-btn" @click="formatText('h1')" title="标题 1">
        H1
      </button>
      <button class="toolbar-btn" @click="formatText('h2')" title="标题 2">
        H2
      </button>
      <button class="toolbar-btn" @click="formatText('h3')" title="标题 3">
        H3
      </button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-btn" @click="formatText('quote')" title="引用">
        <i class="fa fa-quote-left"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('code')" title="代码块">
        <i class="fa fa-code"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('link')" title="链接">
        <i class="fa fa-link"></i>
      </button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-btn" @click="formatText('ul')" title="无序列表">
        <i class="fa fa-list-ul"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('ol')" title="有序列表">
        <i class="fa fa-list-ol"></i>
      </button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-btn" @click="formatText('table')" title="表格">
        <i class="fa fa-table"></i>
      </button>
      <button class="toolbar-btn" @click="formatText('image')" title="图片">
        <i class="fa fa-picture-o"></i>
      </button>
      <div class="toolbar-spacer"></div>
      <button 
        class="toolbar-btn" 
        :class="{ active: showPreview }"
        @click="showPreview = !showPreview"
        title="预览"
      >
        <i class="fa fa-eye"></i>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: fullscreen }"
        @click="toggleFullscreen"
        title="全屏"
      >
        <i class="fa fa-expand"></i>
      </button>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <textarea 
        ref="editor" 
        v-model="localContent" 
        class="editor-textarea"
        placeholder="开始编写你的笔记..."
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>
      <div 
        v-if="showPreview"
        class="editor-preview"
        v-html="previewHtml"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
})

export default {
  name: 'Editor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    fullscreen: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const editor = ref(null)
    const localContent = ref(props.modelValue)
    const showPreview = ref(true)

    // 预览 HTML
    const previewHtml = computed(() => {
      return marked.parse(localContent.value)
    })

    // 监听外部内容变化
    watch(() => props.modelValue, (newVal) => {
      localContent.value = newVal
    })

    // 处理输入
    const handleInput = () => {
      emit('update:modelValue', localContent.value)
    }

    // 快捷键处理
    const handleKeydown = (e) => {
      // Ctrl/Cmd + B: 加粗
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        formatText('bold')
      }
      // Ctrl/Cmd + I: 斜体
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        formatText('italic')
      }
      // Ctrl/Cmd + U: 下划线
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault()
        formatText('underline')
      }
      // Ctrl/Cmd + K: 链接
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        formatText('link')
      }
      // Ctrl/Cmd + Shift + M: 切换预览
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault()
        showPreview.value = !showPreview.value
      }
    }

    // 格式化文本
    const formatText = (type) => {
      const textarea = editor.value
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = localContent.value.substring(start, end)
      const beforeText = localContent.value.substring(0, start)
      const afterText = localContent.value.substring(end)
      let formattedText = selectedText
      let newCursorPos = start

      switch (type) {
        case 'bold':
          formattedText = selectedText ? `**${selectedText}**` : '**加粗文本**'
          newCursorPos = start + (selectedText ? 2 : 4)
          break
        case 'italic':
          formattedText = selectedText ? `*${selectedText}*` : '*斜体文本*'
          newCursorPos = start + (selectedText ? 1 : 3)
          break
        case 'underline':
          formattedText = selectedText ? `<u>${selectedText}</u>` : '<u>下划线文本</u>'
          newCursorPos = start + (selectedText ? 3 : 5)
          break
        case 'strike':
          formattedText = selectedText ? `~~${selectedText}~~` : '~~删除线文本~~'
          newCursorPos = start + (selectedText ? 2 : 4)
          break
        case 'h1':
          formattedText = selectedText ? `# ${selectedText}` : '# 标题 1'
          newCursorPos = start + 2
          break
        case 'h2':
          formattedText = selectedText ? `## ${selectedText}` : '## 标题 2'
          newCursorPos = start + 3
          break
        case 'h3':
          formattedText = selectedText ? `### ${selectedText}` : '### 标题 3'
          newCursorPos = start + 4
          break
        case 'quote':
          formattedText = selectedText ? `> ${selectedText}` : '> 引用文本'
          newCursorPos = start + 2
          break
        case 'code':
          formattedText = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '\`\`\`\n代码块\n\`\`\`'
          newCursorPos = start + 4
          break
        case 'link':
          const linkUrl = prompt('请输入链接地址:', 'https://')
          if (linkUrl) {
            formattedText = selectedText ? `[${selectedText}](${linkUrl})` : `[链接文本](${linkUrl})`
            newCursorPos = start + (selectedText ? 1 : 3)
          }
          break
        case 'ul':
          formattedText = selectedText ? `* ${selectedText}` : '* 列表项'
          newCursorPos = start + 2
          break
        case 'ol':
          formattedText = selectedText ? `1. ${selectedText}` : '1. 列表项'
          newCursorPos = start + 3
          break
        case 'table':
          formattedText = `| 表头 | 表头 |\n| ---- | ---- |\n| 内容 | 内容 |`
          newCursorPos = start + 10
          break
        case 'image':
          const imageUrl = prompt('请输入图片地址:', 'https://')
          if (imageUrl) {
            formattedText = selectedText ? `![${selectedText}](${imageUrl})` : `![图片](${imageUrl})`
            newCursorPos = start + (selectedText ? 2 : 4)
          }
          break
      }

      localContent.value = beforeText + formattedText + afterText
      emit('update:modelValue', localContent.value)

      // 重新聚焦并设置光标位置
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      })
    }

    // 切换全屏
    const toggleFullscreen = () => {
      emit('update:fullscreen', !props.fullscreen)
    }

    return {
      editor,
      localContent,
      showPreview,
      previewHtml,
      handleInput,
      handleKeydown,
      formatText,
      toggleFullscreen
    }
  }
}
</script>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.editor-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #eaecef;
  gap: 5px;
}

.toolbar-btn {
  padding: 6px 12px;
  background-color: #fff;
  border: 1px solid #eaecef;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background-color: #e6f7ff;
  border-color: #409eff;
  color: #409eff;
}

.toolbar-btn.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #eaecef;
  margin: 0 5px;
}

.toolbar-spacer {
  flex: 1;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-textarea {
  flex: 1;
  padding: 20px;
  border: none;
  outline: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background-color: #fff;
}

.editor-preview {
  flex: 1;
  padding: 20px;
  border-left: 1px solid #eaecef;
  overflow-y: auto;
  background-color: #fff;
}

.editor-preview h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.editor-preview h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #333;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.editor-preview h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.editor-preview p {
  margin-bottom: 12px;
  line-height: 1.8;
}

.editor-preview ul,
.editor-preview ol {
  margin-bottom: 12px;
  padding-left: 2em;
}

.editor-preview li {
  margin-bottom: 6px;
  line-height: 1.8;
}

.editor-preview blockquote {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
}

.editor-preview pre {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 16px 0;
}

.editor-preview code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.editor-preview pre code {
  background: none;
  padding: 0;
  border: none;
  border-radius: 0;
}

.editor-preview a {
  color: #409eff;
  text-decoration: none;
}

.editor-preview a:hover {
  text-decoration: underline;
}

.editor-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.editor-preview table th,
.editor-preview table td {
  border: 1px solid #eaecef;
  padding: 10px 16px;
  text-align: left;
}

.editor-preview table th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.editor-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
}

.editor-preview hr {
  border: none;
  border-top: 1px solid #eaecef;
  margin: 24px 0;
}
</style>
