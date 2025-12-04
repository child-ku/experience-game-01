<template>
  <div 
    ref="containerRef" 
    class="workflow-canvas"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  ></div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue'
import { Graph } from '@antv/x6'
import '@antv/x6-vue-shape'

const props = defineProps({
  draggingNode: Object
})

const emit = defineEmits(['canvas-ready'])

const containerRef = ref(null)
let graph = null

// 初始化画布
const initGraph = () => {
  if (!containerRef.value) return

  graph = new Graph({
    container: containerRef.value,
    width: containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: {
        color: '#d0d0d0',
        thickness: 1
      }
    },
    panning: {
      enabled: true,
      modifiers: 'shift'
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 2
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8
        }
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20
      },
      createEdge() {
        return graph.createEdge({
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: {
                name: 'classic',
                size: 8
              }
            }
          },
          zIndex: 0
        })
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet
      }
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF'
          }
        }
      }
    },
    selecting: {
      enabled: true,
      rubberband: true,
      showNodeSelectionBox: true
    },
    snapline: true,
    keyboard: true,
    clipboard: true
  })

  // 监听节点选择事件
  graph.on('node:selected', ({ node }) => {
    console.log('Node selected:', node)
  })

  // 监听节点双击事件
  graph.on('node:dblclick', ({ node }) => {
    console.log('Node double clicked:', node)
  })

  emit('canvas-ready')

  // 加载本地存储的工作流数据
  loadWorkflowData()
}

// 处理拖拽覆盖
const handleDragOver = (event) => {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'copy'
}

// 处理拖拽进入
const handleDragEnter = (event) => {
  event.preventDefault()
  event.stopPropagation()
}

// 处理拖拽离开
const handleDragLeave = (event) => {
  event.preventDefault()
  event.stopPropagation()
}

// 处理拖拽放下
const handleDrop = (event) => {
  event.preventDefault()
  event.stopPropagation()

  try {
    // 尝试获取拖拽数据
    let data = event.dataTransfer.getData('application/json')
    
    // 如果没有获取到 JSON 数据，尝试获取文本数据
    if (!data) {
      data = event.dataTransfer.getData('text/plain')
      console.log('Using text/plain data:', data)
    }
    
    if (!data) {
      console.log('No data found in drag event')
      return
    }

    const node = JSON.parse(data)
    if (!node || !node.type) {
      console.log('Invalid node data:', node)
      return
    }

    // 计算节点在画布中的位置
    const rect = containerRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    console.log('Creating node at:', x, y)

    // 创建节点
    createNode(node.type, x, y)
  } catch (error) {
    console.error('Error handling drop event:', error)
  }
}

// 创建节点
const createNode = (type, x, y) => {
  let shape = 'rect'
  let width = 120
  let height = 60
  let label = ''
  let fill = ''
  let stroke = ''

  switch (type) {
    case 'start':
      shape = 'circle'
      width = 80
      height = 80
      label = '开始'
      fill = '#f6ffed'
      stroke = '#52c41a'
      break
    case 'end':
      shape = 'circle'
      width = 80
      height = 80
      label = '结束'
      fill = '#fff1f0'
      stroke = '#ff4d4f'
      break
    case 'task':
    case 'approval':
    case 'reject':
      label = type === 'task' ? '任务' : type === 'approval' ? '审批' : '拒绝'
      fill = '#e6f7ff'
      stroke = '#1890ff'
      break
    case 'decision':
    case 'condition':
      shape = 'diamond'
      label = type === 'decision' ? '决策' : '条件'
      fill = '#fffbe6'
      stroke = '#faad14'
      break
    case 'parallel':
    case 'fork':
    case 'join':
      shape = 'rect'
      width = 140
      height = 80
      label = type === 'parallel' ? '并行' : type === 'fork' ? '分叉' : '合并'
      fill = '#f9f0ff'
      stroke = '#722ed1'
      break
  }

  // 将节点添加到画布
  graph.addNode({
    x: x - width / 2,
    y: y - height / 2,
    width: width,
    height: height,
    shape: shape,
    attrs: {
      body: {
        fill: fill,
        stroke: stroke,
        strokeWidth: 2,
        rx: shape === 'rect' ? 8 : 0,
        ry: shape === 'rect' ? 8 : 0
      },
      label: {
        text: label,
        fill: '#333',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    ports: {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        },
        left: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        },
        right: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5F95FF',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        }
      },
      items: [
        { group: 'top' },
        { group: 'bottom' },
        { group: 'left' },
        { group: 'right' }
      ]
    }
  })
}

// 导出数据
const exportData = () => {
  if (!graph) return null
  return graph.toJSON()
}

// 清空画布
const clear = () => {
  if (graph) {
    graph.clearCells()
  }
}

// 更新节点属性
const updateNode = (nodeId, properties) => {
  if (!graph) return
  const node = graph.getCellById(nodeId)
  if (node) {
    // 根据需要更新节点属性
    if (properties.label) {
      node.attr('label/text', properties.label)
    }
    if (properties.fill) {
      node.attr('body/fill', properties.fill)
    }
    if (properties.stroke) {
      node.attr('body/stroke', properties.stroke)
    }
  }
}

// 加载工作流数据
const loadWorkflowData = () => {
  const data = localStorage.getItem('workflow_data')
  if (data) {
    try {
      const jsonData = JSON.parse(data)
      graph.fromJSON(jsonData)
    } catch (e) {
      console.error('Failed to load workflow data:', e)
    }
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (graph && containerRef.value) {
    graph.resize(containerRef.value.offsetWidth, containerRef.value.offsetHeight)
  }
}

onMounted(() => {
  initGraph()
  window.addEventListener('resize', handleResize)
})

// 暴露方法给父组件
const expose = {
  exportData,
  clear,
  updateNode
}

defineExpose(expose)
</script>

<style scoped>
.workflow-canvas {
  width: 100%;
  height: 100%;
  background: #ffffff;
  position: relative;
}
</style>
