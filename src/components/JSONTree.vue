<template>
  <div class="json-tree">
    <JSONNode :data="data" :path="path" /> 
  </div>
</template>

<script setup>
import JSONNode from './JSONNode.vue'

const props = defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean, null],
    default: null
  },
  path: {
    type: String,
    default: 'root'
  }
})
</script>

<style scoped>
.json-tree {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #d4d4d4;
  background-color: #1e1e1e;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
