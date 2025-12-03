<template>
  <div ref="containerRef" class="monaco-editor"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import monacoLoader from '@monaco-editor/loader';

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'json'
  },
  theme: {
    type: String,
    default: 'vs-dark'
  }
})

const emit = defineEmits(['update:value', 'change'])

const containerRef = ref(null)
let editorInstance = null

function initEditor() {
  if (!containerRef.value) return

  monacoLoader.init().then(monaco => {
    editorInstance = monaco.editor.create(containerRef.value, {
      value: props.value,
      language: props.language,
      theme: props.theme,
      automaticLayout: true,
      minimap: {
        enabled: false
      },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      cursorStyle: 'line',
      wordWrap: 'on',
      tabSize: 2
    })

    // 监听内容变化
    editorInstance.onDidChangeModelContent(() => {
      const newValue = editorInstance.getValue()
      emit('update:value', newValue)
      emit('change')
    })

    // 配置 JSON 验证
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false
    })
  })
}

function updateEditorValue(newValue) {
  if (editorInstance && editorInstance.getValue() !== newValue) {
    editorInstance.setValue(newValue)
  }
}

onMounted(() => {
  initEditor()
})

watch(() => props.value, (newValue) => {
  updateEditorValue(newValue)
})

watch(() => props.language, (newLanguage) => {
  if (editorInstance) {
    const monaco = monacoLoader.getMonaco()
    if (monaco) {
      monaco.editor.setModelLanguage(editorInstance.getModel(), newLanguage)
    }
  }
})

watch(() => props.theme, (newTheme) => {
  const monaco = monacoLoader.getMonaco()
  if (monaco) {
    monaco.editor.setTheme(newTheme)
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
  font-family: 'Courier New', Courier, monospace;
}
</style>
