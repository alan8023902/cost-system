<template>
  <div class="approval-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">
          审批流程
        </h2>
        <p class="panel-subtitle">
          待办简洁呈现，支持快速审批与驳回反馈
        </p>
      </div>
      <div class="header-summary">
        <el-tag
          size="small"
          type="warning"
        >
          待处理 {{ pendingTasks.length }}
        </el-tag>
        <el-tag
          size="small"
          type="success"
        >
          已通过 {{ approvedTasks.length }}
        </el-tag>
        <el-tag
          size="small"
          type="danger"
        >
          已驳回 {{ rejectedTasks.length }}
        </el-tag>
      </div>
    </header>

    <section class="progress-wrap panel-card">
      <div class="progress-row">
        <span class="progress-label">审批完成率</span>
        <el-progress
          :percentage="processedRate"
          :stroke-width="8"
          status="success"
        />
      </div>
    </section>

    <section class="task-section panel-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane
          label="待处理"
          name="pending"
        >
          <el-table
            v-loading="loading"
            :data="pendingTasks"
            border
            size="small"
            height="360"
          >
            <el-table-column
              prop="title"
              label="任务"
              min-width="180"
            />
            <el-table-column
              prop="submitter"
              label="提交人"
              width="120"
            />
            <el-table-column
              label="提交时间"
              min-width="160"
            >
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              width="90"
              align="center"
            >
              <template #default>
                <el-tag
                  size="small"
                  type="warning"
                >
                  待处理
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="210"
              align="center"
              fixed="right"
            >
              <template #default="scope">
                <el-button
                  link
                  type="success"
                  @click="handleApprove(scope.row)"
                >
                  通过
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click="handleReject(scope.row)"
                >
                  驳回
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click="viewTaskDetail(scope.row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无待处理任务" />
            </template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane
          label="已处理"
          name="processed"
        >
          <el-table
            v-loading="loading"
            :data="processedTasks"
            border
            size="small"
            height="360"
          >
            <el-table-column
              prop="title"
              label="任务"
              min-width="180"
            />
            <el-table-column
              prop="submitter"
              label="提交人"
              width="120"
            />
            <el-table-column
              label="处理时间"
              min-width="160"
            >
              <template #default="scope">
                {{ formatDate(scope.row.processedAt) }}
              </template>
            </el-table-column>
            <el-table-column
              label="结果"
              width="100"
              align="center"
            >
              <template #default="scope">
                <el-tag
                  :type="scope.row.status === 'APPROVED' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ scope.row.status === 'APPROVED' ? '已通过' : '已驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="意见"
              min-width="180"
            >
              <template #default="scope">
                {{ scope.row.comment || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="90"
              align="center"
            >
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  @click="viewTaskDetail(scope.row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无已处理任务" />
            </template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog
      v-model="showApprovalDialog"
      :title="approvalAction === 'approve' ? '审批通过' : '审批驳回'"
      width="500px"
      :before-close="handleCloseApprovalDialog"
    >
      <el-form
        ref="approvalFormRef"
        :model="approvalForm"
        :rules="approvalRules"
        label-width="80px"
      >
        <el-form-item
          label="处理意见"
          prop="comment"
        >
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="4"
            :placeholder="approvalAction === 'approve' ? '请输入审批意见（可选）' : '请输入驳回原因'"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCloseApprovalDialog">
          取消
        </el-button>
        <el-button
          :type="approvalAction === 'approve' ? 'success' : 'danger'"
          :loading="approvalLoading"
          @click="handleConfirmApproval"
        >
          {{ approvalAction === 'approve' ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      title="任务详情"
      width="640px"
      :before-close="handleCloseDetailDialog"
    >
      <div
        v-if="selectedTask"
        class="task-detail"
      >
        <div class="detail-item">
          <span class="detail-label">任务标题：</span>
          <span>{{ selectedTask.title }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">提交人：</span>
          <span>{{ selectedTask.submitter }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态：</span>
          <el-tag
            :type="getTaskTagType(selectedTask.status)"
            size="small"
          >
            {{ getTaskStatusText(selectedTask.status) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="detail-label">描述：</span>
          <span>{{ selectedTask.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">处理意见：</span>
          <span>{{ selectedTask.comment || '-' }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCloseDetailDialog">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import axios from 'axios'

interface Props {
  versionId: number
}

interface ApprovalTask {
  id: number
  title: string
  description: string
  submitter: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  processedAt?: string
  comment?: string
}

const props = defineProps<Props>()

const tasks = ref<ApprovalTask[]>([])
const loading = ref(false)
const activeTab = ref('pending')
const showApprovalDialog = ref(false)
const showDetailDialog = ref(false)
const approvalLoading = ref(false)
const approvalAction = ref<'approve' | 'reject'>('approve')
const selectedTask = ref<ApprovalTask | null>(null)

const approvalFormRef = ref<FormInstance>()
const approvalForm = reactive({ comment: '' })

const approvalRules = computed(() => ({
  comment: approvalAction.value === 'reject'
    ? [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
    : []
}))

const pendingTasks = computed(() => tasks.value.filter((task) => task.status === 'PENDING'))
const processedTasks = computed(() => tasks.value.filter((task) => task.status !== 'PENDING'))
const approvedTasks = computed(() => tasks.value.filter((task) => task.status === 'APPROVED'))
const rejectedTasks = computed(() => tasks.value.filter((task) => task.status === 'REJECTED'))

const processedRate = computed(() => {
  if (tasks.value.length === 0) {
    return 0
  }
  return Math.round((processedTasks.value.length / tasks.value.length) * 100)
})

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '-'
  }

  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTaskTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return typeMap[status] || 'info'
}

const getTaskStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    PENDING: '待处理',
    APPROVED: '已通过',
    REJECTED: '已驳回'
  }
  return textMap[status] || status
}

const handleApprove = (task: ApprovalTask) => {
  selectedTask.value = task
  approvalAction.value = 'approve'
  showApprovalDialog.value = true
}

const handleReject = (task: ApprovalTask) => {
  selectedTask.value = task
  approvalAction.value = 'reject'
  showApprovalDialog.value = true
}

const handleConfirmApproval = async () => {
  if (!approvalFormRef.value || !selectedTask.value) {
    return
  }

  await approvalFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    approvalLoading.value = true

    try {
      const task = selectedTask.value
      if (!task) {
        return
      }

      const action = approvalAction.value === 'approve' ? 'approve' : 'reject'
      await axios.post(
        `/api/workflow/tasks/${task.id}/${action}`,
        { comment: approvalForm.comment }
      )
      ElMessage.success(
        approvalAction.value === 'approve' ? '审批通过成功' : '驳回成功'
      )
      handleCloseApprovalDialog()
      await fetchApprovalTasks()
    } catch {
      ElMessage.error('操作失败')
    } finally {
      approvalLoading.value = false
    }
  })
}

const viewTaskDetail = (task: ApprovalTask) => {
  selectedTask.value = task
  showDetailDialog.value = true
}

const handleCloseApprovalDialog = () => {
  showApprovalDialog.value = false
  selectedTask.value = null
  approvalForm.comment = ''
  approvalFormRef.value?.resetFields()
}

const handleCloseDetailDialog = () => {
  showDetailDialog.value = false
  selectedTask.value = null
}

const fetchApprovalTasks = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/workflow/versions/${props.versionId}/tasks`)
    tasks.value = response.data.data || []
  } catch {
    ElMessage.error('获取审批任务失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchApprovalTasks()
})
</script>

<style scoped>
.approval-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.panel-title {
  font-size: 16px;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.header-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.progress-wrap {
  padding: 10px;
}

.progress-row {
  display: grid;
  grid-template-columns: 78px 1fr;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 12px;
  color: #6b7280;
}

.task-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}

.task-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.detail-label {
  color: #6b7280;
  min-width: 72px;
}
</style>
