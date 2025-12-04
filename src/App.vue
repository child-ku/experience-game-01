<template>
  <div class="workflow-designer">
    <WorkflowDesigner />
  </div>
</template>

<script>
import WorkflowDesigner from './components/WorkflowDesigner.vue'

export default {
  name: 'App',
  components: {
    WorkflowDesigner
  }
}
</script>

<style>
.workflow-designer {
  width: 100%;
  height: 100%;
}
</style>