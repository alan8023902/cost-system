<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="flex-center gap-3">
        <h1>项目管理</h1>
        <el-tag effect="plain" type="info">
          {{ filteredProjects.length }} 个项目
        </el-tag>
      </div>
      <el-button 
        type="primary" 
        :icon="Plus" 
        @click="showCreateDialog = true"
      >
        新建项目
      </el-button>
    </div>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索项目编号或名称"
          clearable
          style="width: 280px;"
          :prefix-icon="Search"
        />

        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          clearable
          style="width: 140px;"
        >
          <el-option label="进行中" value="ACTIVE" />
          <el-option label="已归档" value="ARCHIVED" />
        </el-select>

        <div class="flex-1"></div>

        <el-button 
          :icon="Refresh" 
          @click="handleRefresh" 
          :loading="loading"
        >
          刷新
        </el-button>
      </div>

      <!-- Data Table -->
      <div class="data-table-wrapper">
        <el-table
          :data="filteredProjects"
          v-loading="loading"
          style="width: 100%"
          @row-click="handleRowClick"
          :height="tableHeight"
          stripe
        >
          <el-table-column 
            prop="code" 
            label="项目编号" 
            min-width="160"
            sortable
            fixed
          >
            <template #default="{ row }">
              <span class="font-medium text-primary">{{ row.code }}</span>
            </template>
          </el-table-column>

          <el-table-column 
            prop="name" 
            label="项目名称" 
            min-width="280"
            sortable
            show-overflow-tooltip
          />

          <el-table-column 
            label="状态" 
            width="100" 
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
                effect="plain"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column 
            label="创建时间" 
            width="180"
            sortable
            prop="createdAt"
          >
            <template #default="{ row }">
              <div class="text-sm text-secondary">
                {{ formatDate(row.createdAt) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            label="更新时间" 
            width="180"
            sortable
            prop="updatedAt"
          >
            <template #default="{ row }">
              <div class="text-sm text-secondary">
                {{ formatDate(row.updatedAt) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column 
            label="操作" 
            width="140" 
            align="center" 
            fixed="right"
          >
            <template #default="{ row }">
              <el-button 
                link 
                type="primary" 
                :icon="View"
                @click.stop="goToProject(row.id)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <div class="empty-state">
              <el-icon class="empty-icon"><FolderOpened /></el-icon>
              <div class="empty-title">暂无项目</div>
              <div class="empty-desc">点击"新建项目"按钮创建第一个项目</div>
            </div>
          </template>
        </el-table>
      </div>
    </div>

    <!-- Create Project Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建项目"
      width="520px"
      :close-on-click-modal="false"
      @close="handleCloseDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
        label-width="100px"
      >
        <el-form-item label="项目编号" prop="code">
          <el-input
            v-model="createForm.code"
            placeholder="例如: PRJ-2024-001"
            maxlength="64"
            show-word-limit
            clearable
          />
          <div class="form-tip">项目的唯一标识符，建议使用有意义的编号规则</div>
        </el-form-item>

        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="输入项目名称"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="输入项目描述（可选）"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCloseDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="createLoading"
          @click="handleCreateProject"
        >
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { 
  FolderOpened, 
  Plus, 
  Refresh, 
  Search, 
  View 
} from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'

const router = useRouter()
const projectStore = useProjectStore()

const { projects, loading } = storeToRefs(projectStore)

// Filter State
const searchKeyword = ref('')
const statusFilter = ref('')

// Dialog State
const showCreateDialog = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()

// Create Form
const createForm = reactive({
  code: '',
  name: '',
  description: ''
})

const createRules = {
  code: [
    { required: true, message: '请输入项目编号', trigger: 'blur' },
    { min: 3, max: 64, message: '长度应为 3 到 64 个字符', trigger: 'blur' },
    { 
      pattern: /^[A-Z0-9\-_]+$/i, 
      message: '只能包含字母、数字、中划线和下划线', 
      trigger: 'blur' 
    }
  ],
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度应为 2 到 100 个字符', trigger: 'blur' }
  ]
}

// Computed
const tableHeight = computed(() => {
  return 'calc(100vh - 280px)'
})

const filteredProjects = computed(() => {
  return projects.value.filter((p) => {
    const matchKeyword =
      !searchKeyword.value ||
      p.code.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      p.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    
    const matchStatus = !statusFilter.value || p.status === statusFilter.value
    
    return matchKeyword && matchStatus
  })
})

// Lifecycle
onMounted(async () => {
  await projectStore.fetchProjects()
})

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status: string) => {
  return status === 'ACTIVE' ? 'success' : 'info'
}

const getStatusText = (status: string) => {
  return status === 'ACTIVE' ? '进行中' : '已归档'
}

const handleRefresh = async () => {
  await projectStore.fetchProjects()
  ElMessage.success('刷新成功')
}

const handleRowClick = (row: any) => {
  goToProject(row.id)
}

const goToProject = (id: number) => {
  router.push(`/projects/${id}`)
}

const handleCloseDialog = () => {
  showCreateDialog.value = false
  createFormRef.value?.resetFields()
  createForm.description = ''
}

const handleCreateProject = async () => {
  if (!createFormRef.value) return
  
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return

    createLoading.value = true
    try {
      await projectStore.createProject({
        code: createForm.code,
        name: createForm.name,
        description: createForm.description || undefined
      })
      
      ElMessage.success('项目创建成功')
      handleCloseDialog()
      await projectStore.fetchProjects()
    } catch (error: any) {
      ElMessage.error(error.message || '创建失败')
    } finally {
      createLoading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
@import '../styles/design-tokens.scss';

.form-tip {
  font-size: $text-xs;
  color: $text-tertiary;
  margin-top: $space-1;
  line-height: 1.5;
}

// Table row hover
:deep(.el-table__row) {
  cursor: pointer;
  transition: background-color $transition-fast;
}

// Empty state styling
.empty-state {
  padding: $space-16 $space-8;
  text-align: center;

  .empty-icon {
    font-size: 64px;
    color: $neutral-300;
    margin-bottom: $space-4;
  }

  .empty-title {
    font-size: $text-lg;
    font-weight: $font-medium;
    color: $text-secondary;
    margin-bottom: $space-2;
  }

  .empty-desc {
    font-size: $text-sm;
    color: $text-tertiary;
  }
}

// Responsive
@media (max-width: $breakpoint-md) {
  .page-header {
    flex-direction: column;
    align-items: stretch;

    h1 {
      font-size: $text-xl;
    }
  }

  .filter-bar {
    flex-direction: column;
    gap: $space-3;

    > * {
      width: 100% !important;
    }
  }
}
</style>
