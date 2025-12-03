<template>
  <div class="container">
    <h1>⚡ Web性能分析工具</h1>
    <p class="subtitle">专业的网页性能检测与优化建议</p>
    
    <div class="input-section">
      <input 
        v-model="url" 
        type="url" 
        placeholder="请输入要分析的网页URL（例如：baidu.com 或 https://example.com）" 
        class="url-input"
        @keyup.enter="analyzePerformance"
      />
      <button 
        @click="analyzePerformance" 
        :disabled="analyzing" 
        class="analyze-btn"
      >
        {{ analyzing ? '分析中...' : '开始分析' }}
      </button>
    </div>
    
    <div v-if="analyzing" class="loading">
      <div class="spinner"></div>
      <p>正在分析网页性能，请稍候...</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-if="results" class="results">
      <h2 style="margin-bottom: 20px; color: #333;">分析结果</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">LCP (最大内容绘制)</div>
          <div class="metric-value">{{ results.lcp.value }}</div>
          <div class="metric-unit">ms</div>
          <span class="metric-status" :class="results.lcp.statusClass">{{ results.lcp.status }}</span>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">FID (首次输入延迟)</div>
          <div class="metric-value">{{ results.fid.value }}</div>
          <div class="metric-unit">ms</div>
          <span class="metric-status" :class="results.fid.statusClass">{{ results.fid.status }}</span>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">FP (首次绘制)</div>
          <div class="metric-value">{{ results.fp.value }}</div>
          <div class="metric-unit">ms</div>
          <span class="metric-status" :class="results.fp.statusClass">{{ results.fp.status }}</span>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">页面完全加载时间</div>
          <div class="metric-value">{{ results.loadTime.value }}</div>
          <div class="metric-unit">ms</div>
          <span class="metric-status" :class="results.loadTime.statusClass">{{ results.loadTime.status }}</span>
        </div>
      </div>
      
      <div class="details">
        <h3>详细信息</h3>
        <div class="detail-item">
          <span class="detail-label">分析时间</span>
          <span class="detail-value">{{ results.timestamp }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">分析URL</span>
          <span class="detail-value">{{ results.analyzedUrl }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">性能综合评分</span>
          <span class="detail-value">{{ results.overallScore }}/100</span>
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
      url: '',
      analyzing: false,
      error: null,
      results: null
    }
  },
  methods: {
    async analyzePerformance() {
      if (!this.url) {
        this.error = '请输入有效的URL地址'
        return
      }
      
      // URL格式校验 - 支持带协议和不带协议的格式
      let validatedUrl = this.url.trim()
      
      // 如果没有协议前缀，自动添加https://
      if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
        validatedUrl = 'https://' + validatedUrl
      }
      
      // 验证URL格式
      try {
        new URL(validatedUrl)
        this.url = validatedUrl // 更新为带协议的URL
      } catch (e) {
        this.error = '请输入有效的URL格式（例如：baidu.com 或 https://example.com）'
        return
      }
      
      this.analyzing = true
      this.error = null
      this.results = null
      
      try {
        // 模拟性能分析过程
        await this.simulatePerformanceAnalysis()
      } catch (e) {
        this.error = '分析过程中出现错误，请稍后重试'
        console.error(e)
      } finally {
        this.analyzing = false
      }
    },
    
    async simulatePerformanceAnalysis() {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 生成模拟的性能数据（实际应用中应通过真实的性能API获取）
      const lcp = this.generateMetric(1000, 3000) // LCP: 1000-3000ms
      const fid = this.generateMetric(50, 300)    // FID: 50-300ms
      const fp = this.generateMetric(500, 2000)   // FP: 500-2000ms
      const loadTime = this.generateMetric(1500, 5000) // 页面加载时间: 1500-5000ms
      
      // 计算综合评分
      const overallScore = Math.round(
        (this.getScore(lcp) + this.getScore(fid) + this.getScore(fp) + this.getScore(loadTime)) / 4
      )
      
      this.results = {
        lcp: this.evaluateMetric(lcp, 'lcp'),
        fid: this.evaluateMetric(fid, 'fid'),
        fp: this.evaluateMetric(fp, 'fp'),
        loadTime: this.evaluateMetric(loadTime, 'loadTime'),
        timestamp: new Date().toLocaleString('zh-CN'),
        analyzedUrl: this.url,
        overallScore: overallScore
      }
    },
    
    generateMetric(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    
    evaluateMetric(value, type) {
      let status, statusClass
      
      switch (type) {
        case 'lcp':
          if (value < 2500) {
            status = '良好'
            statusClass = 'status-good'
          } else if (value < 4000) {
            status = '一般'
            statusClass = 'status-warning'
          } else {
            status = '较差'
            statusClass = 'status-poor'
          }
          break
          
        case 'fid':
          if (value < 100) {
            status = '良好'
            statusClass = 'status-good'
          } else if (value < 300) {
            status = '一般'
            statusClass = 'status-warning'
          } else {
            status = '较差'
            statusClass = 'status-poor'
          }
          break
          
        case 'fp':
          if (value < 1000) {
            status = '良好'
            statusClass = 'status-good'
          } else if (value < 2500) {
            status = '一般'
            statusClass = 'status-warning'
          } else {
            status = '较差'
            statusClass = 'status-poor'
          }
          break
          
        case 'loadTime':
          if (value < 3000) {
            status = '良好'
            statusClass = 'status-good'
          } else if (value < 5000) {
            status = '一般'
            statusClass = 'status-warning'
          } else {
            status = '较差'
            statusClass = 'status-poor'
          }
          break
      }
      
      return {
        value: value,
        status: status,
        statusClass: statusClass
      }
    },
    
    getScore(value) {
      // 简单的评分算法，实际应用中应更复杂
      if (value < 1000) return 100
      if (value < 2000) return 80
      if (value < 3000) return 60
      if (value < 4000) return 40
      return 20
    }
  }
}
</script>