// 节点类型配置
// 定义所有支持的工作流节点类型

export const NODE_TYPES = {
  // 开始节点
  START: {
    type: 'start',
    label: '开始',
    icon: '●',
    color: '#67c23a',
    description: '流程的开始节点',
    shape: 'circle',
    width: 60,
    height: 60,
    defaultText: '开始',
    maxPorts: { top: 0, right: 1, bottom: 0, left: 0 },
    minPorts: { top: 0, right: 1, bottom: 0, left: 0 }
  },
  
  // 结束节点
  END: {
    type: 'end',
    label: '结束',
    icon: '●',
    color: '#f56c6c',
    description: '流程的结束节点',
    shape: 'circle',
    width: 60,
    height: 60,
    defaultText: '结束',
    maxPorts: { top: 1, right: 0, bottom: 0, left: 0 },
    minPorts: { top: 1, right: 0, bottom: 0, left: 0 }
  },
  
  // 任务节点
  TASK: {
    type: 'task',
    label: '任务',
    icon: '■',
    color: '#409eff',
    description: '需要执行的任务节点',
    shape: 'rectangle',
    width: 120,
    height: 60,
    defaultText: '任务',
    maxPorts: { top: 1, right: 1, bottom: 1, left: 1 },
    minPorts: { top: 1, bottom: 1 }
  },
  
  // 决策节点
  DECISION: {
    type: 'decision',
    label: '决策',
    icon: '◆',
    color: '#e6a23c',
    description: '根据条件进行分支决策',
    shape: 'diamond',
    width: 80,
    height: 80,
    defaultText: '决策',
    maxPorts: { top: 1, right: 1, bottom: 1, left: 1 },
    minPorts: { top: 1, bottom: 2 }
  },
  
  // 并行网关
  PARALLEL: {
    type: 'parallel',
    label: '并行',
    icon: '▣',
    color: '#9b59b6',
    description: '并行执行多个分支',
    shape: 'rectangle',
    width: 80,
    height: 80,
    defaultText: '并行',
    borderStyle: 'dashed',
    maxPorts: { top: 1, right: 2, bottom: 1, left: 2 },
    minPorts: { top: 1, bottom: 1 }
  },
  
  // 子流程节点
  SUBPROCESS: {
    type: 'subprocess',
    label: '子流程',
    icon: 'Ⓢ',
    color: '#1abc9c',
    description: '嵌套的子流程',
    shape: 'rectangle',
    width: 140,
    height: 80,
    defaultText: '子流程',
    borderStyle: 'double',
    maxPorts: { top: 1, right: 1, bottom: 1, left: 1 },
    minPorts: { top: 1, bottom: 1 }
  },
  
  // 文档节点
  DOCUMENT: {
    type: 'document',
    label: '文档',
    icon: '📄',
    color: '#34495e',
    description: '文档或数据节点',
    shape: 'rectangle',
    width: 100,
    height: 60,
    defaultText: '文档',
    maxPorts: { top: 1, right: 1, bottom: 1, left: 1 },
    minPorts: { top: 0, bottom: 0 }
  },
  
  // 人工节点
  HUMAN: {
    type: 'human',
    label: '人工',
    icon: '👤',
    color: '#e74c3c',
    description: '需要人工处理的节点',
    shape: 'rectangle',
    width: 120,
    height: 60,
    defaultText: '人工处理',
    maxPorts: { top: 1, right: 1, bottom: 1, left: 1 },
    minPorts: { top: 1, bottom: 1 }
  },
  
  // 定时器节点
  TIMER: {
    type: 'timer',
    label: '定时器',
    icon: '⏰',
    color: '#f39c12',
    description: '定时触发的节点',
    shape: 'circle',
    width: 60,
    height: 60,
    defaultText: '定时器',
    maxPorts: { top: 1, right: 1, bottom: 0, left: 0 },
    minPorts: { top: 1, right: 1 }
  }
}

// 获取所有节点类型列表
export const getNodeTypesList = () => {
  return Object.values(NODE_TYPES)
}

// 根据类型获取节点配置
export const getNodeTypeConfig = (type) => {
  return Object.values(NODE_TYPES).find(nodeType => nodeType.type === type)
}

// 节点分类
export const NODE_CATEGORIES = {
  BASIC: {
    category: '基础',
    types: ['start', 'end', 'task', 'decision']
  },
  ADVANCED: {
    category: '高级',
    types: ['parallel', 'subprocess']
  },
  SPECIAL: {
    category: '特殊',
    types: ['document', 'human', 'timer']
  }
}

// 获取分类的节点类型
export const getNodeTypesByCategory = (category) => {
  const categoryConfig = NODE_CATEGORIES[category]
  if (!categoryConfig) return []
  return categoryConfig.types.map(type => getNodeTypeConfig(type)).filter(Boolean)
}