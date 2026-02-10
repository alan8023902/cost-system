<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex-center">
        <el-button link @click="$router.back()">
          <el-icon class="mr-8"><ArrowLeft /></el-icon> 返回
        </el-button>
        <h1 class="ml-16">流程设计：{{ currentDefinition?.name || '加载中...' }}</h1>
      </div>
      <el-button type="primary" :loading="saving" @click="handleSave">
        保存设计
      </el-button>
    </div>

    <div class="page-content">
      <div class="workflow-steps" style="max-width: 800px; margin: 0 auto;">
         <el-timeline>
           <el-timeline-item
             v-for="(node, index) in nodes"
             :key="index"
             :type="getNodeType(node.type)"
             :hollow="node.type === 'START' || node.type === 'END'"
             placement="top"
             :timestamp="`第 ${index + 1} 步`"
           >
             <el-card class="node-card">
               <div class="flex-between">
                 <div class="flex-center">
                    <span class="node-icon mr-8">
                      <el-icon v-if="node.type === 'START'"><VideoPlay /></el-icon>
                      <el-icon v-else-if="node.type === 'END'"><Flag /></el-icon>
                      <el-icon v-else><User /></el-icon>
                    </span>
                    <h4>{{ node.name }}</h4>
                 </div>
                 <div v-if="node.type !== 'START'">
                  <el-tag size="small" class="mr-8">{{ getNodeLabel(node.type) }}</el-tag>
                  <el-button type="primary" link size="small" @click="editNode(index)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="removeNode(index)" v-if="node.type !== 'END'">移除</el-button>
                </div>
                 <div v-else>
                    <el-tag size="small">开始</el-tag>
                 </div>
               </div>
              <p class="text-secondary mt-8" v-if="node.approverRole">
                审批角色：<el-tag size="small" effect="plain">{{ getApproverRoleLabel(node.approverRole) }}</el-tag>
              </p>
             </el-card>
           </el-timeline-item>
           
           <el-timeline-item>
             <el-button class="w-100" plain :icon="Plus" @click="addNode">新增审批步骤</el-button>
           </el-timeline-item>
         </el-timeline>
      </div>
    </div>

    <!-- Node Dialog -->
    <el-dialog
      v-model="showNodeDialog"
      :title="isEdit ? '编辑步骤' : '新增步骤'"
      width="500px"
    >
      <el-form :model="nodeForm" label-position="top">
        <el-form-item label="步骤名称">
          <el-input v-model="nodeForm.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="nodeForm.type" style="width: 100%">
            <el-option label="审批任务" value="USER_TASK" />
            <el-option label="结束节点" value="END" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批角色" v-if="nodeForm.type === 'USER_TASK'">
          <el-select v-model="nodeForm.approverRole" style="width: 100%">
             <el-option label="项目管理员" value="PROJECT_ADMIN" />
             <el-option label="复核人" value="REVIEWER" />
             <el-option label="审批人" value="APPROVER" />
             <el-option label="盖章管理员" value="SEAL_ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNodeDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmNode">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '../stores/workflow'
import { ArrowLeft, Plus, VideoPlay, Flag, User } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

interface WorkflowNode {
  id: string
  name: string
  type: 'START' | 'USER_TASK' | 'END'
  approverRole?: string
}

const route = useRoute()
const router = useRouter()
const store = useWorkflowStore()
const { currentDefinition } = storeToRefs(store)

const saving = ref(false)
const nodes = ref<WorkflowNode[]>([])
const showNodeDialog = ref(false)
const isEdit = ref(false)
const editingIndex = ref(-1)

const nodeForm = reactive({
  name: '',
  type: 'USER_TASK' as const,
  approverRole: ''
})

onMounted(async () => {
  const id = Number(route.params.id)
  await store.fetchDefinition(id)
  if (currentDefinition.value) {
    try {
      const parsed = JSON.parse(currentDefinition.value.nodesJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        nodes.value = parsed
      } else {
        // Initialize with default start node
        nodes.value = [
          { id: 'start', name: '开始', type: 'START' }
        ]
      }
    } catch (e) {
      nodes.value = [{ id: 'start', name: '开始', type: 'START' }]
    }
  }
})

const getNodeType = (type: string) => {
  if (type === 'START') return 'success'
  if (type === 'END') return 'danger'
  return 'primary'
}

const getNodeLabel = (type: string) => {
  const map: Record<string, string> = {
    START: '开始',
    USER_TASK: '审批任务',
    END: '结束'
  }
  return map[type] || type
}

const approverRoleMap: Record<string, string> = {
  PROJECT_ADMIN: '项目管理员',
  REVIEWER: '复核人',
  APPROVER: '审批人',
  SEAL_ADMIN: '盖章管理员'
}

const getApproverRoleLabel = (role?: string) => {
  if (!role) return ''
  return approverRoleMap[role] || role
}

const addNode = () => {
  isEdit.value = false
  nodeForm.name = '新审批步骤'
  nodeForm.type = 'USER_TASK'
  nodeForm.approverRole = ''
  showNodeDialog.value = true
}

const editNode = (index: number) => {
  const node = nodes.value[index]
  isEdit.value = true
  editingIndex.value = index
  nodeForm.name = node.name
  nodeForm.type = node.type as any
  nodeForm.approverRole = node.approverRole || ''
  showNodeDialog.value = true
}

const removeNode = (index: number) => {
  nodes.value.splice(index, 1)
}

const confirmNode = () => {
  if (isEdit.value) {
    nodes.value[editingIndex.value] = {
      ...nodes.value[editingIndex.value],
      name: nodeForm.name,
      type: nodeForm.type,
      approverRole: nodeForm.approverRole
    }
  } else {
    nodes.value.push({
      id: `node_${Date.now()}`,
      name: nodeForm.name,
      type: nodeForm.type,
      approverRole: nodeForm.approverRole
    })
  }
  showNodeDialog.value = false
}

const handleSave = async () => {
  if (!currentDefinition.value) return
  saving.value = true
  try {
    await store.updateDefinition(currentDefinition.value.id, {
      nodesJson: JSON.stringify(nodes.value)
    })
    ElMessage.success('流程设计已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.node-card {
  border-left: 4px solid transparent;
}
.node-card:hover {
  border-left-color: var(--el-color-primary);
}
</style>