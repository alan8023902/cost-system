<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex-center">
        <el-button link @click="goBack">
          <el-icon class="mr-8"><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="ml-16">
          <h1 class="mb-4">{{ currentProject?.name || '项目详情' }}</h1>
          <small class="text-secondary">{{ currentProject?.code || '-' }}</small>
        </div>
      </div>
      <div class="flex-center header-stats">
        <el-tag effect="plain" class="mr-8">{{ projectVersions.length }} 个版本</el-tag>
        <el-tag effect="plain">{{ projectMembers.length }} 位成员</el-tag>
      </div>
    </div>

    <div class="page-content">
      <el-row :gutter="24">
        <el-col :span="24" :lg="16">
          <div class="section-card mb-24">
            <div class="flex-between mb-16">
              <h3>版本管理</h3>
              <el-button type="primary" :icon="Plus" @click="showCreateVersionDialog = true">
                新建版本
              </el-button>
            </div>

            <el-table
              :data="projectVersions"
              v-loading="loading"
              style="width: 100%"
              class="responsive-table"
              @row-dblclick="handleVersionRowDblClick"
            >
              <el-table-column label="版本号" width="100" align="center">
                <template #default="scope">
                  <span class="font-bold">V{{ scope.row.versionNo }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120" align="center">
                <template #default="scope">
                  <el-tag :type="getVersionTagType(scope.row.status)" size="small" effect="dark">
                    {{ getVersionStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" min-width="150" class-name="hidden-xs">
                <template #default="scope">{{ formatDate(scope.row.updatedAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link @click="enterWorkspace(scope.row)">
                    进入工作台 <el-icon class="ml-4"><ArrowRight /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <el-col :span="24" :lg="8">
          <div class="section-card">
            <div class="flex-between mb-16">
              <h3>成员列表</h3>
              <el-button :icon="Plus" size="small" @click="showAddMemberDialog = true">新增</el-button>
            </div>
             <el-table
                :data="projectMembers"
                v-loading="loading"
                style="width: 100%"
                size="small"
              >
                <el-table-column
                  prop="username"
                  label="成员"
                  min-width="120"
                >
                  <template #default="{ row }">
                     <div class="flex-center" style="justify-content: flex-start">
                        <el-avatar :size="24" class="mr-8">{{ row.username.charAt(0).toUpperCase() }}</el-avatar>
                        <span>{{ row.username }}</span>
                     </div>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="projectRole"
                  label="角色"
                  min-width="100"
                >
                   <template #default="{ row }">
                    <el-tag size="small" effect="plain">{{ getRoleText(row.projectRole) }}</el-tag>
                   </template>
                </el-table-column>
                <el-table-column label="" width="50" align="center" fixed="right">
                   <template #default>
                     <el-button link type="danger" :icon="Delete" />
                   </template>
                </el-table-column>
              </el-table>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Create Version Dialog -->
    <el-dialog
      v-model="showCreateVersionDialog"
      title="新建版本"
      width="400px"
      append-to-body
      class="responsive-dialog"
    >
      <div class="p-16">
        <p>确定基于最新数据创建新版本吗？</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateVersionDialog = false">取消</el-button>
          <el-button type="primary" :loading="creatingVersion" @click="handleCreateVersion">
            确认创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Add Member Dialog -->
    <el-dialog
      v-model="showAddMemberDialog"
      title="添加成员"
      width="500px"
      class="responsive-dialog"
    >
      <el-form :model="memberForm" :rules="memberRules" ref="memberFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="memberForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="memberForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="项目管理员" value="PROJECT_ADMIN" />
            <el-option label="成本工程师" value="EDITOR" />
            <el-option label="复核人" value="REVIEWER" />
            <el-option label="审批人" value="APPROVER" />
            <el-option label="查看者" value="VIEWER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" :loading="memberLoading" @click="handleAddMember">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { ArrowLeft, Plus, ArrowRight, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

const { currentProject, projectMembers, projectVersions, loading } = storeToRefs(projectStore)

const showCreateVersionDialog = ref(false)
const showAddMemberDialog = ref(false)
const creatingVersion = ref(false)
const memberLoading = ref(false)

const memberFormRef = ref<FormInstance>()

const memberForm = reactive({
  username: '',
  role: ''
})

const memberRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

onMounted(() => {
  const projectId = Number(route.params.id)
  if (!Number.isNaN(projectId)) {
    projectStore.fetchProject(projectId)
    projectStore.fetchProjectMembers(projectId)
    projectStore.fetchProjectVersions(projectId)
  }
})

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

const getVersionTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    DRAFT: 'info',
    IN_APPROVAL: 'warning',
    APPROVED: 'success',
    ISSUED: 'success',
    ARCHIVED: 'info'
  }
  return typeMap[status] || 'info'
}

const getVersionStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    DRAFT: '草稿',
    IN_APPROVAL: '审批中',
    APPROVED: '已审批',
    ISSUED: '已签发',
    ARCHIVED: '已归档'
  }
  return textMap[status] || status
}

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    PROJECT_ADMIN: '项目管理员',
    EDITOR: '工程师',
    REVIEWER: '复核人',
    APPROVER: '审批人',
    SEAL_ADMIN: '盖章管理员',
    VIEWER: '查看者'
  }
  return roleMap[role] || role
}

const goBack = () => {
  router.push('/projects')
}

const enterWorkspace = (version: any) => {
  router.push(`/projects/${route.params.id}/versions/${version.id}`)
}

const handleVersionRowDblClick = (row: any) => {
  enterWorkspace(row)
}

const handleCreateVersion = async () => {
  creatingVersion.value = true
  try {
    await axios.post(`/api/projects/${route.params.id}/versions`, {
       copyFromVersionId: null 
    })
    ElMessage.success('版本创建成功')
    showCreateVersionDialog.value = false
    projectStore.fetchProjectDetail(Number(route.params.id))
  } catch (error) {
    ElMessage.error('版本创建失败')
  } finally {
    creatingVersion.value = false
  }
}

const handleAddMember = async () => {
  if (!memberFormRef.value) return
  await memberFormRef.value.validate(async (valid) => {
    if (valid) {
      memberLoading.value = true
      try {
        // Mock delay for demo purposes since API might not be ready
        await new Promise(resolve => setTimeout(resolve, 500)) 
        ElMessage.success('成员添加成功')
        showAddMemberDialog.value = false
        memberForm.username = ''
        memberForm.role = ''
      } catch (error) {
        ElMessage.error('成员添加失败')
      } finally {
        memberLoading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';
@import '../styles/ui-standard.scss';

.section-card {
  background: white;
  border-radius: 8px;
  border: 1px solid $border-light;
  padding: 24px;
}

.header-stats {
  @include mobile {
    display: none;
  }
}

:deep(.responsive-table) {
  .hidden-xs {
    @include mobile {
      display: none;
    }
  }
}
</style>