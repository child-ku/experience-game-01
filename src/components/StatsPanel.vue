<template>
  <div class="stats-panel">
    <h3>统计信息</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-label">字符数</span>
        <span class="stat-value">{{ stats.charCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">字节数</span>
        <span class="stat-value">{{ stats.byteCount }}B</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">键值对数量</span>
        <span class="stat-value">{{ stats.keyValuePairs }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">深度</span>
        <span class="stat-value">{{ stats.depth }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">数组数量</span>
        <span class="stat-value">{{ stats.arrays }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">对象数量</span>
        <span class="stat-value">{{ stats.objects }}</span>
      </div>
    </div>
    
    <div v-if="errors.length" class="error-section">
      <h4>错误信息</h4>
      <div class="error-list">
        <div v-for="(error, index) in errors" :key="index" class="error-item">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsPanel',
  props: {
    jsonData: {
      type: [Object, Array, null],
      default: null
    },
    jsonText: {
      type: String,
      default: ''
    },
    errors: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      stats: {
        charCount: 0,
        byteCount: 0,
        keyValuePairs: 0,
        depth: 0,
        arrays: 0,
        objects: 0
      }
    };
  },
  mounted() {
    this.calculateStats();
  },
  watch: {
    jsonData: 'calculateStats',
    jsonText: 'calculateStats'
  },
  methods: {
    calculateStats() {
      this.stats = {
        charCount: this.jsonText.length,
        byteCount: new Blob([this.jsonText]).size,
        keyValuePairs: 0,
        depth: 0,
        arrays: 0,
        objects: 0
      };

      if (this.jsonData !== null) {
        const counts = this.traverseData(this.jsonData, 1);
        this.stats.keyValuePairs = counts.keyValuePairs;
        this.stats.depth = counts.maxDepth;
        this.stats.arrays = counts.arrays;
        this.stats.objects = counts.objects;
      }
    },
    traverseData(data, currentDepth) {
      let counts = {
        keyValuePairs: 0,
        maxDepth: currentDepth,
        arrays: 0,
        objects: 0
      };

      if (Array.isArray(data)) {
        counts.arrays++;
        data.forEach(item => {
          const childCounts = this.traverseData(item, currentDepth + 1);
          counts.keyValuePairs += childCounts.keyValuePairs;
          counts.maxDepth = Math.max(counts.maxDepth, childCounts.maxDepth);
          counts.arrays += childCounts.arrays;
          counts.objects += childCounts.objects;
        });
      } else if (data !== null && typeof data === 'object') {
        counts.objects++;
        const keys = Object.keys(data);
        counts.keyValuePairs += keys.length;

        keys.forEach(key => {
          const childCounts = this.traverseData(data[key], currentDepth + 1);
          counts.maxDepth = Math.max(counts.maxDepth, childCounts.maxDepth);
          counts.arrays += childCounts.arrays;
          counts.objects += childCounts.objects;
        });
      }

      return counts;
    }
  }
};
</script>

<style scoped>
.stats-panel {
  background: #252526;
  padding: 20px;
  border-radius: 8px;
  color: #d4d4d4;
  font-size: 13px;
  height: 100%;
  overflow: auto;
}

.stats-panel h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.stat-item:hover {
  background: #2a2d2e;
}

.stat-label {
  color: #858585;
  font-size: 13px;
}

.stat-value {
  color: #4ec9b0;
  font-weight: 600;
  font-size: 14px;
}

.error-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #3e3e42;
}

.error-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #f48771;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  padding: 10px;
  background: #333333;
  border-radius: 4px;
  color: #f48771;
  font-size: 12px;
  border-left: 3px solid #d93025;
}

@media (max-width: 768px) {
  .stats-panel {
    padding: 16px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-item {
    padding: 10px;
  }
}
</style>