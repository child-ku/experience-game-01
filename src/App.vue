<template>
  <div class="regex-tool">
    <h1 class="title">正则表达式工具</h1>
    
    <!-- 快捷插入按钮 -->
    <div class="quick-insert">
      <h3>快捷插入</h3>
      <div class="button-group">
        <button v-for="(pattern, key) in quickPatterns" :key="key" @click="insertPattern(pattern)">
          {{ key }}
        </button>
      </div>
    </div>
    
    <!-- 正则表达式输入区域 -->
    <div class="regex-input-section">
      <div class="input-container">
        <span class="slash">/</span>
        <input 
          ref="regexInput" 
          v-model="regex" 
          @input="onRegexInput" 
          @keyup="onKeyUp" 
          @keydown="onKeyDown" 
          placeholder="输入正则表达式..."
          class="regex-input"
        >
        <span class="slash">/</span>
        <input v-model="flags" placeholder="flags" class="flags-input">
      </div>
      
      <!-- 语法高亮显示 -->
      <div class="highlight-container" v-if="highlightedHTML">
        <span class="slash">/</span>
        <div v-html="highlightedHTML" class="highlight"></div>
        <span class="slash">/</span>
        <span class="flags">{{ flags }}</span>
      </div>
      
      <!-- 语法错误提示 -->
      <div class="error-message" v-if="errorMessage">
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- 智能提示 -->
    <div class="suggestions" v-if="showSuggestions && suggestions.length">
      <div 
        v-for="(suggestion, index) in suggestions" 
        :key="index" 
        :class="{ active: selectedSuggestion === index }"
        @click="selectSuggestionItem(suggestion)"
        class="suggestion-item"
      >
        <span class="suggestion-pattern">{{ suggestion.pattern }}</span>
        <span class="suggestion-description">{{ suggestion.description }}</span>
      </div>
    </div>
    
    <!-- 测试字符串输入区域 -->
    <div class="test-section">
      <h3>测试字符串</h3>
      <textarea v-model="testString" @input="onTestInput" placeholder="输入测试字符串..." class="test-input"></textarea>
      
      <!-- 匹配结果 -->
      <div class="results" v-if="matches.length">
        <h4>匹配结果</h4>
        <div class="match-item" v-for="(match, index) in matches" :key="index">
          <span class="match-index">{{ index + 1 }}.</span>
          <span class="match-text">{{ match }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      regex: '',
      flags: '',
      testString: '',
      errorMessage: '',
      highlightedHTML: '',
      suggestions: [],
      showSuggestions: false,
      selectedSuggestion: 0,
      quickPatterns: {
        '邮箱': '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        '手机号': '1[3-9]\\d{9}',
        'IP地址': '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}',
        'URL': 'https?://[^\\s/$.?#].[^\\s]*',
        '日期 (YYYY-MM-DD)': '\\d{4}-\\d{2}-\\d{2}',
        '时间 (HH:MM:SS)': '\\d{2}:\\d{2}:\\d{2}',
        '整数': '-?\\d+',
        '小数': '-?\\d+\\.\\d+'
      },
      suggestionPatterns: [
        { pattern: '.', description: '匹配任意字符' },
        { pattern: '\\d', description: '匹配数字' },
        { pattern: '\\D', description: '匹配非数字' },
        { pattern: '\\w', description: '匹配单词字符' },
        { pattern: '\\W', description: '匹配非单词字符' },
        { pattern: '\\s', description: '匹配空白字符' },
        { pattern: '\\S', description: '匹配非空白字符' },
        { pattern: '[abc]', description: '匹配a、b或c' },
        { pattern: '[^abc]', description: '匹配除a、b、c外的任意字符' },
        { pattern: 'a|b', description: '匹配a或b' },
        { pattern: 'a*', description: '匹配0个或多个a' },
        { pattern: 'a+', description: '匹配1个或多个a' },
        { pattern: 'a?', description: '匹配0个或1个a' },
        { pattern: 'a{5}', description: '匹配5个a' },
        { pattern: 'a{2,}', description: '匹配2个或多个a' },
        { pattern: 'a{2,5}', description: '匹配2到5个a' },
        { pattern: '^a', description: '匹配开头的a' },
        { pattern: 'a$', description: '匹配结尾的a' },
        { pattern: '(abc)', description: '分组匹配abc' },
        { pattern: '\\1', description: '引用第一个分组' }
      ]
    }
  },
  computed: {
    matches() {
      if (!this.regex) return []
      
      try {
        const regex = new RegExp(this.regex, this.flags)
        const result = this.testString.match(regex)
        return result || []
      } catch (e) {
        return []
      }
    }
  },
  methods: {
    insertPattern(pattern) {
      this.regex = pattern
      this.onRegexInput()
    },
    onRegexInput() {
      this.validateRegex()
      this.highlightSyntax()
      this.showSuggestionsList()
    },
    onTestInput() {
      // 测试字符串变化时自动更新匹配结果
    },
    onKeyUp(e) {
      if (this.showSuggestions) {
        if (e.key === 'ArrowDown') {
          this.selectedSuggestion = (this.selectedSuggestion + 1) % this.suggestions.length
        } else if (e.key === 'ArrowUp') {
          this.selectedSuggestion = (this.selectedSuggestion - 1 + this.suggestions.length) % this.suggestions.length
        } else if (e.key === 'Enter') {
          e.preventDefault()
          this.selectSuggestionItem(this.suggestions[this.selectedSuggestion])
        }
      }
    },
    onKeyDown(e) {
      if (e.key === 'Tab' && this.showSuggestions) {
        e.preventDefault()
        this.selectSuggestionItem(this.suggestions[this.selectedSuggestion])
      }
    },
    validateRegex() {
      if (!this.regex) {
        this.errorMessage = ''
        return
      }
      
      try {
        new RegExp(this.regex, this.flags)
        this.errorMessage = ''
      } catch (e) {
        this.errorMessage = e.message
      }
    },
    highlightSyntax() {
      if (!this.regex) {
        this.highlightedHTML = ''
        return
      }
      
      let html = this.escapeHtml(this.regex)
      
      // 语法高亮规则 - 按优先级从高到低排列
      const rules = [
        { regex: /(\\d|\\D|\\w|\\W|\\s|\\S)/g, className: 'regex-char-class' },
        { regex: /(\*|\+|\?|\{|\})/g, className: 'regex-quantifier' },
        { regex: /(\(|\))/g, className: 'regex-group' },
        { regex: /(\[|\])/g, className: 'regex-bracket' },
        { regex: /(\^|\$)/g, className: 'regex-anchor' },
        { regex: /(\\[^dDwWsS])/g, className: 'regex-escape' },
        { regex: /(\|)/g, className: 'regex-or' },
        { regex: /(\.)/g, className: 'regex-dot' }
      ]
      
      // 应用高亮
      rules.forEach(rule => {
        html = html.replace(rule.regex, match => `<span class="${rule.className}">${match}</span>`)
      })
      
      // 处理普通字符 - 匹配不在span标签内的所有字符
      html = html.replace(/(?<!<\/span>)((?:(?!<span|\/span>).)+)/g, match => `<span class="regex-normal">${match}</span>`)
      
      this.highlightedHTML = html
    },
    showSuggestionsList() {
      if (!this.regex) {
        this.suggestions = []
        this.showSuggestions = false
        return
      }
      
      // 根据输入内容过滤建议
      const filtered = this.suggestionPatterns.filter(suggestion => 
        suggestion.pattern.includes(this.regex) || suggestion.description.includes(this.regex)
      )
      
      this.suggestions = filtered.slice(0, 10) // 最多显示10个建议
      this.showSuggestions = this.suggestions.length > 0
      this.selectedSuggestion = 0
    },
    selectSuggestionItem(suggestion) {
      this.regex = suggestion.pattern
      this.showSuggestions = false
      this.onRegexInput()
      this.$refs.regexInput.focus()
    },
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
  }
}
</script>

<style scoped>
.regex-tool {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
  font-size: 2.5em;
  margin: 0;
}

.quick-insert {
  padding: 25px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.quick-insert h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.2em;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-group button {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.button-group button:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.regex-input-section {
  padding: 30px;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 15px;
}

.slash {
  color: #6c757d;
  font-size: 1.5em;
  font-weight: bold;
}

.regex-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 1.1em;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
}

.regex-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.flags-input {
  padding: 12px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 1.1em;
  font-family: 'Courier New', monospace;
  width: 80px;
  transition: all 0.3s ease;
}

.flags-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.highlight-container {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 15px;
}

.highlight {
  flex: 1;
  font-size: 1.1em;
  font-family: 'Courier New', monospace;
}

.flags {
  font-size: 1.1em;
  font-family: 'Courier New', monospace;
  color: #6c757d;
}

.regex-char-class {
  color: #e74c3c;
  font-weight: bold;
}

.regex-quantifier {
  color: #f39c12;
  font-weight: bold;
}

.regex-group {
  color: #3498db;
  font-weight: bold;
}

.regex-bracket {
  color: #9b59b6;
  font-weight: bold;
}

.regex-anchor {
  color: #1abc9c;
  font-weight: bold;
}

.regex-escape {
  color: #e67e22;
  font-weight: bold;
}

.regex-or {
  color: #c0392b;
  font-weight: bold;
}

.regex-dot {
  color: #7f8c8d;
  font-weight: bold;
}

.regex-normal {
  color: #2c3e50;
}

.error-message {
  color: #e74c3c;
  background: #fdf2f2;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #e74c3c;
  margin-bottom: 15px;
}

.suggestions {
  position: absolute;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 5px;
}

.suggestion-item {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-item.active {
  background: #667eea;
  color: white;
}

.suggestion-pattern {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  margin-right: 10px;
}

.suggestion-description {
  font-size: 0.9em;
  color: #6c757d;
}

.suggestion-item.active .suggestion-description {
  color: rgba(255, 255, 255, 0.8);
}

.test-section {
  padding: 0 30px 30px 30px;
}

.test-section h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.2em;
}

.test-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 1.1em;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  resize: vertical;
  min-height: 150px;
  transition: all 0.3s ease;
}

.test-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.results {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.results h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1em;
}

.match-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.match-index {
  color: #6c757d;
  font-weight: bold;
  margin-right: 10px;
  min-width: 30px;
}

.match-text {
  color: #2c3e50;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

@media (max-width: 768px) {
  .title {
    font-size: 2em;
    padding: 20px;
  }
  
  .quick-insert,
  .regex-input-section,
  .test-section {
    padding: 20px;
  }
  
  .button-group {
    gap: 8px;
  }
  
  .button-group button {
    padding: 6px 12px;
    font-size: 0.85em;
  }
}
</style>
