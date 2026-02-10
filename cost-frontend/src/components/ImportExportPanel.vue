<template>
  <div class="import-export-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">
          导入导出
        </h2>
        <p class="panel-subtitle">
          保持客户熟悉的导出格式，支持导入进度与结果反馈
        </p>
      </div>
      <el-tag
        v-if="readonly"
        type="info"
        size="small"
      >
        只读模式
      </el-tag>
    </header>

    <section class="action-grid">
      <div class="panel-card section-card">
        <h3 class="section-title">
          数据导入
        </h3>
        <div class="card-grid">
          <button
            v-for="importType in importTypes"
            :key="importType.key"
            class="action-card"
            :disabled="readonly"
            @click="!readonly && handleImport(importType)"
          >
            <el-icon><component :is="importType.icon" /></el-icon>
            <div>
              <p class="card-title">
                {{ importType.title }}
              </p>
              <p class="card-desc">
                {{ importType.description }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div class="panel-card section-card">
        <h3 class="section-title">
          数据导出
        </h3>
        <div class="card-grid">
          <button
            v-for="exportType in availableExportTypes"
            :key="exportType.key"
            class="action-card"
            @click="handleExport(exportType)"
          >
            <el-icon><component :is="exportType.icon" /></el-icon>
            <div>
              <p class="card-title">
                {{ exportType.title }}
              </p>
              <p class="card-desc">
                {{ exportType.description }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>

    <section class="panel-card history-card">
      <div class="section-header">
        <h3 class="section-title">
          文件历史
        </h3>
        <el-button
          :icon="Refresh"
          size="small"
          @click="fetchFileHistory"
        >
          刷新
        </el-button>
      </div>

      <el-table
        :data="fileHistory"
        :loading="historyLoading"
        border
        size="small"
        height="280"
      >
        <el-table-column
          prop="fileName"
          label="文件名"
          min-width="220"
        />
        <el-table-column
          prop="fileType"
          label="类型"
          width="110"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="getFileTypeTag(scope.row.fileType)"
              size="small"
            >
              {{ getFileTypeText(scope.row.fileType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="大小"
          width="90"
        >
          <template #default="scope">
            {{ formatFileSize(scope.row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="createdBy"
          label="创建人"
          width="110"
        />
        <el-table-column
          label="时间"
          min-width="160"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
          align="center"
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
      </el-table>
    </section>

    <el-dialog
      v-model="showImportDialog"
      :title="`导入${selectedImportType?.title}`"
      width="620px"
      :before-close="handleCloseImportDialog"
    >
      <div class="import-dialog-content">
        <el-alert
          title="导入说明"
          :description="selectedImportType?.instructions"
          type="info"
          :closable="false"
          show-icon
        />

        <el-upload
          ref="uploadRef"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :data="uploadData"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-change="handleFileChange"
          :on-progress="handleUploadProgress"
          :file-list="fileList"
          :limit="1"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 Excel 文件，大小不超过 10MB
            </div>
          </template>
        </el-upload>

        <el-progress
          v-if="uploadProgress > 0 && uploadProgress < 100"
          :percentage="uploadProgress"
          :stroke-width="8"
          status="success"
        />

        <div
          v-if="importResult"
          class="import-result panel-card"
        >
          <div class="result-row">
            <span>成功：{{ importResult.successCount }} 条</span>
            <span>失败：{{ importResult.errorCount }} 条</span>
          </div>

          <div
            v-if="importResult.errors.length > 0"
            class="error-list"
          >
            <p class="error-title">
              错误详情
            </p>
            <p
              v-for="(error, index) in importResult.errors"
              :key="index"
              class="error-item"
            >
              第{{ error.row }}行：{{ error.message }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCloseImportDialog">
          关闭
        </el-button>
        <el-button
          v-if="!importResult"
          type="primary"
          :loading="importing"
          @click="handleConfirmImport"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Files,
  Printer,
  Refresh,
  UploadFilled
} from '@element-plus/icons-vue'
import axios from 'axios'

interface Props {
  versionId: number
  versionStatus?: string
  readonly?: boolean
}

interface ImportType {
  key: string
  title: string
  description: string
  instructions: string
  icon: any
}

interface ExportType {
  key: string
  title: string
  description: string
  icon: any
  requiresIssued?: boolean
}

interface FileHistoryItem {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  createdBy: string
  createdAt: string
}

interface ImportResult {
  successCount: number
  errorCount: number
  errors: Array<{
    row: number
    message: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  versionStatus: ''
})

const showImportDialog = ref(false)
const importing = ref(false)
const historyLoading = ref(false)
const selectedImportType = ref<ImportType | null>(null)
const fileList = ref<any[]>([])
const importResult = ref<ImportResult | null>(null)
const fileHistory = ref<FileHistoryItem[]>([])
const uploadProgress = ref(0)

const uploadRef = ref()
const uploadUrl = computed(() => `/api/versions/${props.versionId}/import/excel`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))
const uploadData = computed(() => ({
  importType: selectedImportType.value?.key || ''
}))

const importTypes: ImportType[] = [
  {
    key: 'materials',
    title: '物资费用',
    description: '导入物资费用明细数据',
    instructions: '请使用标准模板，包含项目名称、规格型号、单位、数量、单价等字段',
    icon: Document
  },
  {
    key: 'subcontract',
    title: '分包费用',
    description: '导入分包费用明细数据',
    instructions: '请使用标准模板，包含分包商、工程类型、合同金额等字段',
    icon: Document
  },
  {
    key: 'other',
    title: '其他费用',
    description: '导入其他费用明细数据',
    instructions: '请使用标准模板，包含费用项目、金额、说明等字段',
    icon: Document
  }
]

const exportTypes: ExportType[] = [
  {
    key: 'excel',
    title: 'Excel 报表',
    description: '导出完整成本数据',
    icon: Files
  },
  {
    key: 'pdf',
    title: 'PDF 报告',
    description: '导出格式化报告',
    icon: Printer
  },
  {
    key: 'seal',
    title: '盖章版 PDF',
    description: '生成盖章后 PDF',
    icon: Printer,
    requiresIssued: true
  }
]

const availableExportTypes = computed(() => {
  return exportTypes.filter((type) => !type.requiresIssued || props.versionStatus === 'ISSUED')
})

const getFileTypeTag = (fileType: string) => {
  if (fileType === 'EXPORT_XLSX') return 'success'
  if (fileType === 'EXPORT_PDF') return 'primary'
  if (fileType === 'SEALED_PDF') return 'warning'
  return 'info'
}

const getFileTypeText = (fileType: string) => {
  if (fileType === 'EXPORT_XLSX') return 'Excel 导出'
  if (fileType === 'EXPORT_PDF') return 'PDF 导出'
  if (fileType === 'SEALED_PDF') return '盖章 PDF'
  return '文件'
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString: string) => {
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

const handleImport = (importType: ImportType) => {
  selectedImportType.value = importType
  showImportDialog.value = true
}

const handleExport = async (exportType: ExportType) => {
  try {
    let response: any
    if (exportType.key === 'seal') {
      response = await axios.post(`/api/versions/${props.versionId}/seal`)
    } else {
      response = await axios.get(`/api/versions/${props.versionId}/export/${exportType.key}`)
    }

    const fileInfo = response.data.data
    if (fileInfo && fileInfo.id) {
      await downloadById(fileInfo.id, fileInfo.fileName)
      ElMessage.success(`${exportType.title}导出成功`)
      await fetchFileHistory()
    } else {
      ElMessage.error('导出失败')
    }
  } catch {
    ElMessage.error('导出失败')
  }
}

const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any) => {
  importResult.value = response.data
  importing.value = false
  uploadProgress.value = 100
  ElMessage.success('文件导入成功')
  fetchFileHistory()
}

const handleUploadError = () => {
  importing.value = false
  uploadProgress.value = 0
  ElMessage.error('文件上传失败')
}

const handleUploadProgress = (evt: any) => {
  uploadProgress.value = Math.round(evt.percent || 0)
}

const handleFileChange = (file: any, fileListValue: any[]) => {
  fileList.value = fileListValue
}

const handleConfirmImport = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  importing.value = true
  uploadProgress.value = 0
  uploadRef.value?.submit()
}

const handleCloseImportDialog = () => {
  showImportDialog.value = false
  selectedImportType.value = null
  fileList.value = []
  importResult.value = null
  importing.value = false
  uploadProgress.value = 0
}

const downloadById = async (fileId: number, fileName?: string) => {
  const response = await axios.get(`/api/files/${fileId}/download`, {
    responseType: 'blob'
  })
  const blob = response.data as Blob
  let resolvedName = fileName
  if (!resolvedName) {
    const disposition = response.headers?.['content-disposition'] as string | undefined
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
    if (match && match[1]) {
      resolvedName = decodeURIComponent(match[1].replace(/"/g, ''))
    }
  }
  if (!resolvedName) {
    resolvedName = '文件下载'
  }
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = resolvedName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const downloadFile = async (file: FileHistoryItem) => {
  try {
    await downloadById(file.id, file.fileName)
    ElMessage.success('文件下载成功')
  } catch {
    ElMessage.error('文件下载失败')
  }
}

const fetchFileHistory = async () => {
  try {
    historyLoading.value = true
    const response = await axios.get(`/api/versions/${props.versionId}/files`)
    fileHistory.value = response.data.data || []
  } catch {
    ElMessage.error('获取文件历史失败')
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  fetchFileHistory()
})
</script>

<style scoped>
.import-export-panel {
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

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.section-card {
  padding: 10px;
}

.section-title {
  margin-bottom: 8px;
  font-size: 14px;
}

.card-grid {
  display: grid;
  gap: 8px;
}

.action-card {
  border: 1px solid #dce3ed;
  border-radius: 4px;
  background: #f8fbff;
  padding: 10px;
  text-align: left;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  cursor: pointer;
}

.action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-title {
  font-size: 13px;
  color: #1f2937;
}

.card-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.history-card {
  flex: 1;
  min-height: 0;
  padding: 10px;
  overflow: hidden;
}

.section-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.import-result {
  padding: 10px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.error-list {
  margin-top: 8px;
}

.error-title {
  font-size: 12px;
  color: #dc2626;
}

.error-item {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 1080px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
