<template>
  <div class="seal-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">
          签章与归档
        </h2>
        <p class="panel-subtitle">
          签章后可下载标准化 PDF，并支持归档冻结版本
        </p>
      </div>
      <div class="header-actions">
        <el-tag
          size="small"
          :type="versionStatus === 'ARCHIVED' ? 'info' : 'success'"
        >
          {{ statusText }}
        </el-tag>
        <el-button
          :loading="sealing"
          :disabled="versionStatus !== 'ISSUED'"
          @click="handleSeal"
        >
          执行盖章
        </el-button>
        <el-button
          :loading="archiving"
          :disabled="versionStatus !== 'ISSUED'"
          @click="handleArchive"
        >
          执行归档
        </el-button>
      </div>
    </header>

    <el-alert
      class="seal-alert"
      :title="alertText"
      type="info"
      :closable="false"
      show-icon
    />

    <section class="table-section panel-card">
      <div class="section-header">
        <h3 class="section-title">
          签章文件记录
        </h3>
        <el-button
          :loading="loading"
          @click="fetchSealFiles"
        >
          刷新
        </el-button>
      </div>

      <el-table
        :data="sealFiles"
        border
        size="small"
        height="360"
      >
        <el-table-column
          prop="fileName"
          label="文件名"
          min-width="220"
        />
        <el-table-column
          prop="createdBy"
          label="操作人"
          width="120"
        />
        <el-table-column
          label="文件类型"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag
              size="small"
              type="warning"
            >
              {{ scope.row.fileType === 'SEALED_PDF' ? '盖章PDF' : scope.row.fileType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="签章标识"
          min-width="180"
        >
          <template #default="scope">
            <span class="hash-text">FILE-{{ scope.row.id }}</span>
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
        <el-table-column
          label="操作"
          width="110"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="downloadFile(scope.row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无签章文件" />
        </template>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface Props {
  versionId: number
  versionStatus?: string
}

interface FileRecord {
  id: number
  fileName: string
  fileType: string
  createdBy: string
  createdAt: string
}

const props = withDefaults(defineProps<Props>(), {
  versionStatus: ''
})

const emit = defineEmits<{
  refreshed: []
}>()

const loading = ref(false)
const sealing = ref(false)
const archiving = ref(false)
const sealFiles = ref<FileRecord[]>([])

const statusText = computed(() => {
  const map: Record<string, string> = {
    ISSUED: '已签发',
    ARCHIVED: '已归档'
  }
  return map[props.versionStatus || ''] || '未签发'
})

const alertText = computed(() => {
  if (props.versionStatus === 'ARCHIVED') {
    return '当前版本已归档，文档只读且不可再编辑。'
  }
  if (props.versionStatus === 'ISSUED') {
    return '当前版本可执行盖章与归档操作。'
  }
  return '请先完成版本签发，再执行盖章与归档。'
})

const formatDate = (dateString: string) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleString('zh-CN', { hour12: false })
}

const fetchSealFiles = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/versions/${props.versionId}/files`)
    const files = response.data.data || []
    sealFiles.value = files.filter((item: FileRecord) => item.fileType === 'SEALED_PDF')
  } catch {
    ElMessage.error('获取签章文件失败')
  } finally {
    loading.value = false
  }
}

const handleSeal = async () => {
  try {
    await ElMessageBox.confirm('是否执行盖章？操作后将生成盖章 PDF。', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    sealing.value = true
    const response = await axios.post(`/api/versions/${props.versionId}/seal`)
    const file = response.data.data

    ElMessage.success('盖章完成')
    emit('refreshed')
    await fetchSealFiles()

    if (file?.id) {
      await downloadById(file.id, file.fileName)
    }
  } catch {
    // user cancelled or request failed
  } finally {
    sealing.value = false
  }
}

const handleArchive = async () => {
  try {
    await ElMessageBox.confirm('归档后版本将冻结为只读，是否继续？', '确认归档', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    archiving.value = true
    await axios.post(`/api/versions/${props.versionId}/archive`)
    ElMessage.success('归档成功')
    emit('refreshed')
  } catch {
    // user cancelled or request failed
  } finally {
    archiving.value = false
  }
}

const downloadById = async (fileId: number, fileName?: string) => {
  const response = await axios.get(`/api/files/${fileId}/download`, {
    responseType: 'blob'
  })
  const blob = response.data as Blob
  const name = fileName || `seal-${fileId}.pdf`
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const downloadFile = async (file: FileRecord) => {
  try {
    await downloadById(file.id, file.fileName)
    ElMessage.success('下载成功')
  } catch {
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  fetchSealFiles()
})
</script>

<style scoped>
.seal-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 2px;
}

.panel-title {
  font-size: 16px;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.seal-alert {
  margin-bottom: 2px;
}

.table-section {
  padding: 10px;
}

.section-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
}

.hash-text {
  font-family: 'Consolas', 'SFMono-Regular', monospace;
  color: #1d4ed8;
  font-size: 12px;
}
</style>
