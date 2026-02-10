<template>
  <div class="page-container">
    <div class="page-header">
      <h1>工作流定义</h1>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建工作流
      </el-button>
    </div>

    <div class="page-content">
      <el-table :data="definitions" v-loading="loading" style="width: 100%" class="responsive-table">
        <el-table-column prop="name" label="流程名称" min-width="150" fixed="left" />
        <el-table-column prop="key" label="标识" width="150" class-name="hidden-xs" />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip class-name="hidden-xs" />
        <el-table-column prop="version" label="版本" width="70" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="120" class-name="hidden-xs">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt).split(' ')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDesign(row)">
              设计流程
            </el-button>
            <el-button type="primary" link @click="handleEditSettings(row)">
              配置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑工作流' : '新建工作流'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：成本审批" />
        </el-form-item>
        <el-form-item label="标识" prop="key">
          <el-input v-model="form.key" placeholder="例如：cost_approval" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
           <el-switch v-model="form.isActive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore, type WorkflowDefinition } from '../stores/workflow'
import { Plus } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { ElMessage, type FormInstance } from 'element-plus'

const router = useRouter()
const store = useWorkflowStore()
const { definitions, loading } = storeToRefs(store)

const showDialog = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const currentId = ref<number | null>(null)

const form = reactive({
  name: '',
  key: '',
  description: '',
  isActive: true
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入标识', trigger: 'blur' }]
}

onMounted(() => {
  store.fetchDefinitions()
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const handleCreate = () => {
  isEdit.value = false
  currentId.value = null
  form.name = ''
  form.key = ''
  form.description = ''
  form.isActive = true
  showDialog.value = true
}

const handleEditSettings = (row: WorkflowDefinition) => {
  isEdit.value = true
  currentId.value = row.id
  form.name = row.name
  form.key = row.key
  form.description = row.description || ''
  form.isActive = row.isActive
  showDialog.value = true
}

const handleDesign = (row: WorkflowDefinition) => {
  router.push(`/workflows/${row.id}`)
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value && currentId.value) {
          await store.updateDefinition(currentId.value, {
            name: form.name,
            description: form.description,
            isActive: form.isActive
          })
          ElMessage.success('工作流已更新')
        } else {
          await store.createDefinition({
            name: form.name,
            key: form.key,
            description: form.description,
            isActive: form.isActive
          })
          ElMessage.success('工作流已创建')
        }
        showDialog.value = false
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>