<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Web Chart Tool</h1>
      <p>数据导入、预处理与可视化工具</p>
    </header>

    <el-tabs v-model="activeTab" type="border-card" class="main-tabs">
      <!-- 数据导入标签页 -->
      <el-tab-pane label="数据导入" name="import">
        <DataImport @data-imported="handleDataImported" />
      </el-tab-pane>

      <!-- 数据预处理标签页 -->
      <el-tab-pane label="数据预处理" name="preprocess" :disabled="!hasData">
        <DataPreprocess 
          :data="currentData" 
          :fields="currentFields"
          @data-updated="handleDataUpdated"
        />
      </el-tab-pane>

      <!-- 数据预览标签页 -->
      <el-tab-pane label="数据预览" name="preview" :disabled="!hasData">
        <DataPreview 
          :data="currentData" 
          :fields="currentFields"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DataImport from './components/DataImport.vue'
import DataPreprocess from './components/DataPreprocess.vue'
import DataPreview from './components/DataPreview.vue'

const activeTab = ref('import')
const currentData = ref([])
const currentFields = ref([])

const hasData = computed(() => currentData.value.length > 0)

const handleDataImported = (data, fields) => {
  currentData.value = data
  currentFields.value = fields
  activeTab.value = 'preprocess'
}

const handleDataUpdated = (data) => {
  currentData.value = data
}
</script>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.app-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.main-tabs {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>