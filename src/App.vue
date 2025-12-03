<template>
  <div class="regex-tool">
    <header class="header">
      <h1>正则表达式工具</h1>
    </header>

    <!-- 快捷插入按钮区域 -->
    <div class="quick-inserts">
      <button v-for="pattern in quickPatterns" :key="pattern.key" @click="insertPattern(pattern)" class="quick-btn">
        {{ pattern.name }}
      </button>
    </div>

    <!-- 正则表达式输入区域 -->
    <div class="input-section">
      <label>正则表达式:</label>
      <div class="regex-input-wrapper">
        <div 
          ref="regexInputRef"
          class="regex-input" 
          contenteditable="true"
          @input="handleInput"
          @keyup="handleKeyup"
          @blur="handleBlur"
          placeholder="输入正则表达式..."
        ></div>
      </div>
      <div v-if="errorMessage" class="error-message">⚠️ {{ errorMessage }}</div>
      <div v-else-if="regexInput" class="success-message">✅ 语法正确</div>
    </div>

    <!-- 智能提示区域 -->
    <div v-if="showSuggestions && suggestions.length > 0" class="suggestions">
      <div v-for="(suggestion, index) in suggestions" :key="index" 
           @click="insertSuggestion(suggestion)" class="suggestion-item">
        <span class="suggestion-pattern">{{ suggestion.pattern }}</span>
        <span class="suggestion-desc">{{ suggestion.description }}</span>
      </div>
    </div>

    <!-- 测试区域 -->
    <div class="test-section">
      <label>测试文本:</label>
      <textarea v-model="testText" @input="testRegex" class="test-textarea" placeholder="输入测试文本..."></textarea>
      
      <div class="test-results">
        <h3>匹配结果:</h3>
        <div v-if="matches.length > 0" class="matches-list">
          <div v-for="(match, index) in matches" :key="index" class="match-item">
            <span class="match-index">#{{ index + 1 }}</span>
            <span class="match-text">{{ match }}</span>
          </div>
        </div>
        <div v-else class="no-matches">
          {{ testText ? '没有匹配结果' : '请输入测试文本' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const regexInputRef = ref(null)
const regexInput = ref('')
const testText = ref('')
const errorMessage = ref('')
const showSuggestions = ref(false)
const suggestions = ref([])
const matches = ref([])

// 快捷插入模式
const quickPatterns = [
  { name: '邮箱', key: 'email', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' },
  { name: '手机号', key: 'phone', pattern: '^1[3-9]\d{9}$' },
  { name: 'IP地址', key: 'ip', pattern: '^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$' },
  { name: 'URL', key: 'url', pattern: '^https?://[^\s]+$' },
  { name: '身份证', key: 'idcard', pattern: '^\d{17}([0-9]|X)$' },
  { name: '邮政编码', key: 'postcode', pattern: '^\d{6}$' }
]

// 智能提示列表
const suggestionList = [
  { pattern: '\d', description: '匹配数字' },
  { pattern: '\w', description: '匹配字母、数字、下划线' },
  { pattern: '\s', description: '匹配空白字符' },
  { pattern: '.', description: '匹配任意字符' },
  { pattern: '*', description: '匹配0次或多次' },
  { pattern: '+', description: '匹配1次或多次' },
  { pattern: '?', description: '匹配0次或1次' },
  { pattern: '{n}', description: '匹配恰好n次' },
  { pattern: '{n,}', description: '匹配至少n次' },
  { pattern: '{n,m}', description: '匹配n到m次' },
  { pattern: '^', description: '匹配字符串开头' },
  { pattern: '$', description: '匹配字符串结尾' },
  { pattern: '[abc]', description: '匹配a、b或c' },
  { pattern: '[^abc]', description: '匹配除a、b、c外的任意字符' },
  { pattern: '(abc)', description: '分组匹配' },
  { pattern: 'a|b', description: '匹配a或b' }
]

// 处理输入事件
const handleInput = () => {
  const input = regexInputRef.value
  const text = input.innerText || ''
  regexInput.value = text
  highlightSyntax()
  validateRegex()
  testRegex()
  showSuggestions.value = true
  filterSuggestions()
}

// 处理失焦事件
const handleBlur = () => {
  const input = regexInputRef.value
  if (!input.innerText) {
    input.innerHTML = ''
  }
}

// 语法高亮核心函数
const highlightSyntax = () => {
  const input = regexInputRef.value
  if (!input) return
  
  const text = input.innerText || ''
  if (!text) {
    input.innerHTML = ''
    return
  }
  
  let html = text
  
  // 匹配不同语法元素并添加高亮样式 - 按照从特殊到一般的顺序匹配
  const patterns = [
    { regex: /('.*?'|".*?")/g, className: 'regex-string' },
    { regex: /(\[.*?\])/g, className: 'regex-class' },
    { regex: /(\{.*?\})/g, className: 'regex-quantifier' },
    { regex: /(\(.*?\))/g, className: 'regex-group' },
    { regex: /(\\[dwsDWSbnrtfv0\.]|\^|\$|\.|\*|\+|\?|\||\\)/g, className: 'regex-special' },
    { regex: /([\|\+\*\?\.\^\$])/g, className: 'regex-operator' }
  ]
  
  patterns.forEach(({ regex, className }) => {
    html = html.replace(regex, `<span class="${className}">$1</span>`)
  })
  
  // 保存光标位置
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const preSelectionRange = range.cloneRange()
  preSelectionRange.selectNodeContents(input)
  preSelectionRange.setEnd(range.startContainer, range.startOffset)
  const start = preSelectionRange.toString().length
  
  input.innerHTML = html
  
  // 恢复光标位置
  restoreCursorPosition(input, start)
}

// 恢复光标位置
const restoreCursorPosition = (element, pos) => {
  const selection = window.getSelection()
  const range = document.createRange()
  let currentNode = element.firstChild
  let currentPos = 0
  
  const traverse = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (currentPos + node.length >= pos) {
        range.setStart(node, pos - currentPos)
        range.setEnd(node, pos - currentPos)
        return true
      }
      currentPos += node.length
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) {
          return true
        }
      }
    }
    return false
  }
  
  traverse(element)
  selection.removeAllRanges()
  selection.addRange(range)
}



// 处理按键事件
const handleKeyup = (e) => {
  if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

// 验证正则表达式语法
const validateRegex = () => {
  try {
    if (regexInput.value.trim()) {
      new RegExp(regexInput.value)
    }
    errorMessage.value = ''
  } catch (err) {
    errorMessage.value = err.message
  }
}

// 过滤智能提示
const filterSuggestions = () => {
  if (!regexInput.value) {
    suggestions.value = suggestionList
    return
  }
  
  const input = regexInput.value.toLowerCase()
  suggestions.value = suggestionList.filter(s => 
    s.pattern.toLowerCase().includes(input) || s.description.toLowerCase().includes(input)
  )
}

// 插入快捷模式
const insertPattern = (pattern) => {
  const input = regexInputRef.value
  input.innerText = pattern.pattern
  showSuggestions.value = false
  handleInput()
}

// 插入智能提示
const insertSuggestion = (suggestion) => {
  const input = regexInputRef.value
  const selection = window.getSelection()
  
  // 替换选中内容
  document.execCommand('insertText', false, suggestion.pattern)
  
  showSuggestions.value = false
  handleInput()
}

// 测试正则表达式匹配
const testRegex = () => {
  matches.value = []
  
  if (!regexInput.value || !testText.value) return
  
  try {
    const regex = new RegExp(regexInput.value, 'g')
    const matchResults = testText.value.match(regex)
    if (matchResults) {
      matches.value = [...new Set(matchResults)]
    }
  } catch (err) {
    // 忽略语法错误
  }
}

onMounted(() => {
  filterSuggestions()
})
</script>

<style scoped>
.regex-tool {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #667eea;
  font-size: 2.5rem;
  font-weight: 700;
}

.quick-inserts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.quick-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.input-section {
  margin-bottom: 30px;
}

.input-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.regex-input-wrapper {
  position: relative;
}

.regex-input {
  width: 100%;
  min-height: 60px;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1.1rem;
  font-family: 'Consolas', 'Monaco', monospace;
  margin-bottom: 10px;
  transition: border-color 0.3s ease;
  white-space: pre-wrap;
  word-wrap: break-word;
  outline: none;
}

.regex-input:empty:before {
  content: attr(placeholder);
  color: #999;
}

.regex-input:focus {
  border-color: #667eea;
}

.regex-special {
  color: #d73a49;
  font-weight: bold;
}

.regex-operator {
  color: #d73a49;
  font-weight: bold;
}

.regex-string {
  color: #032f62;
}

.regex-class {
  color: #6f42c1;
  font-weight: bold;
}

.regex-quantifier {
  color: #005cc5;
  font-weight: bold;
}

.regex-group {
  color: #22863a;
  font-weight: bold;
}

.error-message {
  color: #d73a49;
  margin-top: 10px;
  font-size: 0.9rem;
  padding: 8px;
  background: #ffebee;
  border-radius: 6px;
}

.success-message {
  color: #22863a;
  margin-top: 10px;
  font-size: 0.9rem;
  padding: 8px;
  background: #f0fff4;
  border-radius: 6px;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  margin-top: 5px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-pattern {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #667eea;
}

.suggestion-desc {
  font-size: 0.9rem;
  color: #666;
}

.test-section {
  margin-top: 30px;
}

.test-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.test-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 150px;
  resize: vertical;
  margin-bottom: 20px;
  transition: border-color 0.3s ease;
}

.test-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.test-results h3 {
  margin-bottom: 15px;
  color: #333;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-item {
  padding: 10px 14px;
  background: #f0fff4;
  border-radius: 8px;
  border-left: 4px solid #22863a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.match-index {
  font-weight: 700;
  color: #22863a;
  min-width: 40px;
}

.match-text {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
}

.no-matches {
  color: #666;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}
</style>
