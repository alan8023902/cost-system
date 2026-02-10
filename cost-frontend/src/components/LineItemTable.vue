<template>
  <div class="line-item-table">
    <div class="table-header">
      <div class="header-left">
        <h2 class="table-title">
          {{ getModuleTitle(module) }}
        </h2>
        <el-tag
          size="small"
          type="info"
        >
          共 {{ lineItems.length }} 条
        </el-tag>
        <el-tag
          v-if="validationCount"
          size="small"
          type="warning"
        >
          {{ validationCount }} 条待补充
        </el-tag>
      </div>

      <div class="header-right">
        <el-input
          v-model="keyword"
          class="toolbar-input"
          placeholder="筛选名称/规格"
          clearable
        />
        <el-input-number
          v-model="minAmount"
          :min="0"
          :step="100"
          controls-position="right"
          class="toolbar-number"
          placeholder="最小金额"
        />
        <el-select
          v-model="sortBy"
          class="toolbar-select"
        >
          <el-option
            label="默认排序"
            value="default"
          />
          <el-option
            label="金额升序"
            value="amount-asc"
          />
          <el-option
            label="金额降序"
            value="amount-desc"
          />
        </el-select>
      </div>
    </div>

    <div
      v-if="!readonly"
      class="action-row"
    >
      <el-button
        :icon="Plus"
        @click="addNewRow"
      >
        新增行
      </el-button>
      <el-button
        :icon="CopyDocument"
        @click="showBatchPasteDialog = true"
      >
        批量粘贴
      </el-button>
      <el-button
        :icon="Refresh"
        :loading="loading"
        @click="handleCalculate"
      >
        重算指标
      </el-button>
      <span class="action-hint">支持 Tab 粘贴、行内编辑、回车切换下一行</span>
    </div>

    <el-alert
      v-if="readonly"
      title="当前版本为只读状态"
      :description="`版本状态：${getVersionStatusText(versionStatus)}，无法编辑明细。`"
      type="info"
      :closable="false"
      show-icon
    />

    <el-table
      :data="displayLineItems"
      border
      stripe
      :height="tableHeight"
      :row-class-name="getRowClassName"
      @cell-click="handleCellClick"
    >
      <el-table-column
        type="index"
        label="序号"
        width="60"
        align="center"
      />

      <el-table-column
        v-for="column in tableColumns"
        :key="column.field"
        :prop="column.field"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align || 'left'"
      >
        <template #default="scope">
          <div
            v-if="!readonly && column.editable"
            class="editable-cell"
            @click.stop="startEditByRow(scope.row, column.field)"
          >
            <el-input
              v-if="isEditingRow(scope.row, column.field)"
              v-model="scope.row[column.field]"
              :type="column.type === 'number' ? 'number' : 'text'"
              size="small"
              @blur="finishEdit"
              @keydown.enter.prevent="finishEditAndMove('down')"
              @keydown.tab.prevent="finishEditAndMove('next')"
              @keydown.esc.prevent="cancelEdit"
            />
            <span
              v-else
              class="cell-content"
            >
              {{ formatCellValue(scope.row[column.field], column) }}
              <span
                v-if="showRequiredHint(scope.row, column.field)"
                class="required-dot"
              >*</span>
            </span>
          </div>

          <span
            v-else
            class="cell-content"
          >
            {{ formatCellValue(scope.row[column.field], column) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        v-if="!readonly"
        label="操作"
        width="120"
        align="center"
        fixed="right"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="copyRow(scope.row)"
          >
            复制
          </el-button>
          <el-button
            link
            type="danger"
            @click="deleteRow(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="暂无明细数据" />
      </template>
    </el-table>

    <el-dialog
      v-model="showBatchPasteDialog"
      title="批量粘贴数据"
      width="720px"
      :before-close="handleClosePasteDialog"
    >
      <div class="paste-dialog-content">
        <el-alert
          title="支持从 Excel 直接粘贴"
          description="每行按 Tab 分列，系统将自动映射并批量保存。"
          type="info"
          :closable="false"
          show-icon
        />

        <el-input
          v-model="pasteData"
          type="textarea"
          :rows="10"
          placeholder="请粘贴 Excel 数据..."
          class="paste-textarea"
        />

        <div class="paste-hint">
          列顺序：项目名称、规格型号、单位、数量、单价（材料类可继续粘贴材料类别、品牌）
        </div>
      </div>

      <template #footer>
        <el-button @click="handleClosePasteDialog">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="pasteLoading"
          @click="handleBatchPaste"
        >
          导入并保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Plus, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

interface Props {
  module: string
  versionId: number
  readonly?: boolean
  versionStatus?: string
}

interface LineItem {
  id?: number
  [key: string]: any
}

interface TableColumn {
  field: string
  label: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'number'
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  versionStatus: 'DRAFT'
})

const lineItems = ref<LineItem[]>([])
const loading = ref(false)
const tableHeight = ref(560)

const showBatchPasteDialog = ref(false)
const pasteData = ref('')
const pasteLoading = ref(false)

const keyword = ref('')
const minAmount = ref<number | null>(null)
const sortBy = ref('default')

const editingCell = reactive({
  row: -1,
  field: '',
  originalValue: null as any
})

const versionStatus = computed(() => props.versionStatus || 'DRAFT')

const tableColumns = computed<TableColumn[]>(() => {
  const baseColumns: TableColumn[] = [
    { field: 'itemName', label: '项目名称', minWidth: 180, editable: true },
    { field: 'specification', label: '规格型号', minWidth: 140, editable: true },
    { field: 'unit', label: '单位', width: 80, editable: true },
    { field: 'quantity', label: '数量', width: 96, align: 'right', type: 'number', editable: true },
    { field: 'unitPrice', label: '单价', width: 110, align: 'right', type: 'number', editable: true },
    { field: 'totalAmount', label: '含税金额', width: 130, align: 'right', type: 'number', editable: false }
  ]

  if (props.module === 'materials') {
    baseColumns.splice(2, 0,
      { field: 'category', label: '材料类别', width: 120, editable: true },
      { field: 'brand', label: '品牌', width: 100, editable: true }
    )
  }

  if (props.module === 'subcontract') {
    baseColumns.splice(2, 0,
      { field: 'contractorName', label: '分包商', width: 150, editable: true },
      { field: 'workType', label: '工程类型', width: 120, editable: true }
    )
  }

  return baseColumns
})

const editableFieldOrder = computed(() => tableColumns.value.filter((col) => col.editable).map((col) => col.field))

const requiredFields = ['itemName', 'unit', 'quantity', 'unitPrice']

const validationCount = computed(() => {
  return lineItems.value.filter((row) => getMissingFields(row).length > 0).length
})

const displayLineItems = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  const filtered = lineItems.value.filter((row) => {
    const keywordMatched = !search || [row.itemName, row.specification, row.brand, row.contractorName]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(search))

    const minAmountMatched = minAmount.value === null || Number(row.totalAmount || 0) >= Number(minAmount.value)
    return keywordMatched && minAmountMatched
  })

  if (sortBy.value === 'amount-asc') {
    return [...filtered].sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0))
  }

  if (sortBy.value === 'amount-desc') {
    return [...filtered].sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0))
  }

  return filtered
})

const getModuleTitle = (module: string) => {
  const titleMap: Record<string, string> = {
    materials: '物资费用明细',
    subcontract: '分包费用明细',
    other: '其他费用明细'
  }
  return titleMap[module] || '费用明细'
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

const getMissingFields = (row: LineItem) => {
  return requiredFields.filter((field) => {
    const value = row[field]
    if (field === 'quantity' || field === 'unitPrice') {
      return value === null || value === undefined || value === '' || Number.isNaN(Number(value))
    }
    return value === null || value === undefined || String(value).trim() === ''
  })
}

const showRequiredHint = (row: LineItem, field: string) => {
  return !props.readonly && getMissingFields(row).includes(field)
}

const resolveRowIndex = (row: LineItem) => lineItems.value.indexOf(row)

const isEditingRow = (row: LineItem, field: string) => {
  return editingCell.row === resolveRowIndex(row) && editingCell.field === field
}

const getRowClassName = ({ row }: { row: LineItem }) => {
  return getMissingFields(row).length > 0 ? 'invalid-row' : ''
}

const formatCellValue = (value: any, column: TableColumn) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (column.type === 'number') {
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return value
}

const resetEditingCell = () => {
  editingCell.row = -1
  editingCell.field = ''
  editingCell.originalValue = null
}

const startEdit = (rowIndex: number, field: string) => {
  if (props.readonly || rowIndex < 0) {
    return
  }

  editingCell.row = rowIndex
  editingCell.field = field
  editingCell.originalValue = lineItems.value[rowIndex]?.[field]

  nextTick(() => {
    const input = document.querySelector('.editable-cell input') as HTMLInputElement | null
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const startEditByRow = (row: LineItem, field: string) => {
  startEdit(resolveRowIndex(row), field)
}

const handleCellClick = (row: LineItem, column: any) => {
  if (props.readonly) {
    return
  }

  const field = column?.property
  const columnConfig = tableColumns.value.find((col) => col.field === field)
  if (!columnConfig?.editable) {
    return
  }

  startEditByRow(row, field)
}

const getNextEditablePosition = (direction: 'next' | 'down') => {
  if (editingCell.row < 0 || !editingCell.field) {
    return null
  }

  const fields = editableFieldOrder.value
  const currentFieldIndex = fields.indexOf(editingCell.field)
  if (currentFieldIndex < 0) {
    return null
  }

  if (direction === 'next') {
    const nextFieldIndex = currentFieldIndex + 1
    if (nextFieldIndex < fields.length) {
      return { row: editingCell.row, field: fields[nextFieldIndex] }
    }

    if (editingCell.row + 1 < lineItems.value.length) {
      return { row: editingCell.row + 1, field: fields[0] }
    }

    return null
  }

  if (editingCell.row + 1 < lineItems.value.length) {
    return { row: editingCell.row + 1, field: editingCell.field }
  }

  return null
}

const finishEdit = async () => {
  if (editingCell.row < 0 || !editingCell.field) {
    return
  }

  const row = lineItems.value[editingCell.row]
  if (!row) {
    resetEditingCell()
    return
  }

  if (editingCell.field === 'quantity' || editingCell.field === 'unitPrice') {
    row.totalAmount = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)
  }

  await saveLineItem(row)
  resetEditingCell()
}

const finishEditAndMove = async (direction: 'next' | 'down') => {
  const nextPosition = getNextEditablePosition(direction)
  await finishEdit()

  if (nextPosition) {
    startEdit(nextPosition.row, nextPosition.field)
  }
}

const cancelEdit = () => {
  if (editingCell.row >= 0 && editingCell.field) {
    lineItems.value[editingCell.row][editingCell.field] = editingCell.originalValue
  }
  resetEditingCell()
}

const addNewRow = () => {
  const newRow: LineItem = {
    itemName: '',
    specification: '',
    unit: '',
    quantity: 0,
    unitPrice: 0,
    totalAmount: 0
  }

  if (props.module === 'materials') {
    newRow.category = ''
    newRow.brand = ''
  }

  if (props.module === 'subcontract') {
    newRow.contractorName = ''
    newRow.workType = ''
  }

  lineItems.value.push(newRow)
}

const copyRow = (row: LineItem) => {
  const index = resolveRowIndex(row)
  if (index < 0) {
    return
  }
  const newRow = { ...lineItems.value[index] }
  delete newRow.id
  lineItems.value.splice(index + 1, 0, newRow)
}

const deleteRow = async (row: LineItem) => {
  const index = resolveRowIndex(row)
  if (index < 0) {
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这一行吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const target = lineItems.value[index]
    if (target?.id) {
      await axios.delete(`/api/versions/${props.versionId}/line-items/${target.id}`)
    }

    lineItems.value.splice(index, 1)
    ElMessage.success('删除成功')
  } catch {
    // user cancelled
  }
}

const handleCalculate = async () => {
  try {
    loading.value = true
    await axios.post(`/api/calc/versions/${props.versionId}/recalc`)
    ElMessage.success('重算完成')
    await fetchItems()
  } catch {
    ElMessage.error('重算失败')
  } finally {
    loading.value = false
  }
}

const parsePasteRows = () => {
  const rows = pasteData.value.trim().split('\n')
  const parsedItems: LineItem[] = []
  let invalidRowCount = 0

  for (const row of rows) {
    const cells = row.split('\t').map((cell) => cell.trim())
    if (cells.length < 4) {
      invalidRowCount += 1
      continue
    }

    const quantity = Number(cells[3])
    const unitPrice = Number(cells[4] || 0)

    if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) {
      invalidRowCount += 1
      continue
    }

    const item: LineItem = {
      itemName: cells[0] || '',
      specification: cells[1] || '',
      unit: cells[2] || '',
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice
    }

    if (props.module === 'materials') {
      item.category = cells[5] || ''
      item.brand = cells[6] || ''
    }

    if (props.module === 'subcontract') {
      item.contractorName = cells[5] || ''
      item.workType = cells[6] || ''
    }

    parsedItems.push(item)
  }

  return { parsedItems, invalidRowCount }
}

const handleBatchPaste = async () => {
  if (!pasteData.value.trim()) {
    ElMessage.warning('请先粘贴数据')
    return
  }

  const { parsedItems, invalidRowCount } = parsePasteRows()
  if (!parsedItems.length) {
    ElMessage.warning('未能解析到有效数据')
    return
  }

  try {
    pasteLoading.value = true
    const response = await axios.post(`/api/versions/${props.versionId}/line-items/batch`, {
      module: props.module,
      items: parsedItems
    })

    const savedItems = response.data.data || []
    lineItems.value.push(...savedItems)

    if (invalidRowCount > 0) {
      ElMessage.warning(`已导入 ${savedItems.length} 条，忽略 ${invalidRowCount} 条无效数据`)
    } else {
      ElMessage.success(`成功导入 ${savedItems.length} 条数据`)
    }

    handleClosePasteDialog()
  } catch {
    ElMessage.error('数据导入失败')
  } finally {
    pasteLoading.value = false
  }
}

const handleClosePasteDialog = () => {
  showBatchPasteDialog.value = false
  pasteData.value = ''
}

const saveLineItem = async (item: LineItem) => {
  if (!item.itemName) {
    return
  }

  try {
    const response = await axios.post(`/api/versions/${props.versionId}/line-items/batch`, {
      module: props.module,
      items: [item]
    })

    const saved = response.data.data?.[0]
    if (saved?.id) {
      Object.assign(item, saved)
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

const fetchLineItems = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/versions/${props.versionId}/line-items`, {
      params: { module: props.module }
    })
    lineItems.value = response.data.data || []
  } catch {
    ElMessage.error('获取明细数据失败')
  } finally {
    loading.value = false
  }
}

const updateTableHeight = () => {
  tableHeight.value = Math.max(window.innerHeight - 360, 320)
}

watch(
  () => [props.module, props.versionId],
  () => {
    resetEditingCell()
    fetchLineItems()
  }
)

onMounted(() => {
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  fetchLineItems()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.line-item-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.table-title {
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-input {
  width: 180px;
}

.toolbar-number {
  width: 130px;
}

.toolbar-select {
  width: 130px;
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.action-hint {
  font-size: 12px;
  color: #6b7280;
}

.editable-cell {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 4px;
}

.editable-cell:hover {
  background: #f5f7fa;
}

.cell-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.required-dot {
  color: #dc2626;
  font-weight: 600;
}

.paste-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paste-textarea {
  margin-top: 4px;
}

.paste-hint {
  font-size: 12px;
  color: #6b7280;
}

:deep(.invalid-row) {
  background: #fffbeb;
}
</style>
