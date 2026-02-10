<template>
  <div class="audit-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">
          审计日志
        </h2>
        <p class="panel-subtitle">
          支持按操作类型、人员、关键字进行追踪检索
        </p>
      </div>
      <el-button
        :loading="loading"
        @click="fetchLogs"
      >
        刷新
      </el-button>
    </header>

    <section class="toolbar panel-card">
      <el-input
        v-model="keyword"
        placeholder="关键字（操作/人员/详情）"
        clearable
        class="toolbar-item toolbar-input"
      />
      <el-select
        v-model="actionFilter"
        clearable
        placeholder="操作类型"
        class="toolbar-item"
      >
        <el-option
          v-for="action in actionOptions"
          :key="action"
          :label="action"
          :value="action"
        />
      </el-select>
    </section>

    <section class="table-wrap panel-card">
      <el-table
        :data="filteredLogs"
        border
        size="small"
        height="420"
      >
        <el-table-column
          prop="action"
          label="操作"
          width="150"
        />
        <el-table-column
          prop="bizType"
          label="业务类型"
          width="120"
        />
        <el-table-column
          prop="operatorName"
          label="操作人"
          width="120"
        />
        <el-table-column
          label="变更详情"
          min-width="300"
        >
          <template #default="scope">
            <span class="detail-text">{{ safeDetailText(scope.row.detailJson) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="时间"
          min-width="170"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Props {
  projectId: number
  versionId: number
}

interface AuditLog {
  id: number
  bizType: string
  action: string
  operatorName: string
  detailJson: string
  createdAt: string
}

const props = defineProps<Props>()

const loading = ref(false)
const logs = ref<AuditLog[]>([])
const keyword = ref('')
const actionFilter = ref('')

const actionOptions = computed(() => {
  return Array.from(new Set(logs.value.map((item) => item.action))).filter(Boolean)
})

const safeDetailText = (detail: string) => {
  if (!detail) {
    return '-'
  }
  try {
    const parsed = JSON.parse(detail)
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('；')
  } catch {
    return detail
  }
}

const filteredLogs = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  return logs.value.filter((item) => {
    if (actionFilter.value && item.action !== actionFilter.value) {
      return false
    }

    if (!search) {
      return true
    }

    const target = `${item.action} ${item.operatorName} ${item.bizType} ${safeDetailText(item.detailJson)}`.toLowerCase()
    return target.includes(search)
  })
})

const formatDate = (dateString: string) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleString('zh-CN', { hour12: false })
}

const fetchLogs = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/projects/${props.projectId}/audit-logs`, {
      params: { versionId: props.versionId }
    })
    logs.value = response.data.data || []
  } catch {
    ElMessage.error('获取审计日志失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.audit-panel {
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
  color: #6b7280;
  font-size: 12px;
}

.toolbar {
  padding: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-item {
  width: 170px;
}

.toolbar-input {
  flex: 1;
  min-width: 260px;
}

.table-wrap {
  padding: 8px;
  overflow: hidden;
}

.detail-text {
  color: #4b5563;
}
</style>
