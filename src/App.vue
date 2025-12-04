<template>
  <div class="workflow-designer">
    <a-layout style="height: 100vh">
      <!-- 顶部工具栏 -->
      <a-layout-header class="header">
        <div class="logo">工作流设计器</div>
        <a-space>
          <a-button @click="handleNew">
            <template #icon><FileOutlined /></template>
            新建
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
          <a-button @click="handleExport">
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
          <a-button @click="handleClear">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
        </a-space>
      </a-layout-header>

      <a-layout>
        <!-- 左侧节点库 -->
        <a-layout-sider width="250" class="sider">
          <NodeLibrary @node-drag-start="handleNodeDragStart" />
        </a-layout-sider>

        <!-- 中间画布区域 -->
        <a-layout-content style="background: #f5f5f5; position: relative;">
          <WorkflowCanvas 
            ref="canvasRef" 
            :dragging-node="draggingNode"
            @canvas-ready="handleCanvasReady"
          />
        </a-layout-content>

        <!-- 右侧属性面板 -->
        <a-layout-sider width="300" class="sider">
          <PropertyPanel 
            :selected-node="selectedNode" 
            @update-node="handleUpdateNode"
          />
        </a-layout-sider>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileOutlined, SaveOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import NodeLibrary from './components/NodeLibrary.vue'
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'

const canvasRef = ref(null)
const draggingNode = ref(null)
const selectedNode = ref(null)

const handleNodeDragStart = (nodeType) => {
  draggingNode.value = nodeType
}

const handleCanvasReady = () => {
  console.log('Canvas is ready')
}

const handleSave = () => {
  if (canvasRef.value) {
    const data = canvasRef.value.exportData()
    localStorage.setItem('workflow_data', JSON.stringify(data))
    alert('保存成功')
  }
}

const handleExport = () => {
  if (canvasRef.value) {
    const data = canvasRef.value.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

const handleClear = () => {
  if (confirm('确定要清空画布吗？')) {
    if (canvasRef.value) {
      canvasRef.value.clear()
    }
  }
}

const handleNew = () => {
  if (confirm('确定要新建一个工作流吗？当前未保存的内容将丢失。')) {
    if (canvasRef.value) {
      canvasRef.value.clear()
      localStorage.removeItem('workflow_data')
    }
  }
}

const handleUpdateNode = (nodeId, properties) => {
  if (canvasRef.value) {
    canvasRef.value.updateNode(nodeId, properties)
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.workflow-designer {
  width: 100%;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: #001529;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.sider {
  background: white;
  border-right: 1px solid #e8e8e8;
}
</style>
