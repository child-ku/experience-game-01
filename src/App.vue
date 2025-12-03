<template>
  <div class="app-container">
    <header class="app-header">
      <h1>JSON数据可视化工具</h1>
      <p>智能编辑器，支持双模式编辑和实时验证</p>
    </header>

    <main class="app-main">
      <div class="left-panel">
        <div class="editor-container">
          <div class="editor-toolbar">
            <div class="toolbar-buttons">
              <button class="btn" @click="formatJSON">格式化</button>
              <button class="btn btn-secondary" @click="minifyJSON">压缩</button>
              <button class="btn btn-secondary" @click="clearJSON">清空</button>
            </div>
            <div class="mode-toggle">
              <button class="mode-btn" :class="{ active: currentMode === 'text' }" @click="switchMode('text')">文本模式</button>
              <button class="mode-btn" :class="{ active: currentMode === 'tree' }" @click="switchMode('tree')">树形模式</button>
            </div>
          </div>
          
          <div class="editor-content">
            <JSONEditor 
              v-if="currentMode === 'text'" 
              v-model="jsonText"
              :errors="validationErrors"
              @validate="handleValidation"
            />
            <JSONTree 
              v-else 
              v-model="jsonData"
              @update:modelValue="handleTreeUpdate"
            />
          </div>
        </div>
      </div>

      <div class="right-panel">
        <StatsPanel 
          :jsonData="jsonData"
          :jsonText="jsonText"
          :errors="validationErrors"
        />
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      jsonText: `{
  "name": "JSON可视化工具",
  "version": "1.0.0",
  "features": [
    "语法高亮",
    "自动补全",
    "实时验证",
    "双模式编辑"
  ],
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "fontSize": 14
  },
  "isActive": true,
  "lastUpdated": "2024-01-01"
}`,
      jsonData: null,
      currentMode: 'text',
      validationErrors: []
    };
  },
  mounted() {
    this.parseJSON();
  },
  methods: {
    parseJSON() {
      try {
        this.jsonData = JSON.parse(this.jsonText);
        this.validationErrors = [];
      } catch (error) {
        this.validationErrors = [error.message];
      }
    },
    formatJSON() {
      try {
        const parsed = JSON.parse(this.jsonText);
        this.jsonText = JSON.stringify(parsed, null, 2);
        this.validationErrors = [];
      } catch (error) {
        this.validationErrors = [error.message];
      }
    },
    minifyJSON() {
      try {
        const parsed = JSON.parse(this.jsonText);
        this.jsonText = JSON.stringify(parsed);
        this.validationErrors = [];
      } catch (error) {
        this.validationErrors = [error.message];
      }
    },
    clearJSON() {
      this.jsonText = '';
      this.jsonData = null;
      this.validationErrors = [];
    },
    switchMode(mode) {
      this.currentMode = mode;
    },
    handleValidation(errors) {
      this.validationErrors = errors;
    },
    handleTreeUpdate(data) {
      this.jsonData = data;
      try {
        this.jsonText = JSON.stringify(data, null, 2);
        this.validationErrors = [];
      } catch (error) {
        this.validationErrors = [error.message];
      }
    }
  },
  watch: {
    jsonText(newText) {
      if (this.currentMode === 'text') {
        this.parseJSON();
      }
    }
  }
};
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px 32px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.app-header p {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  display: flex;
  padding: 24px;
  gap: 24px;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.right-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .right-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .app-main {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
  }

  .right-panel {
    width: 100%;
  }

  .app-header {
    padding: 16px 24px;
  }

  .app-header h1 {
    font-size: 24px;
  }
}
</style>