<template>
  <div class="version-workspace">
    <!-- 顶部工作区头部 -->
    <header class="workspace-header">
      <div class="header-main">
        <!-- 左侧：返回 + 版本信息 -->
        <div class="header-left">
          <el-button
            text
            :icon="ArrowLeft"
            @click="goBack"
          >
            返回
          </el-button>
          <div class="version-info">
            <h1 class="version-title">
              版本 {{ currentVersion?.versionNo || '-' }}
            </h1>
            <div class="version-meta">
              <el-tag
                :type="getVersionTagType(currentVersion?.status)"
                size="small"
              >
                {{ getVersionStatusText(currentVersion?.status) }}
              </el-tag>
              <span class="divider">|</span>
              <span class="project-name">{{ currentProject?.name || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="header-actions">
          <el-button
            v-if="canSubmit"
            type="primary"
            :icon="Checked"
            @click="handleSubmit"
          >
            提交审批
          </el-button>
          <el-button
            v-if="canWithdraw"
            type="warning"
            :icon="RefreshLeft"
            @click="handleWithdraw"
          >
            撤回
          </el-button>
          <el-button
            v-if="canIssue"
            type="success"
            :icon="CircleCheck"
            @click="handleIssue"
          >
            签发
          </el-button>
          <el-button
            v-if="canSeal"
            :icon="Stamp"
            @click="handleSeal"
          >
            盖章
          </el-button>
          <el-button
            v-if="canArchive"
            :icon="FolderOpened"
            @click="handleArchive"
          >
            归档
          </el-button>
          <el-button
            :icon="Download"
            @click="handleExport"
          >
            导出
          </el-button>
        </div>
      </div>

      <!-- 流程进度条 -->
      <div class="progress-section">
        <span class="progress-label">流程进度</span>
        <el-progress
          :stroke-width="6"
          :percentage="workflowProgress"
          :show-text="false"
          :color="progressColor"
        />
        <span class="progress-text">{{ workflowProgress }}%</span>
      </div>
    </header>

    <!-- 状态提示横幅 -->
    <el-alert
      v-if="statusBanner"
      :title="statusBanner"
      type="info"
      :closable="false"
      show-icon
      class="status-banner"
    />

    <!-- 主工作区 -->
    <main class="workspace-body">
      <!-- 左侧导航 -->
      <aside class="workspace-sidebar">
        <div class="nav-section">
          <div class="nav-header">
            <span class="nav-title">明细录入</span>
          </div>
          <div class="nav-items">
            <button
              v-for="module in dataModules"
              :key="module.key"
              :class="['nav-item', { active: activeModule === module.key }]"
              @click="activeModule = module.key"
            >
              <el-icon class="nav-icon">
                <component :is="module.icon" />
              </el-icon>
              <span class="nav-label">{{ module.label }}</span>
            </button>
          </div>
        </div>

        <div class="nav-divider" />

        <div class="nav-section">
          <div class="nav-header">
            <span class="nav-title">功能模块</span>
          </div>
          <div class="nav-items">
            <button
              v-for="func in functionModules"
              :key="func.key"
              :class="['nav-item', { active: activeModule === func.key }]"
              @click="activeModule = func.key"
            >
              <el-icon class="nav-icon">
                <component :is="func.icon" />
              </el-icon>
              <span class="nav-label">{{ func.label }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <section class="workspace-content">
        <LineItemTable
          v-if="isDataModule(activeModule)"
          :module="activeModule"
          :version-id="Number(route.params.versionId)"
          :version-status="currentVersion?.status"
          :readonly="currentVersion?.status !== 'DRAFT'"
        />

        <IndicatorDashboard
          v-else-if="activeModule === 'indicators'"
          :version-id="Number(route.params.versionId)"
        />

        <ApprovalPanel
          v-else-if="activeModule === 'approval'"
          :version-id="Number(route.params.versionId)"
        />

        <ImportExportPanel
          v-else-if="activeModule === 'import-export'"
          :version-id="Number(route.params.versionId)"
          :version-status="currentVersion?.status"
          :readonly="currentVersion?.status !== 'DRAFT'"
        />

        <SealPanel
          v-else-if="activeModule === 'seal'"
          :version-id="Number(route.params.versionId)"
          :version-status="currentVersion?.status"
          @refreshed="fetchVersionInfo"
        />

        <AuditLogPanel
          v-else-if="activeModule === 'audit'"
          :project-id="Number(route.params.id)"
          :version-id="Number(route.params.versionId)"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Box,
  Checked,
  Download,
  FolderOpened,
  Money,
  Tools,
  TrendCharts,
  CircleCheck,
  RefreshLeft,
  Stamp
} from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import { useProjectStore } from '../stores/project'
import ApprovalPanel from '../components/ApprovalPanel.vue'
import AuditLogPanel from '../components/AuditLogPanel.vue'
import ImportExportPanel from '../components/ImportExportPanel.vue'
import IndicatorDashboard from '../components/IndicatorDashboard.vue'
import LineItemTable from '../components/LineItemTable.vue'
import SealPanel from '../components/SealPanel.vue'

interface WorkspaceNav {
  key: string
  label: string
  icon: any
}

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

const { currentProject } = storeToRefs(projectStore)

const currentVersion = ref<any>(null)
const activeModule = ref('materials')

const dataModules: WorkspaceNav[] = [
  { key: 'materials', label: '物资费用', icon: Box },
  { key: 'subcontract', label: '分包费用', icon: Tools },
  { key: 'other', label: '其他费用', icon: Money }
]

const functionModules: WorkspaceNav[] = [
  { key: 'indicators', label: '指标看板', icon: TrendCharts },
  { key: 'approval', label: '审批流程', icon: Checked },
  { key: 'import-export', label: '导入导出', icon: FolderOpened },
  { key: 'seal', label: '盖章管理', icon: Stamp },
  { key: 'audit', label: '操作日志', icon: FolderOpened }
]

const canSubmit = computed(() => currentVersion.value?.status === 'DRAFT')
const canWithdraw = computed(() => currentVersion.value?.status === 'IN_APPROVAL')
const canIssue = computed(() => currentVersion.value?.status === 'APPROVED')
const canSeal = computed(() => currentVersion.value?.status === 'ISSUED')
const canArchive = computed(() => currentVersion.value?.status === 'ISSUED')

const workflowProgress = computed(() => {
  const progressMap: Record<string, number> = {
    DRAFT: 20,
    IN_APPROVAL: 55,
    APPROVED: 75,
    ISSUED: 90,
    ARCHIVED: 100
  }
  return progressMap[currentVersion.value?.status || 'DRAFT'] || 0
})

const progressColor = computed(() => {
  const status = currentVersion.value?.status
  if (status === 'ARCHIVED') return '#22c55e'
  if (status === 'ISSUED') return '#16a34a'
  if (status === 'APPROVED') return '#3b82f6'
  if (status === 'IN_APPROVAL') return '#f59e0b'
  return '#6b7280'
})

const statusBanner = computed(() => {
  const status = currentVersion.value?.status
  if (status === 'IN_APPROVAL') {
    return '版本审批中，数据处于只读状态'
  }
  if (status === 'ISSUED') {
    return '版本已签发，可进行盖章、归档或导出操作'
  }
  if (status === 'ARCHIVED') {
    return '版本已归档，仅可查看和导出'
  }
  return ''
})

const isDataModule = (moduleKey: string) => {
  return dataModules.some((module) => module.key === moduleKey)
}

const getVersionTagType = (status?: string) => {
  const typeMap: Record<string, any> = {
    DRAFT: 'info',
    IN_APPROVAL: 'warning',
    APPROVED: 'success',
    ISSUED: 'success',
    ARCHIVED: ''
  }
  return typeMap[status || ''] || 'info'
}

const getVersionStatusText = (status?: string) => {
  const textMap: Record<string, string> = {
    DRAFT: '草稿',
    IN_APPROVAL: '审批中',
    APPROVED: '已审批',
    ISSUED: '已签发',
    ARCHIVED: '已归档'
  }
  return textMap[status || ''] || status || '-'
}

const goBack = () => {
  router.push(`/projects/${route.params.id}`)
}

const executeVersionAction = async (endpoint: string, confirmText: string, successText: string) => {
  await ElMessageBox.confirm(confirmText, '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await axios.post(`/api/versions/${route.params.versionId}/${endpoint}`)
  ElMessage.success(successText)
  await fetchVersionInfo()
}

const handleSubmit = async () => {
  try {
    await executeVersionAction('submit', '提交审批后版本将锁定，无法编辑，确定继续吗？', '提交成功')
  } catch {
    // user cancelled or request failed
  }
}

const handleWithdraw = async () => {
  try {
    await executeVersionAction('withdraw', '撤回后版本将回到草稿状态，确定继续吗？', '撤回成功')
  } catch {
    // user cancelled or request failed
  }
}

const handleIssue = async () => {
  try {
    await executeVersionAction('issue', '签发后版本将正式生效，确定继续吗？', '签发成功')
  } catch {
    // user cancelled or request failed
  }
}

const handleSeal = async () => {
  activeModule.value = 'seal'
}

const handleArchive = async () => {
  try {
    await executeVersionAction('archive', '归档后版本仅可查看和导出，确定继续吗？', '归档成功')
  } catch {
    // user cancelled or request failed
  }
}

const handleExport = () => {
  activeModule.value = 'import-export'
}

const fetchVersionInfo = async () => {
  try {
    const response = await axios.get(`/api/versions/${route.params.versionId}`)
    currentVersion.value = response.data.data
  } catch {
    ElMessage.error('获取版本信息失败')
  }
}

onMounted(async () => {
  const projectId = Number(route.params.id)
  await Promise.all([projectStore.fetchProject(projectId), fetchVersionInfo()])
})
</script>

<style scoped lang="scss">
@import '../styles/design-tokens.scss';

.version-workspace {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $bg-secondary;
}

// ==================== Header ====================
.workspace-header {
  background: $bg-primary;
  border-bottom: 1px solid $border-light;
  padding: $space-4 $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-4;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $space-4;
  min-width: 0;
  flex: 1;
}

.version-info {
  min-width: 0;
}

.version-title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $text-primary;
  margin: 0;
  line-height: 1.4;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-1;
  font-size: $text-sm;
  color: $text-tertiary;
}

.divider {
  color: $border-default;
}

.project-name {
  font-weight: $font-medium;
  color: $text-secondary;
}

.header-actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
  align-items: center;
}

// 进度条区域
.progress-section {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.progress-label {
  font-size: $text-sm;
  color: $text-secondary;
  font-weight: $font-medium;
  white-space: nowrap;
}

.el-progress {
  flex: 1;
  min-width: 200px;
}

.progress-text {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $primary-600;
  white-space: nowrap;
  min-width: 40px;
  text-align: right;
}

// 状态横幅
.status-banner {
  margin: 0 $space-6 $space-4;
}

// ==================== Body ====================
.workspace-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: $space-4;
  padding: $space-4 $space-6;
}

// 左侧导航
.workspace-sidebar {
  width: $left-nav-width;
  background: $bg-primary;
  border: 1px solid $border-light;
  border-radius: $radius-lg;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  overflow-y: auto;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.nav-header {
  padding: 0 $space-2 $space-1;
  border-bottom: 1px solid $border-light;
}

.nav-title {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-divider {
  height: 1px;
  background: $border-light;
  margin: 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-3;
  border: none;
  border-radius: $radius-md;
  background: transparent;
  color: $text-secondary;
  font-size: $text-base;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;

  &:hover {
    background: $bg-hover;
    color: $primary-600;
  }

  &.active {
    background: $primary-50;
    color: $primary-700;
    font-weight: $font-semibold;

    .nav-icon {
      color: $primary-600;
    }
  }
}

.nav-icon {
  font-size: 18px;
  color: $text-tertiary;
  transition: color $transition-fast;
}

.nav-label {
  flex: 1;
}

// 右侧内容区
.workspace-content {
  flex: 1;
  min-width: 0;
  background: $bg-primary;
  border: 1px solid $border-light;
  border-radius: $radius-lg;
  padding: $space-6;
  overflow: auto;
}

// ==================== Responsive ====================
@media (max-width: $breakpoint-lg) {
  .workspace-body {
    flex-direction: column;
  }

  .workspace-sidebar {
    width: 100%;
    max-height: 180px;
    overflow-y: auto;
  }

  .header-main {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
    
    .el-button {
      flex: 1;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .workspace-header {
    padding: $space-3 $space-4;
  }

  .workspace-body {
    padding: $space-3 $space-4;
  }

  .version-title {
    font-size: $text-lg;
  }

  .workspace-sidebar {
    flex-direction: row;
    width: 100%;
    max-height: none;
    overflow-x: auto;
    gap: $space-4;

    .nav-section {
      min-width: 200px;
    }
  }
}
</style>
