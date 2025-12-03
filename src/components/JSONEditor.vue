<template>
  <div class="json-editor">
    <div ref="editorContainer" class="editor"></div>
    <div v-if="errors.length" class="error-message">
      <strong>错误:</strong> {{ errors[0] }}
    </div>
  </div>
</template>

<script>
import * as monaco from 'monaco-editor';

export default {
  name: 'JSONEditor',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    errors: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'validate'],
  data() {
    return {
      editor: null,
      debounceTimer: null
    };
  },
  mounted() {
    this.initEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.dispose();
    }
  },
  watch: {
    modelValue(newValue) {
      if (this.editor && this.editor.getValue() !== newValue) {
        this.editor.setValue(newValue);
      }
    }
  },
  methods: {
    initEditor() {
      const container = this.$refs.editorContainer;
      if (!container) return;

      this.editor = monaco.editor.create(container, {
        value: this.modelValue,
        language: 'json',
        theme: 'vs-dark',
        fontSize: 14,
        lineHeight: 22,
        wordWrap: 'on',
        minimap: {
          enabled: true
        },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        glyphMargin: true,
        lineNumbers: 'on',
        roundedSelection: true,
        selectOnLineNumbers: true,
        accessibilitySupport: 'on'
      });

      // 设置JSON语法验证
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: false
      });

      // 监听内容变化
      this.editor.onDidChangeModelContent(() => {
        const value = this.editor.getValue();
        this.$emit('update:modelValue', value);
        this.validateJSON(value);
      });

      // 初始化验证
      this.validateJSON(this.modelValue);
    },
    validateJSON(text) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const errors = [];
        try {
          if (text.trim()) {
            JSON.parse(text);
          }
        } catch (error) {
          errors.push(error.message);
        }
        this.$emit('validate', errors);
      }, 300);
    }
  }
};
</script>

<style scoped>
.json-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor {
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>