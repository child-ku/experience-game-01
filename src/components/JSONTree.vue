<template>
  <div class="tree-container">
    <div v-if="jsonData" class="tree-root">
      <TreeNode 
        :data="jsonData" 
        :path="[]"
        @update="handleUpdate"
      />
    </div>
    <div v-else class="empty-state">
      请输入有效的JSON数据
    </div>
  </div>
</template>

<script>
import TreeNode from './TreeNode.vue';

export default {
  name: 'JSONTree',
  components: { TreeNode },
  props: {
    modelValue: {
      type: [Object, Array, null],
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      jsonData: this.modelValue
    };
  },
  watch: {
    modelValue(newValue) {
      this.jsonData = newValue;
    }
  },
  methods: {
    handleUpdate(path, value) {
      // 深拷贝数据
      const newData = JSON.parse(JSON.stringify(this.jsonData));
      
      // 根据路径更新值
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      this.$emit('update:modelValue', newData);
    }
  }
};
</script>

<style scoped>
.tree-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.tree-root {
  margin-left: 0 !important;
}

.tree-root::before,
.tree-root::after {
  display: none !important;
}

.empty-state {
  color: #808080;
  text-align: center;
  padding: 20px;
  font-style: italic;
}
</style>