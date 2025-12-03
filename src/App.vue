<template>
  <div class="regex-tool">
    <div class="tool-header">
      <h1>正则表达式工具</h1>
      <p>语法高亮、智能提示、实时验证</p>
    </div>
    
    <div class="tool-body">
      <!-- 正则表达式输入区域 -->
      <div class="input-section">
        <div class="section-title">正则表达式</div>
        <div class="relative">
          <div class="regex-input-wrapper">
            <textarea
              v-model="regexPattern"
              class="regex-input"
              placeholder="输入正则表达式..."
              @input="onRegexChange"
              @keydown="onKeyDown"
              @focus="showSuggestions = true"
              @blur="onBlur"
              ref="regexInput"
            ></textarea>
            <div class="regex-highlight" v-html="highlightedRegex"></div>
          </div>
          
          <!-- 智能提示 -->
          <div class="suggestions" v-if="showSuggestions && filteredSuggestions.length > 0">
            <div
              class="suggestion-item"
              v-for="(suggestion, index) in filteredSuggestions"
              :key="index"
              @click="insertSuggestion(suggestion.pattern)"
            >
              <span class="suggestion-name">{{ suggestion.name }}</span>
              <span class="suggestion-pattern">{{ suggestion.pattern }}</span>
            </div>
          </div>
        </div>
        
        <!-- 语法验证状态 -->
        <div class="regex-status">
          <div class="status-indicator" :class="{ 'status-valid': isRegexValid, 'status-invalid': !isRegexValid }"></div>
          <span class="status-text" :class="{ 'valid': isRegexValid, 'invalid': !isRegexValid }">
            {{ isRegexValid ? '语法有效' : '语法错误' }}
          </span>
        </div>
        
        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
      </div>

      <!-- 测试字符串输入区域 -->
      <div class="input-section">
        <div class="section-title">测试字符串</div>
        <textarea
          v-model="testString"
          class="test-input"
          placeholder="输入要测试的字符串..."
          @input="onTestStringChange"
        ></textarea>
      </div>

      <!-- 匹配结果 -->
      <div class="results-section">
        <div class="section-title">匹配结果</div>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">匹配次数</span>
            <span class="stat-value">{{ matchCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">匹配位置</span>
            <span class="stat-value">{{ matchPositions }}</span>
          </div>
        </div>
        <div class="matches-list">
          <div class="match-item" v-for="(match, index) in matches" :key="index">
            {{ index + 1 }}. {{ match }}
          </div>
        </div>
      </div>

      <!-- 常用快捷方式 -->
      <div class="shortcuts">
        <div class="section-title">常用模式</div>
        <div class="shortcuts-grid">
          <button class="shortcut-btn" v-for="(pattern, name) in shortcuts" :key="name" @click="insertPattern(pattern)">
            {{ name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const regexPattern = ref('')
const testString = ref('')
const errorMessage = ref('')
const matches = ref([])
const matchCount = ref(0)
const matchPositions = ref('')
const isRegexValid = ref(true)
const showSuggestions = ref(false)
const regexInput = ref(null)
const timeoutId = ref(null)

// 智能提示列表
const suggestionList = [
  { name: '字符类: 数字', pattern: '[0-9]' },
  { name: '字符类: 字母', pattern: '[a-zA-Z]' },
  { name: '字符类: 空白字符', pattern: '\\s' },
  { name: '字符类: 单词字符', pattern: '\\w' },
  { name: '量词: 任意次数', pattern: '*' },
  { name: '量词: 至少一次', pattern: '+' },
  { name: '量词: 可选', pattern: '?' },
  { name: '量词: 次数范围', pattern: '{n,m}' },
  { name: '锚点: 行首', pattern: '^' },
  { name: '锚点: 行尾', pattern: '$' },
  { name: '分组: 捕获组', pattern: '()' },
  { name: '分组: 非捕获组', pattern: '(?:)' },
  { name: '转义: 特殊字符', pattern: '\\.' },
  { name: '选择: 或', pattern: '|' },
  { name: '断言: 正向前瞻', pattern: '(?=)' },
  { name: '断言: 负向前瞻', pattern: '(?!' },
  { name: '重复: 前一个字符', pattern: '\\1' },
  { name: '范围: 数字范围', pattern: '[0-5]' },
  { name: '范围: 字母范围', pattern: '[a-z]' },
  { name: '否定: 非数字', pattern: '[^0-9]' }
]

// 常用正则表达式快捷方式
const shortcuts = {
  '邮箱地址': '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  '手机号': '^1[3-9]\\d{9}$',
  'IP地址': '^(\\d{1,3}\\.){3}\\d{1,3}$',
  'URL地址': '^https?:\\/\\/[^\\s]+$',
  '身份证号': '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$',
  '邮政编码': '^\\d{6}$',
  '日期 (YYYY-MM-DD)': '^\\d{4}-\\d{2}-\\d{2}$',
  '时间 (HH:MM:SS)': '^\\d{2}:\\d{2}:\\d{2}$',
  '整数': '^-?\\d+$',
  '浮点数': '^-?\\d+\\.\\d+$',
  '中文字符': '^[\\u4e00-\\u9fa5]+$',
  '用户名 (字母数字下划线)': '^[a-zA-Z0-9_]+$'
}

// 过滤智能提示
const filteredSuggestions = computed(() => {
  if (!regexPattern.value.trim()) {
    return suggestionList.slice(0, 10)
  }
  
  const input = regexPattern.value.toLowerCase()
  return suggestionList.filter(suggestion => {
    return suggestion.name.toLowerCase().includes(input) || 
           suggestion.pattern.includes(input)
  }).slice(0, 10)
})

// 语法高亮
const highlightedRegex = computed(() => {
  if (!regexPattern.value) return ''
  
  let html = regexPattern.value
  
  // 语法规则
  const rules = [
    { regex: /([\\\\].)/g, className: 'escape' },           // 转义字符
    { regex: /([\\[\\]]|[\\^\\-\\+\\?\\*\\.\\(\\)\\|\\{\\}])/g, className: 'character' }, // 元字符
    { regex: /([+*?]|{\\d+(,\\d*)?})/g, className: 'quantifier' }, // 量词
    { regex: /([(\\)])/g, className: 'group' },             // 分组
    { regex: /(\\[.*?\\])/g, className: 'character-class' }, // 字符类
    { regex: /(^|\\$)/g, className: 'anchor' },             // 锚点
  ]
  
  // 应用高亮
  rules.forEach(rule => {
    html = html.replace(rule.regex, (match) => {
      return `<span class="${rule.className}">${escapeHtml(match)}</span>`
    })
  })
  
  return html
})

// 转义HTML特殊字符
const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 检查正则表达式语法
const validateRegex = (pattern) => {
  if (!pattern) {
    errorMessage.value = ''
    isRegexValid.value = true
    return true
  }
  
  try {
    new RegExp(pattern)
    errorMessage.value = ''
    isRegexValid.value = true
    return true
  } catch (err) {
    errorMessage.value = `语法错误: ${err.message}`
    isRegexValid.value = false
    return false
  }
}

// 处理输入框失焦
const onBlur = () => {
  timeoutId.value = setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 清理定时器
const clearTimeoutId = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
    timeoutId.value = null
  }
}

// 插入智能提示
const insertSuggestion = (pattern) => {
  const cursorPos = regexInput.value ? regexInput.value.selectionStart : regexPattern.value.length
  const start = regexPattern.value.slice(0, cursorPos)
  const end = regexPattern.value.slice(cursorPos)
  regexPattern.value = start + pattern + end
  showSuggestions.value = false
  setTimeout(() => {
    regexInput.value.focus()
    const newPos = cursorPos + pattern.length
    regexInput.value.setSelectionRange(newPos, newPos)
  }, 0)
  onRegexChange()
}

// 测试匹配
const testMatch = () => {
  // 先验证正则表达式语法
  if (!validateRegex(regexPattern.value)) {
    matches.value = []
    matchCount.value = 0
    matchPositions.value = ''
    return
  }
  
  if (!regexPattern.value || !testString.value) {
    matches.value = []
    matchCount.value = 0
    matchPositions.value = ''
    return
  }
  
  try {
    const regex = new RegExp(regexPattern.value, 'g')
    const results = [...testString.value.matchAll(regex)]
    
    matches.value = results.map(r => r[0])
    matchCount.value = results.length
    
    if (results.length > 0) {
      matchPositions.value = results.map((r, i) => `${i + 1}: ${r.index}`).join(', ')
    } else {
      matchPositions.value = '无'
    }
  } catch (err) {
    matches.value = []
    matchCount.value = 0
    matchPositions.value = ''
    errorMessage.value = `匹配错误: ${err.message}`
    isRegexValid.value = false
  }
}

// 正则表达式变化时
const onRegexChange = () => {
  validateRegex(regexPattern.value)
  testMatch()
}

// 测试字符串变化时
const onTestStringChange = () => {
  testMatch()
}

// 插入快捷模式
const insertPattern = (pattern) => {
  regexPattern.value = pattern
  validateRegex(pattern)
  testMatch()
}

// 键盘快捷键
const onKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        testMatch()
        break
      case 'Backspace':
        if (!regexPattern.value) {
          errorMessage.value = ''
        }
        break
    }
  }
  
  // 智能提示导航
  if (showSuggestions.value && filteredSuggestions.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // 可以实现键盘导航
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // 可以实现键盘导航
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // 可以实现快速选择第一个
    }
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  clearTimeoutId()
})
</script>