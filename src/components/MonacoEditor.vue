<template>
  <div ref="editorRef" class="monaco-editor"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

let monaco = null

// 动态加载monaco-editor CDN
const loadMonaco = async () => {
  if (!monaco) {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.monaco) {
        monaco = window.monaco
        resolve(monaco)
        return
      }

      // 加载monaco-editor脚本
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js'
      script.onload = () => {
        // 配置monaco-loader
        window.require.config({
          paths: {
            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs'
          }
        })
        
        // 加载编辑器模块
        window.require(['vs/editor/editor.main'], () => {
          monaco = window.monaco
          resolve(monaco)
        })
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }
  return monaco
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'json'
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let editorInstance = null

onMounted(async () => {
  if (!editorRef.value) return

  await loadMonaco()

  // 创建编辑器实例
  editorInstance = monaco.editor.create(editorRef.value, {
    value: props.modelValue,
    language: props.language,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    formatOnType: true,
    tabSize: 2,
    ...props.options
  })

  // 监听内容变化
  editorInstance.onDidChangeModelContent(() => {
    const value = editorInstance.getValue()
    emit('update:modelValue', value)
  })

  // 设置JSON语法验证
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: []
  })
})

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (editorInstance && editorInstance.getValue() !== newValue) {
    editorInstance.setValue(newValue)
  }
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.dispose()
  }
})
</script>

<style scoped>
.monaco-editor {
  width: 100%;
  height: 100%;
}
</style>
