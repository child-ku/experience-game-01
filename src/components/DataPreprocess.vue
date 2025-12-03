<template>
  <div class="data-preprocess-container">
    <a-card title="数据预处理" class="preprocess-card">
      <a-collapse v-model:activeKey="activePanels">
        <!-- 空值处理 -->
        <a-collapse-panel key="1" header="空值处理">
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <span>处理方式：</span>
            <a-radio-group v-model:value="nullHandlingType" button-style="solid">
              <a-radio-button value="fill">填充</a-radio-button>
              <a-radio-button value="remove">删除</a-radio-button>
            </a-radio-group>
          </div>

          <a-form layout="vertical" v-if="nullHandlingType === 'fill'">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="填充值类型">
                  <a-select v-model:value="fillValueType">
                    <a-select-option value="zero">0</a-select-option>
                    <a-select-option value="mean">平均值</a-select-option>
                    <a-select-option value="median">中位数</a-select-option>
                    <a-select-option value="custom">自定义值</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="自定义填充值" v-if="fillValueType === 'custom'">
                  <a-input v-model:value="customFillValue" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <a-button type="primary" @click="handleNullValues" style="margin-top: 16px;">
            <template #icon>
              <CheckOutlined />
            </template>
            应用空值处理
          </a-button>
        </a-collapse-panel>

        <!-- 数据过滤 -->
        <a-collapse-panel key="2" header="数据过滤">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="选择列">
                  <a-select v-model:value="filterColumn">
                    <a-select-option v-for="col in columns" :key="col" :value="col">
                      {{ col }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="操作符">
                  <a-select v-model:value="filterOperator">
                    <a-select-option value="eq">等于 (=)</a-select-option>
                    <a-select-option value="ne">不等于 (!=)</a-select-option>
                    <a-select-option value="gt">大于 (&gt;)</a-select-option>
                    <a-select-option value="lt">小于 (&lt;)</a-select-option>
                    <a-select-option value="contains">包含</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="值">
                  <a-input v-model:value="filterValue" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <div style="display: flex; gap: 12px; margin-top: 16px;">
            <a-button type="primary" @click="applyFilter" :disabled="!canApplyFilter">
              <template #icon>
                <FilterOutlined />
              </template>
              应用过滤
            </a-button>
            <a-button @click="resetFilter" :disabled="!hasAppliedFilter">
              <template #icon>
                <ClearOutlined />
              </template>
              重置过滤
            </a-button>
          </div>
        </a-collapse-panel>

        <!-- 数据排序 -->
        <a-collapse-panel key="3" header="数据排序">
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <span>选择列：</span>
            <a-select v-model:value="sortColumn" style="width: 200px;">
              <a-select-option v-for="col in columns" :key="col" :value="col">
                {{ col }}
              </a-select-option>
            </a-select>

            <span style="margin-left: 16px;">排序方式：</span>
            <a-radio-group v-model:value="sortOrder" button-style="solid">
              <a-radio-button value="asc">升序</a-radio-button>
              <a-radio-button value="desc">降序</a-radio-button>
            </a-radio-group>
          </div>

          <a-button type="primary" @click="applySort" :disabled="!sortColumn">
            <template #icon>
              <SwapOutlined />
            </template>
            应用排序
          </a-button>
        </a-collapse-panel>
      </a-collapse>

      <div style="margin-top: 32px; display: flex; gap: 12px; justify-content: flex-end;">
        <a-button @click="resetData">
          <template #icon>
            <RollbackOutlined />
          </template>
          重置数据
        </a-button>
        <a-button type="primary" @click="finishPreprocess">
          <template #icon>
            <CheckCircleOutlined />
          </template>
          完成预处理
        </a-button>
      </div>
    </a-card>

    <!-- 数据预览表格 -->
    <a-card title="数据预览" class="preview-card" :loading="loading">
      <a-table
        :columns="tableColumns"
        :data-source="currentData"
        :pagination="{ pageSize: 10 }"
        bordered
        size="small"
      />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  CheckOutlined,
  FilterOutlined,
  ClearOutlined,
  SwapOutlined,
  RollbackOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['dataProcessed'])

const loading = ref(false)
const currentData = ref([])
const originalData = ref([])

// 面板状态
const activePanels = ref(['1', '2', '3'])

// 空值处理
const nullHandlingType = ref('fill')
const fillValueType = ref('zero')
const customFillValue = ref('')

// 数据过滤
const filterColumn = ref('')
const filterOperator = ref('eq')
const filterValue = ref('')
const hasAppliedFilter = ref(false)

// 数据排序
const sortColumn = ref('')
const sortOrder = ref('asc')

// 计算列名
const columns = computed(() => {
  if (props.data && props.data.length > 0) {
    return Object.keys(props.data[0])
  }
  return []
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

// 检查是否可以应用过滤
const canApplyFilter = computed(() => {
  return filterColumn.value && filterValue.value
})

// 初始化数据
watch(() => props.data, (newData) => {
  if (newData) {
    originalData.value = JSON.parse(JSON.stringify(newData))
    currentData.value = JSON.parse(JSON.stringify(newData))
  }
}, { immediate: true })

// 处理空值
const handleNullValues = () => {
  loading.value = true

  setTimeout(() => {
    let processedData = JSON.parse(JSON.stringify(currentData.value))

    if (nullHandlingType.value === 'fill') {
      // 填充空值
      columns.value.forEach(col => {
        let fillValue

        if (fillValueType.value === 'zero') {
          fillValue = 0
        } else if (fillValueType.value === 'custom') {
          fillValue = customFillValue.value
        } else {
          // 计算平均值或中位数
          const numericValues = processedData
            .map(row => row[col])
            .filter(val => val !== null && val !== undefined && val !== '' && !isNaN(val))
            .map(val => Number(val))

          if (numericValues.length > 0) {
            if (fillValueType.value === 'mean') {
              fillValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            } else if (fillValueType.value === 'median') {
              numericValues.sort((a, b) => a - b)
              const mid = Math.floor(numericValues.length / 2)
              fillValue = numericValues.length % 2 !== 0 ? numericValues[mid] : (numericValues[mid - 1] + numericValues[mid]) / 2
            }
          } else {
            fillValue = 0
          }
        }

        // 填充空值
        processedData.forEach(row => {
          if (row[col] === null || row[col] === undefined || row[col] === '') {
            row[col] = fillValue
          }
        })
      })
    } else if (nullHandlingType.value === 'remove') {
      // 删除包含空值的行
      processedData = processedData.filter(row => {
        return !columns.value.some(col => row[col] === null || row[col] === undefined || row[col] === '')
      })
    }

    currentData.value = processedData
    loading.value = false
    message.success('空值处理完成！')
  }, 500)
}

// 应用过滤
const applyFilter = () => {
  loading.value = true

  setTimeout(() => {
    const filteredData = currentData.value.filter(row => {
      const cellValue = row[filterColumn.value]

      if (cellValue === null || cellValue === undefined) {
        return false
      }

      const stringValue = String(cellValue)
      const filterValueNum = Number(filterValue.value)

      switch (filterOperator.value) {
        case 'eq':
          if (!isNaN(filterValueNum)) {
            return Number(cellValue) === filterValueNum
          }
          return stringValue === filterValue.value
        case 'ne':
          if (!isNaN(filterValueNum)) {
            return Number(cellValue) !== filterValueNum
          }
          return stringValue !== filterValue.value
        case 'gt':
          if (!isNaN(filterValueNum)) {
            return Number(cellValue) > filterValueNum
          }
          return false
        case 'lt':
          if (!isNaN(filterValueNum)) {
            return Number(cellValue) < filterValueNum
          }
          return false
        case 'contains':
          return stringValue.toLowerCase().includes(filterValue.value.toLowerCase())
        default:
          return true
      }
    })

    currentData.value = filteredData
    hasAppliedFilter.value = true
    loading.value = false
    message.success('数据过滤完成！')
  }, 500)
}

// 重置过滤
const resetFilter = () => {
  currentData.value = JSON.parse(JSON.stringify(originalData.value))
  filterColumn.value = ''
  filterOperator.value = 'eq'
  filterValue.value = ''
  hasAppliedFilter.value = false
  message.success('过滤已重置！')
}

// 应用排序
const applySort = () => {
  loading.value = true

  setTimeout(() => {
    const sortedData = [...currentData.value].sort((a, b) => {
      const valA = a[sortColumn.value]
      const valB = b[sortColumn.value]

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (!isNaN(valA) && !isNaN(valB)) {
        // 数值比较
        if (sortOrder.value === 'asc') {
          return Number(valA) - Number(valB)
        } else {
          return Number(valB) - Number(valA)
        }
      } else if (valA instanceof Date && valB instanceof Date) {
        // 日期比较
        if (sortOrder.value === 'asc') {
          return valA.getTime() - valB.getTime()
        } else {
          return valB.getTime() - valA.getTime()
        }
      } else {
        // 字符串比较
        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        if (sortOrder.value === 'asc') {
          return strA.localeCompare(strB)
        } else {
          return strB.localeCompare(strA)
        }
      }
    })

    currentData.value = sortedData
    loading.value = false
    message.success('数据排序完成！')
  }, 500)
}

// 重置数据
const resetData = () => {
  currentData.value = JSON.parse(JSON.stringify(originalData.value))
  // 重置所有状态
  nullHandlingType.value = 'fill'
  fillValueType.value = 'zero'
  customFillValue.value = ''
  filterColumn.value = ''
  filterOperator.value = 'eq'
  filterValue.value = ''
  hasAppliedFilter.value = false
  sortColumn.value = ''
  sortOrder.value = 'asc'
  message.success('数据已重置！')
}

// 完成预处理
const finishPreprocess = () => {
  emit('dataProcessed', currentData.value)
  message.success('数据预处理完成！')
}
</script>

<style scoped>
.data-preprocess-container {
  max-width: 1400px;
  margin: 0 auto;
}

.preprocess-card {
  margin-bottom: 24px;
}

.preview-card {
  min-height: 400px;
}
</style>
