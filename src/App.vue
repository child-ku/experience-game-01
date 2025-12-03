<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Web图表工具</h1>
    </header>
    
    <main class="app-main">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <a-tab-pane key="1" tab="数据导入">
          <DataImport @dataLoaded="handleDataLoaded" />
        </a-tab-pane>
        
        <a-tab-pane key="2" tab="数据预处理" :disabled="!originalData">
          <DataPreprocess 
            :data="originalData" 
            @dataProcessed="handleDataProcessed"
          />
        </a-tab-pane>
        
        <a-tab-pane key="3" tab="数据预览" :disabled="!processedData">
          <DataPreview :data="processedData" />
        </a-tab-pane>
      </a-tabs>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataImport from './components/DataImport.vue'
import DataPreprocess from './components/DataPreprocess.vue'
import DataPreview from './components/DataPreview.vue'

const activeTab = ref('1')
const originalData = ref(null)
const processedData = ref(null)

const handleDataLoaded = (data) => {
  originalData.value = data
  processedData.value = JSON.parse(JSON.stringify(data))
  activeTab.value = '2'
}

const handleDataProcessed = (data) => {
  processedData.value = data
  activeTab.value = '3'
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.app-main {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 20px;
}
</style>
