<template>
  <div class="preview" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// 配置 marked
marked.use({
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    const result = hljs.highlight(code, { language })
    return result.value
  },
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  try {
    return marked.parse(props.content)
  } catch (e) {
    console.error('Markdown parsing error:', e)
    return `<pre>${props.content}</pre>`
  }
})
</script>

<style scoped>
.preview {
  padding: 20px;
  line-height: 1.8;
}

.preview h1,
.preview h2,
.preview h3,
.preview h4,
.preview h5,
.preview h6 {
  margin: 24px 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
}

.preview h1 {
  font-size: 2em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.preview h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.preview h3 {
  font-size: 1.25em;
}

.preview h4 {
  font-size: 1.125em;
}

.preview p {
  margin: 16px 0;
}

.preview ul,
.preview ol {
  margin: 16px 0;
  padding-left: 2em;
}

.preview li {
  margin: 8px 0;
}

.preview blockquote {
  margin: 16px 0;
  padding: 0 1em;
  border-left: 4px solid #3b82f6;
  color: #6b7280;
  font-style: italic;
}

.preview code {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875em;
}

.preview pre {
  margin: 16px 0;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  overflow-x: auto;
}

.preview pre code {
  background: none;
  padding: 0;
  color: #f9fafb;
}

.preview table {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
}

.preview th,
.preview td {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.preview th {
  background: #f9fafb;
  font-weight: 600;
}

.preview a {
  color: #3b82f6;
  text-decoration: none;
}

.preview a:hover {
  text-decoration: underline;
}

.preview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
}

.preview hr {
  margin: 24px 0;
  border: 0;
  border-top: 1px solid #e5e7eb;
}
</style>