<template>
  <div class="container">
    <div class="header">
      <h1>⚡ 网页性能分析工具</h1>
      <p>专业的Web性能指标检测与分析平台</p>
    </div>

    <div class="instructions">
      <h3>📋 使用说明</h3>
      <ul>
        <li>输入要分析的网页URL（包括http://或https://）</li>
        <li>点击"开始分析"按钮，系统将自动检测各项性能指标</li>
        <li>分析结果包括LCP、FID、FP等核心Web指标</li>
        <li>根据评分标准评估网页性能状况</li>
      </ul>
    </div>

    <div class="input-section">
      <div class="input-group">
        <input
          type="text"
          v-model="url"
          placeholder="请输入网页URL，例如：baidu.com 或 https://www.example.com"
          @keyup.enter="startAnalysis"
        />
        <button @click="startAnalysis" :disabled="loading || !url">
          {{ loading ? '分析中...' : '开始分析' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在分析网页性能，请稍候...</p>
    </div>

    <div v-if="results && !loading" class="results">
      <div class="metric-card">
        <div class="metric-label">分析网址</div>
        <div class="metric-value" style="font-size: 1.5rem; word-break: break-all;">{{ results.url }}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">最大内容绘制 (LCP)</div>
        <div class="metric-value">{{ results.lcp.value.toFixed(2) }}</div>
        <div class="metric-unit">秒</div>
        <div :class="['metric-status', getStatusClass(results.lcp.status)]">
          {{ results.lcp.statusText }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">首次输入延迟 (FID)</div>
        <div class="metric-value">{{ results.fid.value.toFixed(2) }}</div>
        <div class="metric-unit">毫秒</div>
        <div :class="['metric-status', getStatusClass(results.fid.status)]">
          {{ results.fid.statusText }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">首次绘制时间 (FP)</div>
        <div class="metric-value">{{ results.fp.value.toFixed(2) }}</div>
        <div class="metric-unit">秒</div>
        <div :class="['metric-status', getStatusClass(results.fp.status)]">
          {{ results.fp.statusText }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">页面完全加载时间</div>
        <div class="metric-value">{{ results.loadTime.value.toFixed(2) }}</div>
        <div class="metric-unit">秒</div>
        <div :class="['metric-status', getStatusClass(results.loadTime.status)]">
          {{ results.loadTime.statusText }}
        </div>
      </div>
    </div>

    <div v-if="results && !loading" class="chart-section">
      <h3>📊 性能时间线</h3>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-icon">1</div>
          <div class="timeline-content">
            <h4>首次绘制 (FP)</h4>
            <p>{{ results.fp.value.toFixed(2) }} 秒 - 页面开始渲染的时间点</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">2</div>
          <div class="timeline-content">
            <h4>最大内容绘制 (LCP)</h4>
            <p>{{ results.lcp.value.toFixed(2) }} 秒 - 主要内容加载完成时间</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">3</div>
          <div class="timeline-content">
            <h4>首次输入延迟 (FID)</h4>
            <p>{{ results.fid.value.toFixed(2) }} 毫秒 - 用户交互响应速度</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">4</div>
          <div class="timeline-content">
            <h4>页面完全加载</h4>
            <p>{{ results.loadTime.value.toFixed(2) }} 秒 - 所有资源加载完成</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const url = ref('')
const loading = ref(false)
const error = ref('')
const results = ref(null)

const startAnalysis = async () => {
  if (!url.value) {
    error.value = '请输入要分析的网页URL'
    return
  }

  // 完善的URL格式验证 - 支持带协议和不带协议的格式
  let validatedUrl = url.value.trim()
  
  // 基本格式校验：不能是纯数字或纯字母，至少需要包含点号
  if (!validatedUrl.includes('.')) {
    error.value = '请输入有效的URL地址，域名需要包含点号（.），例如：baidu.com'
    return
  }
  
  // 检查是否包含至少两个部分（如：xxx.yyy）
  const parts = validatedUrl.split('.')
  if (parts.length < 2 || parts.some(part => part.trim() === '')) {
    error.value = '请输入有效的URL地址，例如：baidu.com 或 www.example.com'
    return
  }
  
  // 如果URL不包含协议，自动添加https://
  if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
    validatedUrl = 'https://' + validatedUrl
  }
  
  // 验证URL格式
  try {
    new URL(validatedUrl)
  } catch (e) {
    error.value = '请输入有效的URL地址，例如：baidu.com 或 https://www.example.com'
    return
  }

  loading.value = true
  error.value = ''
  results.value = null

  try {
    // 模拟性能分析过程
    await simulatePerformanceAnalysis(validatedUrl)
  } catch (err) {
    error.value = '分析过程中出现错误，请重试'
    loading.value = false
  }
}

const simulatePerformanceAnalysis = async (validatedUrl) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 生成模拟的性能数据（实际应用中应使用真实的性能API）
  // 这里可以根据不同的URL生成不同的模拟数据
  const lcp = Math.random() * 3 + 0.5 // 0.5-3.5秒
  const fid = Math.random() * 300 + 10 // 10-310毫秒
  const fp = Math.random() * 1.5 + 0.2 // 0.2-1.7秒
  const loadTime = Math.random() * 4 + 0.8 // 0.8-4.8秒

  results.value = {
    url: validatedUrl,
    lcp: {
      value: lcp,
      status: getLCPStatus(lcp),
      statusText: getLCPStatusText(lcp)
    },
    fid: {
      value: fid,
      status: getFIDStatus(fid),
      statusText: getFIDStatusText(fid)
    },
    fp: {
      value: fp,
      status: getFPStatus(fp),
      statusText: getFPStatusText(fp)
    },
    loadTime: {
      value: loadTime,
      status: getLoadTimeStatus(loadTime),
      statusText: getLoadTimeStatusText(loadTime)
    }
  }

  loading.value = false
}

const getLCPStatus = (value) => {
  if (value <= 2.5) return 'good'
  if (value <= 4) return 'fair'
  return 'poor'
}

const getLCPStatusText = (value) => {
  if (value <= 2.5) return '优秀（≤2.5秒）'
  if (value <= 4) return '一般（2.5-4秒）'
  return '较差（>4秒）'
}

const getFIDStatus = (value) => {
  if (value <= 100) return 'good'
  if (value <= 300) return 'fair'
  return 'poor'
}

const getFIDStatusText = (value) => {
  if (value <= 100) return '优秀（≤100毫秒）'
  if (value <= 300) return '一般（100-300毫秒）'
  return '较差（>300毫秒）'
}

const getFPStatus = (value) => {
  if (value <= 1) return 'good'
  if (value <= 1.5) return 'fair'
  return 'poor'
}

const getFPStatusText = (value) => {
  if (value <= 1) return '优秀（≤1秒）'
  if (value <= 1.5) return '一般（1-1.5秒）'
  return '较差（>1.5秒）'
}

const getLoadTimeStatus = (value) => {
  if (value <= 3) return 'good'
  if (value <= 5) return 'fair'
  return 'poor'
}

const getLoadTimeStatusText = (value) => {
  if (value <= 3) return '优秀（≤3秒）'
  if (value <= 5) return '一般（3-5秒）'
  return '较差（>5秒）'
}

const getStatusClass = (status) => {
  return `status-${status}`
}
</script>