<template>
  <div class="page-container">
    <div class="page-header">
      <h1>模板管理</h1>
      <el-button type="primary" @click="$router.push('/templates/create')">
        <el-icon class="mr-8"><Plus /></el-icon>
        新建模板
      </el-button>
    </div>

    <div class="page-content">
      <el-table
        v-loading="loading"
        :data="templates"
        style="width: 100%"
        row-key="id"
        class="responsive-table"
      >
        <el-table-column prop="id" label="ID" width="80" class-name="hidden-xs" />
        <el-table-column prop="name" label="模板名称" min-width="180" fixed="left" />
        <el-table-column prop="templateVersion" label="版本" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="120" class-name="hidden-xs">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt).split(' ')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/templates/${row.id}`)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button 
              v-if="row.status === 'DRAFT'"
              link 
              type="success" 
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button 
              v-if="row.status === 'PUBLISHED'"
              link 
              type="danger" 
              @click="handleDisable(row)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useTemplateStore } from '../stores/template'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useTemplateStore()
const templates = computed(() => store.templates)
const loading = computed(() => store.loading)

onMounted(() => {
  store.fetchTemplates()
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return 'success'
    case 'DRAFT': return 'warning'
    case 'DISABLED': return 'info'
    default: return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PUBLISHED': return '已发布'
    case 'DRAFT': return '草稿'
    case 'DISABLED': return '已停用'
    default: return status
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const handlePublish = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定发布该模板吗？', '提示', {
      type: 'warning'
    })
    const res = await store.publishTemplate(row.id)
    if (res.success) {
      ElMessage.success('模板已发布')
      store.fetchTemplates()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    // cancelled
  }
}

const handleDisable = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定停用该模板吗？', '提示', {
      type: 'warning'
    })
    const res = await store.disableTemplate(row.id)
    if (res.success) {
      ElMessage.success('模板已停用')
      store.fetchTemplates()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    // cancelled
  }
}
</script>
