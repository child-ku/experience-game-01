<template>
  <div class="data-import">
    <el-row gutter="20">
      <!-- Excel/CSV 上传 -->
      <el-col :span="8">
        <el-card title="Excel/CSV 上传" class="import-card">
          <div class="upload-area">
            <el-upload
              drag
              action=""
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileUpload"
              accept=".xlsx,.xls,.csv"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击选择</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .xlsx, .xls, .csv 格式文件
                </div>
              </template>
            </el-upload>
          </div>
        </el-card>
      </el-col>

      <!-- JSON 粘贴 -->
      <el-col :span="8">
        <el-card title="JSON 数据粘贴" class="import-card">
          <el-input
            type="textarea"
            v-model="jsonData"
            :rows="8"
            placeholder='请输入 JSON 数据，例如：[{"name": "张三", "age": 25}, {"name": "李四", "age": 30}]'
            class="json-input"
          />
          <el-button type="primary" @click="parseJson" style="margin-top: 10px; width: 100%">
            解析 JSON
          </el-button>
        </el-card>
      </el-col>

      <!-- 手动输入 -->
      <el-col :span="8">
        <el-card title="手动表格输入" class="import-card">
          <div class="manual-input">
            <el-button type="success" @click="addRow" style="margin-bottom: 10px;">
              <el-icon><Plus /></el-icon> 添加行
            </el-button>
            <el-button type="danger" @click="removeRow" style="margin-bottom: 10px; margin-left: 10px;">
              <el-icon><Minus /></el-icon> 删除行
            </el-button>
            <div class="manual-table">
              <div class="table-row" v-for="(row, rowIndex) in manualData" :key="rowIndex">
                <el-input
                  v-for="(cell, colIndex) in row"
                  :key="colIndex"
                  v-model="manualData[rowIndex][colIndex]"
                  size="small"
                  class="table-cell"
                  placeholder="输入内容"
                />
              </div>
            </div>
            <el-button type="primary" @click="importManualData" style="margin-top: 10px; width: 100%">
              导入数据
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入结果预览 -->
    <el-card title="数据预览" v-if="previewData.length > 0" class="preview-card">
      <el-table :data="previewData" border max-height="300">
        <el-table-column
          v-for="(field, index) in previewFields"
          :key="index"
          :prop="field.key"
          :label="field.name"
        />
      </el-table>
      <div style="text-align: center; margin-top: 15px;">
        <el-button type="success" @click="confirmImport">
          确认导入
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled, Plus, Minus } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

const jsonData = ref('')
const manualData = ref([
  ['姓名', '年龄', '城市'],
  ['张三', '25', '北京'],
  ['李四', '30', '上海']
])
const previewData = ref([])
const previewFields = ref([])

const emit = defineEmits(['data-imported'])

// 处理 Excel/CSV 文件上传
const handleFileUpload = (file) => {
  const fileReader = new FileReader()
  fileReader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      if (file.name.endsWith('.csv')) {
        parseCsv(data)
      } else {
        parseExcel(data)
      }
    } catch (error) {
      console.error('文件解析失败:', error)
      alert('文件解析失败，请检查文件格式')
    }
  }
  fileReader.readAsArrayBuffer(file.raw)
}

// 解析 Excel 文件
const parseExcel = (data) => {
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
  processTableData(jsonData)
}

// 解析 CSV 文件
const parseCsv = (data) => {
  const text = new TextDecoder('utf-8').decode(data)
  Papa.parse(text, {
    complete: (results) => {
      processTableData(results.data)
    }
  })
}

// 处理表格数据
const processTableData = (rawData) => {
  if (rawData.length < 2) {
    alert('数据不能为空')
    return
  }
  const headers = rawData[0]
  const rows = rawData.slice(1)
  
  const fields = headers.map((header, index) => ({
    key: `field_${index}`,
    name: header || `列${index + 1}`,
    type: 'text'
  }))
  
  const data = rows.map(row => {
    const item = {}
    fields.forEach((field, index) => {
      item[field.key] = row[index] || ''
    })
    return item
  })
  
  previewData.value = data
  previewFields.value = fields
}

// 解析 JSON 数据
const parseJson = () => {
  try {
    const data = JSON.parse(jsonData.value)
    if (!Array.isArray(data) || data.length === 0) {
      alert('JSON 数据必须是非空数组')
      return
    }
    
    const firstRow = data[0]
    const fields = Object.keys(firstRow).map((key, index) => ({
      key: key,
      name: key,
      type: 'text'
    }))
    
    previewData.value = data
    previewFields.value = fields
  } catch (error) {
    console.error('JSON 解析失败:', error)
    alert('JSON 格式错误，请检查数据')
  }
}

// 添加行
const addRow = () => {
  const colCount = manualData.value[0]?.length || 3
  manualData.value.push(new Array(colCount).fill(''))
}

// 删除行
const removeRow = () => {
  if (manualData.value.length > 1) {
    manualData.value.pop()
  }
}

// 导入手动数据
const importManualData = () => {
  processTableData(manualData.value)
}

// 确认导入
const confirmImport = () => {
  emit('data-imported', previewData.value, previewFields.value)
}
</script>

<style scoped>
.data-import {
  padding: 20px;
}

.import-card {
  height: 100%;
}

.upload-area {
  text-align: center;
}

.json-input {
  font-family: monospace;
}

.manual-input {
  display: flex;
  flex-direction: column;
}

.manual-table {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px;
}

.table-row {
  display: flex;
  margin-bottom: 5px;
}

.table-cell {
  flex: 1;
  margin-right: 5px;
}

.table-cell:last-child {
  margin-right: 0;
}

.preview-card {
  margin-top: 20px;
}
</style>