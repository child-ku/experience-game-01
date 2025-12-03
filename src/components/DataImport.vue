<template>
  <div class="data-import-container">
    <a-card title="选择数据源" class="import-card">
      <a-radio-group v-model:value="importType" button-style="solid">
        <a-radio-button value="file">文件上传</a-radio-button>
        <a-radio-button value="json">JSON粘贴</a-radio-button>
        <a-radio-button value="manual">手动输入</a-radio-button>
      </a-radio-group>
    </a-card>

    <!-- 文件上传 -->
    <a-card v-if="importType === 'file'" title="上传Excel/CSV文件" class="import-content-card">
      <a-upload
        :before-upload="beforeUpload"
        :file-list="fileList"
        accept=".xlsx,.xls,.csv"
        @change="handleFileChange"
        :custom-request="customRequest"
      >
        <a-button>
          <template #icon>
            <UploadOutlined />
          </template>
          选择文件
        </a-button>
      </a-upload>
      <div style="margin-top: 16px; color: #666;">
        支持 .xlsx, .xls, .csv 格式
      </div>
    </a-card>

    <!-- JSON粘贴 -->
    <a-card v-if="importType === 'json'" title="粘贴JSON数据" class="import-content-card">
      <a-textarea
        v-model:value="jsonData"
        placeholder="请粘贴JSON格式的数据..."
        :rows="10"
        class="json-textarea"
      />
      <div style="margin-top: 16px; display: flex; gap: 12px;">
        <a-button type="primary" @click="parseJsonData">
          <template #icon>
            <CheckOutlined />
          </template>
          解析数据
        </a-button>
        <a-button @click="jsonData = ''">
          <template #icon>
            <ClearOutlined />
          </template>
          清空
        </a-button>
      </div>
    </a-card>

    <!-- 手动输入 -->
    <a-card v-if="importType === 'manual'" title="手动输入数据" class="import-content-card">
      <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
        <a-button @click="addRow">
          <template #icon>
            <PlusOutlined />
          </template>
          添加行
        </a-button>
        <a-button @click="addColumn">
          <template #icon>
            <PlusOutlined />
          </template>
          添加列
        </a-button>
        <a-button @click="clearTable" danger>
          <template #icon>
            <ClearOutlined />
          </template>
          清空表格
        </a-button>
      </div>
      
      <a-table
        :columns="manualColumns"
        :data-source="manualData"
        :pagination="false"
        bordered
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <a-input
            v-model:value="record[column.key]"
            size="small"
          />
        </template>
      </a-table>

      <div style="margin-top: 16px;">
        <a-button type="primary" @click="submitManualData">
          <template #icon>
            <CheckOutlined />
          </template>
          确认数据
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import {
  UploadOutlined,
  CheckOutlined,
  ClearOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'

const emit = defineEmits(['dataLoaded'])

const importType = ref('file')
const fileList = ref([])
const jsonData = ref('')

// 手动输入表格数据
const manualColumns = ref([
  { title: '列1', dataIndex: 'col1', key: 'col1' },
  { title: '列2', dataIndex: 'col2', key: 'col2' }
])

const manualData = ref([
  { key: '1', col1: '', col2: '' },
  { key: '2', col1: '', col2: '' }
])

// 文件上传前的检查
const beforeUpload = (file) => {
  const isExcelOrCsv = file.type.includes('excel') || file.type.includes('spreadsheet') || file.type.includes('csv') || file.name.endsWith('.csv')
  if (!isExcelOrCsv) {
    message.error('只能上传Excel或CSV文件！')
  }
  return isExcelOrCsv
}

// 自定义上传请求，阻止自动上传到服务器
const customRequest = (options) => {
  // 不做任何事情，阻止自动上传
}

// 处理文件上传变化
const handleFileChange = (info) => {
  const { file } = info
  if (file.status === 'uploading') {
    // 手动处理文件
    if (file.name.endsWith('.csv') || file.type.includes('csv')) {
      // 处理CSV文件
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvData = e.target.result
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            console.log('CSV解析结果:', results)
            if (results.data && results.data.length > 0) {
              processAndEmitData(results.data)
            } else {
              message.error('CSV文件中没有数据！')
            }
          },
          error: (error) => {
            console.error('CSV解析错误:', error)
            message.error('CSV文件解析失败！')
          }
        })
      }
      reader.readAsText(file.originFileObj, 'utf-8')
    } else {
      // 处理Excel文件
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        console.log('Excel解析结果:', jsonData)
        if (jsonData && jsonData.length > 0) {
          processAndEmitData(jsonData)
        } else {
          message.error('Excel文件中没有数据！')
        }
      }
      reader.onerror = () => {
        message.error('Excel文件读取失败！')
      }
      reader.readAsArrayBuffer(file.originFileObj)
    }
  } else if (file.status === 'error') {
    message.error(`${file.name} 处理失败！`)
  }
}

// 解析JSON数据
const parseJsonData = () => {
  if (!jsonData.value.trim()) {
    message.warning('请输入JSON数据！')
    return
  }

  try {
    const parsedData = JSON.parse(jsonData.value)
    let dataToProcess
    if (Array.isArray(parsedData)) {
      dataToProcess = parsedData
    } else {
      // 如果是单个对象，自动包装成数组
      dataToProcess = [parsedData]
    }
    processAndEmitData(dataToProcess)
  } catch (error) {
    message.error('JSON数据格式错误！')
  }
}

// 添加行
const addRow = () => {
  const newKey = (manualData.value.length + 1).toString()
  const newRow = { key: newKey }
  manualColumns.value.forEach(col => {
    newRow[col.key] = ''
  })
  manualData.value.push(newRow)
}

// 添加列
const addColumn = () => {
  const newColIndex = manualColumns.value.length + 1
  const newColKey = `col${newColIndex}`
  manualColumns.value.push({
    title: `列${newColIndex}`,
    dataIndex: newColKey,
    key: newColKey
  })

  // 为现有行添加新列
  manualData.value.forEach(row => {
    row[newColKey] = ''
  })
}

// 清空表格
const clearTable = () => {
  manualColumns.value = [
    { title: '列1', dataIndex: 'col1', key: 'col1' },
    { title: '列2', dataIndex: 'col2', key: 'col2' }
  ]
  manualData.value = [
    { key: '1', col1: '', col2: '' },
    { key: '2', col1: '', col2: '' }
  ]
}

// 提交手动输入的数据
const submitManualData = () => {
  // 转换数据格式，只保留非空值
  const processedData = manualData.value.map(row => {
    const newRow = {}
    Object.keys(row).forEach(key => {
      if (key !== 'key' && row[key] !== '') {
        newRow[key] = row[key]
      }
    })
    return newRow
  }).filter(row => Object.keys(row).length > 0)

  if (processedData.length === 0) {
    message.warning('请输入数据！')
    return
  }

  processAndEmitData(processedData)
}

// 处理并发送数据
const processAndEmitData = (data) => {
  // 自动识别数据类型
  const processedData = data.map(row => {
    const newRow = {}
    Object.keys(row).forEach(key => {
      const value = row[key]
      if (!isNaN(value) && value !== '') {
        // 数值类型
        newRow[key] = Number(value)
      } else if (isValidDate(value)) {
        // 日期类型
        newRow[key] = new Date(value)
      } else {
        // 文本类型
        newRow[key] = String(value)
      }
    })
    return newRow
  })

  emit('dataLoaded', processedData)
  message.success('数据导入成功！')
}

// 检查是否为有效日期
const isValidDate = (value) => {
  const date = new Date(value)
  return date instanceof Date && !isNaN(date)
}
</script>

<style scoped>
.data-import-container {
  max-width: 1000px;
  margin: 0 auto;
}

.import-card {
  margin-bottom: 24px;
}

.import-content-card {
  min-height: 400px;
}

.json-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
