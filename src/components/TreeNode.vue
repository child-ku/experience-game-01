<template>
  <div class="tree-node">
    <div class="tree-line">
      <span v-if="isComplexType" class="tree-expand" @click="toggleExpand">
        {{ isExpanded ? '−' : '+' }}
      </span>
      <span v-else class="tree-expand tree-expand-empty"></span>
      
      <span v-if="showKey" class="tree-key">{{ key }}</span>
      <span v-if="showKey" class="tree-colon">:</span>
      
      <span v-if="!isComplexType" class="tree-value" :class="valueClass">
        {{ displayValue }}
      </span>
      <span v-else class="tree-type">
        {{ displayType }}
      </span>
    </div>
    
    <div v-if="isComplexType && isExpanded" class="tree-children">
      <template v-if="isArray">
        <TreeNode 
          v-for="(item, index) in data" 
          :key="index"
          :data="item"
          :key-name="index"
          :path="path.concat(index)"
          @update="$emit('update', ...arguments)"
        />
      </template>
      <template v-else>
        <TreeNode 
          v-for="(value, childKey) in data" 
          :key="childKey"
          :data="value"
          :key-name="childKey"
          :path="path.concat(childKey)"
          @update="$emit('update', ...arguments)"
        />
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TreeNode',
  props: {
    data: {
      type: [Object, Array, String, Number, Boolean, null],
      required: true
    },
    keyName: {
      type: [String, Number],
      default: null
    },
    path: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  data() {
    return {
      isExpanded: true
    };
  },
  computed: {
    showKey() {
      return this.keyName !== null;
    },
    key() {
      if (typeof this.keyName === 'string') {
        return `"${this.keyName}"`;
      }
      return String(this.keyName);
    },
    type() {
      if (this.data === null) return 'null';
      return typeof this.data;
    },
    isComplexType() {
      return this.type === 'object';
    },
    isArray() {
      return Array.isArray(this.data);
    },
    displayType() {
      if (this.isArray) {
        return `Array[${this.data.length}]`;
      }
      return 'Object';
    },
    displayValue() {
      if (this.data === null) return 'null';
      if (this.type === 'string') return `"${this.data}"`;
      return String(this.data);
    },
    valueClass() {
      if (this.data === null) return 'tree-null';
      if (this.type === 'string') return 'tree-string';
      if (this.type === 'boolean') return 'tree-boolean';
      if (this.type === 'number') return 'tree-number';
      return 'tree-value';
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    }
  }
};
</script>

<style scoped>
.tree-node {
  margin-left: 24px;
  position: relative;
}

.tree-node::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 8px;
  width: 8px;
  height: 1px;
  background: #666;
}

.tree-node::after {
  content: '';
  position: absolute;
  left: -12px;
  top: 0;
  width: 1px;
  height: 100%;
  background: #666;
}

.tree-node:last-child::after {
  height: 8px;
}

.tree-line {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  cursor: default;
}

.tree-expand {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #3e3e42;
  text-align: center;
  line-height: 16px;
  cursor: pointer;
  margin-right: 4px;
  font-size: 12px;
  user-select: none;
  color: #d4d4d4;
}

.tree-expand:hover {
  background: #4a4a4a;
}

.tree-expand-empty {
  cursor: default;
  background: transparent;
}

.tree-key {
  color: #ce9178;
  font-weight: 600;
}

.tree-colon {
  color: #d4d4d4;
  margin: 0 4px;
}

.tree-value {
  color: #4ec9b0;
}

.tree-string {
  color: #ce9178;
}

.tree-boolean {
  color: #569cd6;
}

.tree-number {
  color: #b5cea8;
}

.tree-null {
  color: #808080;
}

.tree-type {
  color: #c586c0;
  font-style: italic;
}

.tree-children {
  margin-top: 2px;
}
</style>