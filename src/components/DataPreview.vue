<template>
  <div class="data-preview-container">
    <a-row :gutter="16">
      <!-- 数据统计信息 -->
      <a-col :span="12">
        <a-card title="数据统计信息" class="stats-card">
          <a-statistic-group>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-statistic title="总行数" :value="data.length" />
              </a-col>
              <a-col :span="12">
                <a-statistic title="总列数" :value="columns.length" />
              </a-col>
            </a-row>

            <a-divider style="margin: 16px 0;" />

            <!-- 数值列统计 -->
            <div v-for="col in numericColumns" :key="col" style="margin-bottom: 16px;">
              <h4 style="margin-bottom: 8px; color: #666;">{{ col }}</h4>
              <a-row :gutter="8">
                <a-col :span="6">
                  <a-statistic title="最大值" :value="columnStats[col]?.max || 0" :precision="2" />
                </a-col>
                <a-col :span="6">
                  <a-statistic title="最小值" :value="columnStats[col]?.min || 0" :precision="2" />
                </a-col>
                <a-col :span="6">
                  <a-statistic title="平均值" :value="columnStats[col]?.mean || 0" :precision="2" />
                </a-col>
                <a-col :span="6">
                  <a-statistic title="中位数" :value="columnStats[col]?.median || 0" :precision="2" />
                </a-col>
              </a-row>
            </div>
          </a-statistic-group>
        </a-card>
      </a-col>

      <!-- 数据分布直方图 -->
      <a-col :span="12">
        <a-card title="数据分布直方图" class="histogram-card">
          <div style="margin-bottom: 16px;">
            <span>选择列：</span>
            <a-select v-model:value="selectedColumn" style="width: 200px; margin-left: 8px;">
              <a-select-option v-for="col in numericColumns" :key="col" :value="col">
                {{ col }}
              </a-select-option>
            </a-select>
          </div>

          <div ref="histogramRef" style="width: 100%; height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据预览表格 -->
    <a-card title="数据预览" class="table-card" style="margin-top: 24px;">
      <a-table
        :columns="tableColumns"
        :data-source="data"
        :pagination="{ pageSize: 15 }"
        bordered
        size="small"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="record[column.key] instanceof Date">
            {{ formatDate(record[column.key]) }}
          </template>
          <template v-else-if="typeof record[column.key] === 'number'">
            {{ record[column.key].toFixed(2) }}
          </template>
          <template v-else>
            {{ record[column.key] }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const histogramRef = ref(null)
const selectedColumn = ref('')
let histogramChart = null

// 计算列名
const columns = computed(() => {
  if (props.data && props.data.length > 0) {
    return Object.keys(props.data[0])
  }
  return []
})

// 计算数值列
const numericColumns = computed(() => {
  if (props.data && props.data.length > 0) {
    return columns.value.filter(col => {
      const firstValue = props.data[0][col]
      return typeof firstValue === 'number'
    })
  }
  return []
})

// 计算列统计信息
const columnStats = computed(() => {
  const stats = {}
  numericColumns.value.forEach(col => {
    const values = props.data
      .map(row => row[col])
      .filter(val => val !== null && val !== undefined && !isNaN(val))
      .map(val => Number(val))

    if (values.length > 0) {
      const sortedValues = [...values].sort((a, b) => a - b)
      const sum = values.reduce((a, b) => a + b, 0)
      const mid = Math.floor(sortedValues.length / 2)

      stats[col] = {
        max: Math.max(...values),
        min: Math.min(...values),
        mean: sum / values.length,
        median: sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2
      }
    }
  })
  return stats
})

// 计算表格列
const tableColumns = computed(() => {
  return columns.value.map(col => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true
  }))
})

// 格式化日期
const formatDate = (date) => {
  if (!(date instanceof Date)) return date
  return date.toLocaleString()
}

// 初始化直方图
const initHistogram = () => {
  if (!histogramRef.value) return

  histogramChart = echarts.init(histogramRef.value)
  updateHistogram()
}

// 更新直方图
const updateHistogram = () => {
  if (!histogramChart || !selectedColumn.value) return

  const values = props.data
    .map(row => row[selectedColumn.value])
    .filter(val => val !== null && val !== undefined && !isNaN(val))
    .map(val => Number(val))

  if (values.length === 0) return

  // 计算直方图数据
  const max = Math.max(...values)
  const min = Math.min(...values)
  const binSize = (max - min) / 10 || 1
  const bins = []

  for (let i = 0; i < 10; i++) {
    const binStart = min + i * binSize
    const binEnd = binStart + binSize
    const count = values.filter(val => val >= binStart && val < binEnd).length
    bins.push({
      name: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
      value: count
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: bins.map(item => item.name),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '频数'
    },
    series: [
      {
        name: '分布',
        type: 'bar',
        data: bins.map(item => item.value),
        itemStyle: {
          color: '#667eea'
        }
      }
    ]
  }

  histogramChart.setOption(option)
}

// 监听窗口大小变化
const handleResize = () => {
  if (histogramChart) {
    histogramChart.resize()
  }
}

// 监听选择列变化
watch(selectedColumn, () => {
  updateHistogram()
})

// 监听数据变化
watch(() => props.data, () => {
  // 初始化选择第一列
  if (numericColumns.value.length > 0 && !selectedColumn.value) {
    selectedColumn.value = numericColumns.value[0]
  }
  updateHistogram()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initHistogram()
    window.addEventListener('resize', handleResize)

    // 初始化选择第一列
    if (numericColumns.value.length > 0) {
      selectedColumn.value = numericColumns.value[0]
    }
  })
})
</script>

<style scoped>
.data-preview-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-card,
.histogram-card {
  min-height: 400px;
}

.table-card {
  min-height: 500px;
}
</style>
