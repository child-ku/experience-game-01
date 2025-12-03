<template>
  <div class="app-container">
    <header class="app-header">
      <h1>📊 Web 图表工具</h1>
      <p>专业的数据可视化与分析平台</p>
    </header>

    <div class="main-content">
      <!-- 数据源导入区域 -->
      <section class="import-section">
        <h2>🔹 数据源导入</h2>
        <div class="import-methods">
          <div class="import-card" @click="activeImport = 'file'" :class="{ active: activeImport === 'file' }">
            <div class="icon">📁</div>
            <h3>文件上传</h3>
            <p>上传 Excel 或 CSV 文件</p>
            <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" @change="handleFileUpload" class="file-input">
          </div>
          <div class="import-card" @click="activeImport = 'json'" :class="{ active: activeImport === 'json' }">
            <div class="icon">📝</div>
            <h3>JSON 粘贴</h3>
            <p>直接粘贴 JSON 格式数据</p>
          </div>
          <div class="import-card" @click="activeImport = 'manual'" :class="{ active: activeImport === 'manual' }">
            <div class="icon">✏️</div>
            <h3>手动输入</h3>
            <p>在线编辑表格数据</p>
          </div>
        </div>

        <!-- 文件上传区域 -->
        <div v-if="activeImport === 'file'" class="import-content">
          <div class="file-upload-area" @click="$refs.fileInput.click()">
            <div class="upload-icon">📤</div>
            <p>点击或拖拽文件到此处</p>
            <small>支持 .xlsx, .xls, .csv 格式</small>
          </div>
        </div>

        <!-- JSON 粘贴区域 -->
        <div v-if="activeImport === 'json'" class="import-content">
          <textarea 
            v-model="jsonInput" 
            placeholder="请粘贴 JSON 数据..."
            class="json-textarea"
          ></textarea>
          <button @click="handleJsonImport" class="btn btn-primary">导入数据</button>
        </div>

        <!-- 手动输入区域 -->
        <div v-if="activeImport === 'manual'" class="import-content">
          <div class="manual-input-controls">
            <button @click="addRow" class="btn btn-secondary">➕ 添加行</button>
            <button @click="addColumn" class="btn btn-secondary">➕ 添加列</button>
            <button @click="handleManualImport" class="btn btn-primary">确认数据</button>
          </div>
          <div class="manual-table-container">
            <table class="manual-table">
              <thead>
                <tr>
                  <th v-for="(col, index) in manualColumns" :key="'col-' + index">
                    <input 
                      v-model="manualColumns[index]" 
                      placeholder="列名" 
                      class="column-input"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in manualRows" :key="'row-' + rowIndex">
                  <td v-for="(cell, colIndex) in row" :key="'cell-' + rowIndex + '-' + colIndex">
                    <input 
                      v-model="manualRows[rowIndex][colIndex]" 
                      placeholder="输入数据" 
                      class="cell-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 数据预处理区域 -->
      <section v-if="dataLoaded" class="preprocess-section">
        <h2>🔹 数据预处理</h2>
        
        <!-- 空值处理 -->
        <div class="preprocess-card">
          <h3>空值处理</h3>
          <div class="preprocess-controls">
            <select v-model="nullValueAction" class="select-input">
              <option value="none">不处理</option>
              <option value="remove">删除空值行</option>
              <option value="fill">填充值</option>
            </select>
            <input 
              v-if="nullValueAction === 'fill'" 
              v-model="fillValue" 
              placeholder="填充值" 
              class="input-field"
            />
            <button @click="handleNullValueProcessing" class="btn btn-primary">应用</button>
          </div>
        </div>

        <!-- 数据过滤 -->
        <div class="preprocess-card">
          <h3>数据过滤</h3>
          <div class="preprocess-controls">
            <select v-model="filterColumn" class="select-input">
              <option value="">选择列</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
            <select v-model="filterOperator" class="select-input">
              <option value="===">等于</option>
              <option value="!==">不等于</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
              <option value="contains">包含</option>
            </select>
            <input v-model="filterValue" placeholder="过滤值" class="input-field" />
            <button @click="handleFilter" class="btn btn-primary">应用过滤</button>
            <button @click="clearFilter" class="btn btn-secondary">清除</button>
          </div>
        </div>

        <!-- 数据排序 -->
        <div class="preprocess-card">
          <h3>数据排序</h3>
          <div class="preprocess-controls">
            <select v-model="sortColumn" class="select-input">
              <option value="">选择列</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
            <select v-model="sortOrder" class="select-input">
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
            <button @click="handleSort" class="btn btn-primary">应用排序</button>
            <button @click="clearSort" class="btn btn-secondary">清除</button>
          </div>
        </div>
      </section>

      <!-- 数据预览区域 -->
      <section v-if="dataLoaded" class="preview-section">
        <h2>🔹 数据预览</h2>
        
        <!-- 统计信息 -->
        <div class="preview-card">
          <h3>统计信息</h3>
          <div v-if="Object.keys(stats).length > 0" class="stats-grid">
            <div v-for="(stat, col) in stats" :key="col" class="stat-card">
              <h4>{{ col }}</h4>
              <div class="stat-item">最大值: {{ stat.max }}</div>
              <div class="stat-item">最小值: {{ stat.min }}</div>
              <div class="stat-item">平均值: {{ stat.avg }}</div>
              <div class="stat-item">中位数: {{ stat.median }}</div>
            </div>
          </div>
          <div v-else class="no-stats">
            <p>没有找到数值类型的列或数据不足</p>
          </div>
        </div>

        <!-- 直方图 -->
        <div class="preview-card">
          <h3>数据分布直方图</h3>
          <div class="chart-container">
            <select v-model="histogramColumn" class="select-input" style="margin-bottom: 20px;">
              <option value="">选择数值列</option>
              <option v-for="col in numericColumns" :key="col" :value="col">{{ col }}</option>
            </select>
            <canvas ref="histogramCanvas" v-show="histogramColumn"></canvas>
              <div v-show="!histogramColumn" class="no-chart">
                <p>请选择一个数值列来查看直方图</p>
              </div>
          </div>
        </div>

        <!-- 表格预览 -->
        <div class="preview-card">
          <h3>原始数据 ({{ filteredData.length }} 行)</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="col in columns" :key="col">
                    {{ col }}
                    <span class="type-badge">{{ columnTypes[col] }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in filteredData" :key="index">
                  <td v-for="col in columns" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import Chart from 'chart.js/auto'

export default {
  name: 'App',
  data() {
    return {
      activeImport: 'file',
      jsonInput: '',
      manualColumns: ['列1', '列2', '列3'],
      manualRows: [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ],
      originalData: [],
      filteredData: [],
      columns: [],
      columnTypes: {},
      dataLoaded: false,
      nullValueAction: 'none',
      fillValue: '',
      filterColumn: '',
      filterOperator: '===',
      filterValue: '',
      sortColumn: '',
      sortOrder: 'asc',
      histogramColumn: '',
      histogramChart: null
    }
  },
  computed: {
    numericColumns() {
      return Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === '数值')
    },
    stats() {
      const result = {}
      
      // 确保 numericColumns 正确计算
      const numericCols = Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === '数值')
      
      numericCols.forEach(col => {
        // 过滤出有效的数值
        const values = this.filteredData
          .map(row => {
            const val = row[col]
            // 处理不同类型的值
            if (val === null || val === undefined || val === '') return NaN
            const num = parseFloat(val)
            return isNaN(num) || !isFinite(num) ? NaN : num
          })
          .filter(v => !isNaN(v) && isFinite(v))
        
        if (values.length > 0) {
          // 排序用于计算中位数
          const sortedValues = [...values].sort((a, b) => a - b)
          const mid = Math.floor(sortedValues.length / 2)
          
          result[col] = {
            max: sortedValues[sortedValues.length - 1].toFixed(2),
            min: sortedValues[0].toFixed(2),
            avg: (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2),
            median: sortedValues.length % 2 === 0 
              ? ((sortedValues[mid - 1] + sortedValues[mid]) / 2).toFixed(2)
              : sortedValues[mid].toFixed(2)
          }
        }
      })
      return result
    }
  },
  methods: {
    // 文件上传处理
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            this.processData(results.data)
          }
        })
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          this.processData(jsonData)
        }
        reader.readAsArrayBuffer(file)
      }
    },

    // JSON 导入处理
    handleJsonImport() {
      try {
        const data = JSON.parse(this.jsonInput)
        this.processData(data)
      } catch (error) {
        alert('JSON 格式错误: ' + error.message)
      }
    },

    // 手动输入处理
    handleManualImport() {
      const data = this.manualRows.map(row => {
        const obj = {}
        this.manualColumns.forEach((col, index) => {
          obj[col] = row[index]
        })
        return obj
      })
      this.processData(data)
    },

    // 添加行
    addRow() {
      this.manualRows.push(new Array(this.manualColumns.length).fill(''))
    },

    // 添加列
    addColumn() {
      const newColName = `列${this.manualColumns.length + 1}`
      this.manualColumns.push(newColName)
      this.manualRows.forEach(row => row.push(''))
    },

    // 处理数据
    processData(data) {
      if (!Array.isArray(data) || data.length === 0) {
        alert('数据格式错误')
        return
      }

      this.originalData = JSON.parse(JSON.stringify(data))
      this.filteredData = JSON.parse(JSON.stringify(data))
      this.columns = Object.keys(data[0])
      this.identifyColumnTypes()
      this.dataLoaded = true
      this.renderHistogram()
    },

    // 识别列类型
    identifyColumnTypes() {
      this.columnTypes = {}
      this.columns.forEach(col => {
        const values = this.filteredData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
        if (values.length === 0) {
          this.columnTypes[col] = '文本'
          return
        }

        // 首先尝试数值识别，避免将纯数字识别为日期
        const isNumber = values.every(v => {
          const num = parseFloat(v)
          return !isNaN(num) && isFinite(num) && String(v).trim() !== ''
        })
        if (isNumber) {
          this.columnTypes[col] = '数值'
          return
        }

        // 尝试日期识别（排除纯数字格式）
        const isDate = values.every(v => {
          // 检查是否不是纯数字
          const isNotNumber = isNaN(parseFloat(v)) || !isFinite(v)
          // 检查是否是有效的日期格式
          const isValidDate = dayjs(v).isValid()
          // 对于可能的日期格式，需要更严格的检查
          const dateStr = String(v).trim()
          const hasDateSeparator = dateStr.includes('-') || dateStr.includes('/') || dateStr.includes(':')
          
          return isNotNumber && isValidDate && hasDateSeparator
        })
        if (isDate) {
          this.columnTypes[col] = '日期'
          return
        }

        this.columnTypes[col] = '文本'
      })
    },

    // 空值处理
    handleNullValueProcessing() {
      let processed = JSON.parse(JSON.stringify(this.filteredData))

      if (this.nullValueAction === 'remove') {
        processed = processed.filter(row => {
          return !Object.values(row).some(v => v === null || v === undefined || v === '')
        })
      } else if (this.nullValueAction === 'fill') {
        processed = processed.map(row => {
          const newRow = { ...row }
          Object.keys(newRow).forEach(col => {
            if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
              newRow[col] = this.fillValue
            }
          })
          return newRow
        })
      }

      this.filteredData = processed
      this.renderHistogram()
    },

    // 数据过滤
    handleFilter() {
      if (!this.filterColumn || !this.filterValue) return

      const value = this.columnTypes[this.filterColumn] === '数值' 
        ? parseFloat(this.filterValue)
        : this.filterValue

      this.filteredData = this.originalData.filter(row => {
        const rowValue = this.columnTypes[this.filterColumn] === '数值' 
          ? parseFloat(row[this.filterColumn])
          : row[this.filterColumn]

        switch (this.filterOperator) {
          case '===': return rowValue === value
          case '!==': return rowValue !== value
          case '>': return rowValue > value
          case '<': return rowValue < value
          case '>=': return rowValue >= value
          case '<=': return rowValue <= value
          case 'contains': return String(rowValue).includes(String(value))
          default: return true
        }
      })

      this.renderHistogram()
    },

    // 清除过滤
    clearFilter() {
      this.filterColumn = ''
      this.filterOperator = '==='
      this.filterValue = ''
      this.filteredData = JSON.parse(JSON.stringify(this.originalData))
      this.renderHistogram()
    },

    // 数据排序
    handleSort() {
      if (!this.sortColumn) return

      this.filteredData.sort((a, b) => {
        let valA = a[this.sortColumn]
        let valB = b[this.sortColumn]

        if (this.columnTypes[this.sortColumn] === '数值') {
          valA = parseFloat(valA)
          valB = parseFloat(valB)
        } else if (this.columnTypes[this.sortColumn] === '日期') {
          valA = dayjs(valA).valueOf()
          valB = dayjs(valB).valueOf()
        }

        if (this.sortOrder === 'asc') {
          return valA > valB ? 1 : -1
        } else {
          return valA < valB ? 1 : -1
        }
      })

      this.renderHistogram()
    },

    // 清除排序
    clearSort() {
      this.sortColumn = ''
      this.sortOrder = 'asc'
      this.filteredData = JSON.parse(JSON.stringify(this.originalData))
      this.renderHistogram()
    },

    // 渲染直方图
    renderHistogram() {
      if (!this.histogramColumn || !this.$refs.histogramCanvas) return

      const ctx = this.$refs.histogramCanvas.getContext('2d')
      const values = this.filteredData
        .map(row => parseFloat(row[this.histogramColumn]))
        .filter(v => !isNaN(v) && isFinite(v))

      if (this.histogramChart) {
        this.histogramChart.destroy()
      }

      this.histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.generateBins(values, 10).map(bin => bin.label),
          datasets: [{
            label: `${this.histogramColumn} 分布`,
            data: this.generateBins(values, 10).map(bin => bin.count),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            title: {
              display: true,
              text: `${this.histogramColumn} 数据分布直方图`
            }
          },
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
          }
        }
      })
    },

    // 生成直方图 bins
    generateBins(values, numBins) {
      if (values.length === 0) return []

      const min = Math.min(...values)
      const max = Math.max(...values)
      const binWidth = (max - min) / numBins
      const bins = []

      for (let i = 0; i < numBins; i++) {
        const start = min + i * binWidth
        const end = start + binWidth
        bins.push({
          label: `${start.toFixed(2)} - ${end.toFixed(2)}`,
          count: values.filter(v => v >= start && v < end).length
        })
      }

      return bins
    }
  },
  watch: {
    histogramColumn() {
      this.renderHistogram()
    }
  }
}
</script>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.app-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.app-header p {
  font-size: 1.1rem;
  font-weight: 300;
  opacity: 0.95;
}

.main-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

/* 导入区域 */
.import-section {
  margin-bottom: 40px;
}

.import-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #1f2937;
}

.import-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.import-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.import-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.import-card.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
}

.import-card .icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.import-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.import-card p {
  font-size: 0.9rem;
  opacity: 0.9;
}

.file-input {
  display: none;
}

.import-content {
  background: #f9fafb;
  padding: 30px;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  transition: all 0.3s ease;
}

.import-content:hover {
  border-color: #667eea;
  background: #f3f4f6;
}

.file-upload-area {
  text-align: center;
  padding: 60px 20px;
  cursor: pointer;
  color: #374151;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 15px;
  color: #667eea;
}

.file-upload-area p {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.file-upload-area small {
  color: #6b7280;
}

.json-textarea {
  width: 100%;
  min-height: 200px;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.json-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.manual-input-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.manual-table-container {
  overflow-x: auto;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.manual-table {
  width: 100%;
  border-collapse: collapse;
}

.manual-table th,
.manual-table td {
  padding: 10px;
  border: 1px solid #e5e7eb;
  background: white;
}

.column-input,
.cell-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.column-input:focus,
.cell-input:focus {
  outline: none;
  border-color: #667eea;
}

/* 预处理区域 */
.preprocess-section {
  margin-bottom: 40px;
}

.preprocess-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #1f2937;
}

.preprocess-card {
  background: #f9fafb;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.preprocess-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #374151;
}

.preprocess-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

/* 预览区域 */
.preview-section {
  margin-bottom: 40px;
}

.preview-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #1f2937;
}

.preview-card {
  background: #f9fafb;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.preview-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #374151;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tbody tr {
  transition: background-color 0.2s ease;
}

.data-table tbody tr:hover {
  background-color: #f3f4f6;
}

.type-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-card h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.stat-item {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 6px;
}

.no-stats,
.no-chart {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}

.no-stats p,
.no-chart p {
  font-size: 1rem;
  margin: 0;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

/* 输入框样式 */
.select-input,
.input-field {
  padding: 10px 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
  min-width: 120px;
}

.select-input:focus,
.input-field:focus {
  outline: none;
  border-color: #667eea;
}

.input-field {
  min-width: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }

  .main-content {
    padding: 20px;
  }

  .import-methods {
    grid-template-columns: 1fr;
  }

  .preprocess-controls,
  .manual-input-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .select-input,
  .input-field,
  .btn {
    width: 100%;
  }
}
</style>