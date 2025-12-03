<template>
  <div class="data-preview">
    <el-row gutter="20">
      <!-- 数据统计信息 -->
      <el-col :span="8">
        <el-card title="数据统计信息" class="stats-card">
          <el-form label-width="100px">
            <el-form-item label="选择字段">
              <el-select 
                v-model="selectedField" 
                placeholder="选择字段" 
                @change="updateStats"
              >
                <el-option 
                  v-for="field in numericFields" 
                  :key="field.key" 
                  :label="field.name" 
                  :value="field.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数据总量">
              <el-input :value="data.length" disabled />
            </el-form-item>
            <el-form-item label="最大值">
              <el-input :value="stats.max" disabled />
            </el-form-item>
            <el-form-item label="最小值">
              <el-input :value="stats.min" disabled />
            </el-form-item>
            <el-form-item label="平均值">
              <el-input :value="stats.avg" disabled />
            </el-form-item>
            <el-form-item label="总和">
              <el-input :value="stats.sum" disabled />
            </el-form-item>
            <el-form-item label="标准差">
              <el-input :value="stats.stdDev" disabled />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 数据分布直方图 -->
      <el-col :span="16">
        <el-card title="数据分布直方图" class="chart-card">
          <div class="chart-container">
            <canvas ref="histogramCanvas"></canvas>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 原始数据表格预览 -->
    <el-card title="原始数据表格预览" class="table-card">
      <div class="table-controls">
        <span>显示 {{ displayData.length }} 条数据</span>
        <el-input
          v-model="searchText"
          placeholder="搜索数据"
          style="width: 300px; margin-left: 20px;"
          @input="filterTable"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <el-table :data="displayData" border max-height="500">
        <el-table-column
          v-for="field in fields"
          :key="field.key"
          :prop="field.key"
          :label="field.name"
          :min-width="120"
        />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  fields: {
    type: Array,
    required: true
  }
})

const selectedField = ref('')
const searchText = ref('')
const histogramCanvas = ref(null)
const chartInstance = ref(null)

// 计算数值字段
const numericFields = computed(() => {
  return props.fields.filter(field => {
    const values = props.data.map(row => row[field.key]).filter(v => v !== '' && v != null)
    return values.every(v => !isNaN(v))
  })
})

// 统计数据
const stats = ref({
  max: '',
  min: '',
  avg: '',
  sum: '',
  stdDev: ''
})

// 显示数据（带搜索过滤）
const displayData = ref(JSON.parse(JSON.stringify(props.data)))

// 初始化选中字段
onMounted(() => {
  if (numericFields.value.length > 0) {
    selectedField.value = numericFields.value[0].key
  }
  nextTick(() => {
    updateStats()
    renderHistogram()
  })
})

// 更新统计信息
const updateStats = () => {
  if (!selectedField.value) return
  
  const values = props.data
    .map(row => row[selectedField.value])
    .filter(v => v !== '' && v != null && !isNaN(v))
    .map(v => Number(v))
  
  if (values.length === 0) {
    stats.value = {
      max: '',
      min: '',
      avg: '',
      sum: '',
      stdDev: ''
    }
    return
  }
  
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  stats.value = {
    max: max.toFixed(2),
    min: min.toFixed(2),
    avg: avg.toFixed(2),
    sum: sum.toFixed(2),
    stdDev: stdDev.toFixed(2)
  }
  
  renderHistogram()
}

// 渲染直方图
const renderHistogram = () => {
  if (!selectedField.value || !histogramCanvas.value) return
  
  const values = props.data
    .map(row => row[selectedField.value])
    .filter(v => v !== '' && v != null && !isNaN(v))
    .map(v => Number(v))
  
  if (values.length === 0) return
  
  // 销毁旧图表
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  // 创建新图表
  const ctx = histogramCanvas.value.getContext('2d')
  const bins = calculateBins(values)
  
  chartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.labels,
      datasets: [{
        label: `${selectedField.value} 分布`,
        data: bins.counts,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '频数'
          }
        },
        x: {
          title: {
            display: true,
            text: '数值范围'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  })
}

// 计算直方图 bins
const calculateBins = (values) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = Math.min(10, values.length)
  const binWidth = (max - min) / binCount
  
  const bins = []
  for (let i = 0; i < binCount; i++) {
    bins.push({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0
    })
  }
  
  values.forEach(value => {
    for (let i = 0; i < bins.length; i++) {
      if (value <= bins[i].end || i === bins.length - 1) {
        bins[i].count++
        break
      }
    }
  })
  
  return {
    labels: bins.map(bin => `${bin.start.toFixed(1)}-${bin.end.toFixed(1)}`),
    counts: bins.map(bin => bin.count)
  }
}

// 表格搜索过滤
const filterTable = () => {
  if (!searchText.value) {
    displayData.value = JSON.parse(JSON.stringify(props.data))
    return
  }
  
  const search = searchText.value.toLowerCase()
  displayData.value = props.data.filter(row => {
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(search)
    )
  })
}

// 监听数据变化
watch(() => props.data, (newData) => {
  displayData.value = JSON.parse(JSON.stringify(newData))
  if (numericFields.value.length > 0 && !selectedField.value) {
    selectedField.value = numericFields.value[0].key
  }
  nextTick(() => {
    updateStats()
    renderHistogram()
  })
}, { deep: true })

// 监听选中字段变化
watch(selectedField, () => {
  updateStats()
})
</script>

<style scoped>
.data-preview {
  padding: 20px;
}

.stats-card,
.chart-card {
  height: 100%;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.table-card {
  margin-top: 20px;
}

.table-controls {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.table-controls span {
  font-weight: bold;
}
</style>