<template>
  <div id="app">
    <div class="container">
      <h1>⚡ Web 性能分析工具</h1>
      
      <div class="input-section">
        <input 
          type="url" 
          v-model="url" 
          placeholder="请输入要分析的网页 URL (例如: https://example.com)"
          @keyup.enter="analyze"
        >
        <button @click="analyze" :disabled="loading || !url.trim()">
          {{ loading ? '分析中...' : '开始分析' }}
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在分析网页性能...</p>
      </div>

      <div v-if="error" class="error">
        <p>{{ error }}</p>
      </div>

      <div v-if="metrics" class="results">
        <h2>核心 Web 指标</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-name">LCP (最大内容绘制)</div>
            <div class="metric-value">
              {{ formatTime(metrics.lcp) }}
              <span class="metric-unit">ms</span>
            </div>
            <span :class="['status', getStatus(metrics.lcp, 'lcp')]">
              {{ getStatusText(metrics.lcp, 'lcp') }}
            </span>
          </div>

          <div class="metric-card">
            <div class="metric-name">FID (首次输入延迟)</div>
            <div class="metric-value">
              {{ formatTime(metrics.fid) }}
              <span class="metric-unit">ms</span>
            </div>
            <span :class="['status', getStatus(metrics.fid, 'fid')]">
              {{ getStatusText(metrics.fid, 'fid') }}
            </span>
          </div>
        </div>

        <h2>加载时间分析</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-name">FP (首次绘制)</div>
            <div class="metric-value">
              {{ formatTime(metrics.fp) }}
              <span class="metric-unit">ms</span>
            </div>
            <span :class="['status', getStatus(metrics.fp, 'fp')]">
              {{ getStatusText(metrics.fp, 'fp') }}
            </span>
          </div>

          <div class="metric-card">
            <div class="metric-name">页面完全加载时间</div>
            <div class="metric-value">
              {{ formatTime(metrics.loadTime) }}
              <span class="metric-unit">ms</span>
            </div>
            <span :class="['status', getStatus(metrics.loadTime, 'loadTime')]">
              {{ getStatusText(metrics.loadTime, 'loadTime') }}
            </span>
          </div>
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
      loading: false,
      error: '',
      metrics: null
    }
  },
  methods: {
    isValidUrl(url) {
      // URL 格式校验正则表达式，支持带协议和不带协议的格式
      const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
      return urlRegex.test(url);
    },

    async analyze() {
      if (!this.url.trim()) {
        this.error = '请输入有效的 URL';
        return;
      }

      if (!this.isValidUrl(this.url.trim())) {
        this.error = 'URL 格式不正确，请输入类似 https://example.com 或 baidu.com 的格式';
        return;
      }

      // 如果 URL 没有协议前缀，自动添加 https://
      if (!this.url.trim().match(/^https?:\/\//)) {
        this.url = 'https://' + this.url.trim();
      }

      this.loading = true;
      this.error = '';
      this.metrics = null;

      try {
        // 模拟性能分析过程
        await this.simulatePerformanceAnalysis();
      } catch (err) {
        this.error = '分析失败: ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    async simulatePerformanceAnalysis() {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成模拟的性能数据
      this.metrics = {
        lcp: Math.floor(Math.random() * 3000) + 500,  // 500-3500 ms
        fid: Math.floor(Math.random() * 200) + 10,     // 10-210 ms
        fp: Math.floor(Math.random() * 2000) + 300,    // 300-2300 ms
        loadTime: Math.floor(Math.random() * 5000) + 1000  // 1000-6000 ms
      };
    },

    formatTime(ms) {
      return ms.toLocaleString();
    },

    getStatus(value, type) {
      // 根据不同指标的最佳实践返回状态
      switch (type) {
        case 'lcp':
          if (value < 2500) return 'good';
          if (value < 4000) return 'fair';
          return 'poor';
        case 'fid':
          if (value < 100) return 'good';
          if (value < 300) return 'fair';
          return 'poor';
        case 'fp':
          if (value < 1500) return 'good';
          if (value < 3000) return 'fair';
          return 'poor';
        case 'loadTime':
          if (value < 3000) return 'good';
          if (value < 5000) return 'fair';
          return 'poor';
        default:
          return 'fair';
      }
    },

    getStatusText(value, type) {
      const status = this.getStatus(value, type);
      switch (status) {
        case 'good':
          return '优秀';
        case 'fair':
          return '良好';
        case 'poor':
          return '需要改进';
        default:
          return '未知';
      }
    }
  }
}
</script>

<style scoped>
.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-section input {
  flex: 1;
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .input-section {
    flex-direction: column;
  }
}
</style>
