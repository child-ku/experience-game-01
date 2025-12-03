<template>
  <div class="data-preprocess">
    <el-row gutter="20">
      <!-- 数据类型识别 -->
      <el-col :span="12">
        <el-card title="数据类型自动识别" class="preprocess-card">
          <el-table :data="fieldsWithType" border>
            <el-table-column prop="name" label="字段名" />
            <el-table-column prop="currentType" label="当前类型" />
            <el-table-column prop="detectedType" label="识别类型" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button type="text" @click="detectAllTypes">
                  全部识别
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="text-align: center; margin-top: 15px;">
            <el-button type="primary" @click="applyTypeDetection">
              应用类型识别
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 空值处理 -->
      <el-col :span="12">
        <el-card title="空值处理" class="preprocess-card">
          <el-form label-width="120px">
            <el-form-item label="处理方式">
              <el-radio-group v-model="nullHandling.method">
                <el-radio-button label="fill">填充</el-radio-button>
                <el-radio-button label="delete">删除</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item 
              label="填充值" 
              v-if="nullHandling.method === 'fill'"
            >
              <el-input 
                v-model="nullHandling.fillValue" 
                placeholder="请输入填充值"
              />
            </el-form-item>
            <el-form-item label="处理字段">
              <el-checkbox-group v-model="nullHandling.fields">
                <el-checkbox 
                  v-for="field in fields" 
                  :key="field.key" 
                  :label="field.key"
                />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
          <div style="text-align: center; margin-top: 15px;">
            <el-button type="primary" @click="handleNullValues">
              执行空值处理
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row gutter="20" style="margin-top: 20px;">
      <!-- 数据过滤 -->
      <el-col :span="12">
        <el-card title="数据过滤" class="preprocess-card">
          <el-form label-width="100px">
            <el-form-item label="字段">
              <el-select v-model="filter.field" placeholder="选择字段">
                <el-option 
                  v-for="field in fields" 
                  :key="field.key" 
                  :label="field.name" 
                  :value="field.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="操作符">
              <el-select v-model="filter.operator" placeholder="选择操作符">
                <el-option label="等于" value="eq" />
                <el-option label="不等于" value="neq" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="包含" value="contains" />
              </el-select>
            </el-form-item>
            <el-form-item label="值">
              <el-input 
                v-model="filter.value" 
                placeholder="请输入值"
              />
            </el-form-item>
          </el-form>
          <div style="text-align: center; margin-top: 15px;">
            <el-button type="primary" @click="applyFilter">
              应用过滤
            </el-button>
            <el-button @click="clearFilter" style="margin-left: 10px;">
              清除过滤
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 数据排序 -->
      <el-col :span="12">
        <el-card title="数据排序" class="preprocess-card">
          <el-form label-width="100px">
            <el-form-item label="字段">
              <el-select v-model="sort.field" placeholder="选择字段">
                <el-option 
                  v-for="field in fields" 
                  :key="field.key" 
                  :label="field.name" 
                  :value="field.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="排序方式">
              <el-radio-group v-model="sort.order">
                <el-radio-button label="asc">升序</el-radio-button>
                <el-radio-button label="desc">降序</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <div style="text-align: center; margin-top: 15px;">
            <el-button type="primary" @click="applySort">
              应用排序
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 处理结果预览 -->
    <el-card title="处理结果预览" class="preview-card">
      <el-table :data="displayData" border max-height="400">
        <el-table-column
          v-for="field in fields"
          :key="field.key"
          :prop="field.key"
          :label="field.name"
        />
      </el-table>
      <div style="text-align: center; margin-top: 15px;">
        <el-button type="success" @click="confirmChanges">
          确认更改
        </el-button>
        <el-button @click="resetData" style="margin-left: 10px;">
          重置数据
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

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

const emit = defineEmits(['data-updated'])

const originalData = ref(JSON.parse(JSON.stringify(props.data)))
const displayData = ref(JSON.parse(JSON.stringify(props.data)))

// 数据类型识别
const fieldsWithType = computed(() => {
  return props.fields.map(field => {
    const values = displayData.value.map(row => row[field.key]).filter(v => v !== '' && v != null)
    const detectedType = detectFieldType(values)
    return {
      name: field.name,
      currentType: field.type || 'text',
      detectedType: detectedType,
      key: field.key
    }
  })
})

const detectFieldType = (values) => {
  if (values.every(v => !isNaN(v) && v !== '')) return 'number'
  if (values.every(v => !isNaN(Date.parse(v)))) return 'date'
  return 'text'
}

const detectAllTypes = () => {
  ElMessage.success('已完成所有字段类型识别')
}

const applyTypeDetection = () => {
  ElMessage.success('类型识别已应用')
}

// 空值处理
const nullHandling = ref({
  method: 'fill',
  fillValue: '',
  fields: []
})

const handleNullValues = () => {
  if (nullHandling.value.fields.length === 0) {
    ElMessage.warning('请选择要处理的字段')
    return
  }

  const newData = JSON.parse(JSON.stringify(displayData.value))
  
  newData.forEach(row => {
    nullHandling.value.fields.forEach(field => {
      if (row[field] === '' || row[field] == null) {
        if (nullHandling.value.method === 'fill') {
          row[field] = nullHandling.value.fillValue
        } else if (nullHandling.value.method === 'delete') {
          delete row[field]
        }
      }
    })
  })
  
  displayData.value = newData
  ElMessage.success('空值处理完成')
}

// 数据过滤
const filter = ref({
  field: '',
  operator: '',
  value: ''
})

const applyFilter = () => {
  if (!filter.value.field || !filter.value.operator || !filter.value.value) {
    ElMessage.warning('请填写完整过滤条件')
    return
  }

  const newData = originalData.value.filter(row => {
    const fieldValue = row[filter.value.field]
    const filterValue = filter.value.value
    const fieldType = fieldsWithType.value.find(f => f.key === filter.value.field)?.detectedType
    
    // 处理空值情况
    if (fieldValue === '' || fieldValue == null) {
      return filterValue === '' || filterValue == null
    }
    
    switch (filter.value.operator) {
      case 'eq': 
        if (fieldType === 'number') {
          return Number(fieldValue) === Number(filterValue)
        } else if (fieldType === 'date') {
          return new Date(fieldValue).getTime() === new Date(filterValue).getTime()
        }
        return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase()
      
      case 'neq': 
        if (fieldType === 'number') {
          return Number(fieldValue) !== Number(filterValue)
        } else if (fieldType === 'date') {
          return new Date(fieldValue).getTime() !== new Date(filterValue).getTime()
        }
        return String(fieldValue).toLowerCase() !== String(filterValue).toLowerCase()
      
      case 'gt': 
        if (fieldType === 'number') {
          return Number(fieldValue) > Number(filterValue)
        } else if (fieldType === 'date') {
          return new Date(fieldValue) > new Date(filterValue)
        }
        return String(fieldValue).toLowerCase() > String(filterValue).toLowerCase()
      
      case 'lt': 
        if (fieldType === 'number') {
          return Number(fieldValue) < Number(filterValue)
        } else if (fieldType === 'date') {
          return new Date(fieldValue) < new Date(filterValue)
        }
        return String(fieldValue).toLowerCase() < String(filterValue).toLowerCase()
      
      case 'contains': 
        return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
      
      default: return true
    }
  })
  
  displayData.value = newData
  ElMessage.success(`过滤完成，共 ${newData.length} 条数据`)
}

const clearFilter = () => {
  filter.value = {
    field: '',
    operator: '',
    value: ''
  }
  displayData.value = JSON.parse(JSON.stringify(originalData.value))
  ElMessage.success('过滤已清除')
}

// 数据排序
const sort = ref({
  field: '',
  order: 'asc'
})

const applySort = () => {
  if (!sort.value.field) {
    ElMessage.warning('请选择排序字段')
    return
  }

  const newData = JSON.parse(JSON.stringify(displayData.value))
  const fieldType = fieldsWithType.value.find(f => f.key === sort.value.field)?.detectedType
  
  newData.sort((a, b) => {
    const valA = a[sort.value.field]
    const valB = b[sort.value.field]
    
    if (fieldType === 'number') {
      return sort.value.order === 'asc' 
        ? Number(valA) - Number(valB) 
        : Number(valB) - Number(valA)
    }
    
    if (fieldType === 'date') {
      return sort.value.order === 'asc' 
        ? new Date(valA) - new Date(valB) 
        : new Date(valB) - new Date(valA)
    }
    
    return sort.value.order === 'asc' 
      ? String(valA).localeCompare(String(valB)) 
      : String(valB).localeCompare(String(valA))
  })
  
  displayData.value = newData
  ElMessage.success('排序完成')
}

// 确认更改
const confirmChanges = () => {
  originalData.value = JSON.parse(JSON.stringify(displayData.value))
  emit('data-updated', displayData.value)
  ElMessage.success('数据已更新')
}

// 重置数据
const resetData = () => {
  displayData.value = JSON.parse(JSON.stringify(originalData.value))
  ElMessage.success('数据已重置')
}

// 监听 props.data 变化
watch(() => props.data, (newData) => {
  originalData.value = JSON.parse(JSON.stringify(newData))
  displayData.value = JSON.parse(JSON.stringify(newData))
}, { deep: true })
</script>

<style scoped>
.data-preprocess {
  padding: 20px;
}

.preprocess-card {
  height: 100%;
}

.preview-card {
  margin-top: 20px;
}
</style>