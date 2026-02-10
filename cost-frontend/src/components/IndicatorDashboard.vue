<template>
  <div class="indicator-dashboard">
    <header class="dashboard-header">
      <div>
        <h2 class="dashboard-title">
          指标看板（只读）
        </h2>
        <p class="dashboard-subtitle">
          分组展示核心指标，点击指标查看追溯链
        </p>
      </div>
      <el-button
        :icon="Refresh"
        :loading="calculating"
        @click="handleRecalculate"
      >
        重算
      </el-button>
    </header>

    <main class="dashboard-body">
      <section class="indicator-section panel-card">
        <div
          v-for="group in groupedIndicators"
          :key="group.key"
          class="indicator-group"
        >
          <h3 class="group-title">
            {{ group.label }}
          </h3>
          <div class="indicator-grid">
            <button
              v-for="indicator in group.items"
              :key="indicator.code"
              class="indicator-item"
              :class="{ active: selectedIndicator?.code === indicator.code }"
              @click="openTrace(indicator)"
            >
              <span class="item-label">{{ indicator.name }}</span>
              <span class="item-value">{{ formatValue(indicator.value, indicator.unit) }}</span>
              <span class="item-meta">{{ indicator.unit || '-' }} · {{ formatDate(indicator.updatedAt) }}</span>
            </button>
          </div>
        </div>

        <el-empty
          v-if="!loading && indicators.length === 0"
          description="暂无指标数据"
        />
        <el-skeleton
          v-if="loading"
          :rows="4"
          animated
        />
      </section>

      <section class="trace-section panel-card">
        <div class="trace-header">
          <h3 class="trace-title">
            指标追溯链
          </h3>
          <el-button
            :disabled="!selectedIndicator"
            @click="exportTrace"
          >
            导出追溯
          </el-button>
        </div>

        <div
          v-if="selectedIndicator"
          class="trace-content"
        >
          <div class="trace-block">
            <p class="trace-label">
              指标
            </p>
            <p class="trace-value">
              {{ selectedIndicator.name }}（{{ selectedIndicator.code }}）
            </p>
          </div>

          <div class="trace-block">
            <p class="trace-label">
              规则表达式
            </p>
            <div class="formula-box">
              <code>{{ selectedIndicator.formula || '-' }}</code>
            </div>
          </div>

          <div class="trace-block">
            <p class="trace-label">
              计算过程
            </p>
            <el-table
              v-loading="traceLoading"
              :data="calculationSteps"
              border
              size="small"
            >
              <el-table-column
                type="index"
                label="#"
                width="48"
                align="center"
              />
              <el-table-column
                prop="description"
                label="步骤"
                min-width="130"
              />
              <el-table-column
                prop="formula"
                label="表达式"
                min-width="170"
              />
              <el-table-column
                prop="result"
                label="结果"
                min-width="120"
                align="right"
              />
            </el-table>
          </div>

          <div class="trace-block">
            <p class="trace-label">
              命中数据
            </p>
            <el-table
              v-loading="traceLoading"
              :data="sourceData"
              border
              size="small"
            >
              <el-table-column
                prop="source"
                label="数据源"
                width="100"
              />
              <el-table-column
                prop="field"
                label="字段"
                width="120"
              />
              <el-table-column
                prop="condition"
                label="筛选条件"
                min-width="140"
              />
              <el-table-column
                prop="count"
                label="记录数"
                width="80"
                align="right"
              />
              <el-table-column
                label="贡献值"
                width="130"
                align="right"
              >
                <template #default="scope">
                  {{ formatValue(scope.row.value, scope.row.unit) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <el-empty
          v-else
          description="请选择左侧指标查看追溯链"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

interface Props {
  versionId: number
}

interface Indicator {
  code: string
  name: string
  value: number
  unit: string
  formula: string
  updatedAt: string
}

interface CalculationStep {
  description: string
  formula: string
  result: string
}

interface SourceData {
  source: string
  field: string
  condition: string
  count: number
  value: number
  unit: string
}

const props = defineProps<Props>()

const indicators = ref<Indicator[]>([])
const loading = ref(false)
const calculating = ref(false)
const traceLoading = ref(false)

const selectedIndicator = ref<Indicator | null>(null)
const calculationSteps = ref<CalculationStep[]>([])
const sourceData = ref<SourceData[]>([])

const groupedIndicators = computed(() => {
  const groups = [
    { key: 'cost', label: '成本指标', items: [] as Indicator[] },
    { key: 'tax', label: '税务指标', items: [] as Indicator[] },
    { key: 'other', label: '综合指标', items: [] as Indicator[] }
  ]

  for (const indicator of indicators.value) {
    const key = indicator.code.toLowerCase()
    if (key.includes('tax')) {
      groups[1].items.push(indicator)
    } else if (key.includes('cost') || key.includes('amount')) {
      groups[0].items.push(indicator)
    } else {
      groups[2].items.push(indicator)
    }
  }

  return groups.filter((group) => group.items.length > 0)
})

const formatValue = (value: number, unit: string) => {
  if (value === null || value === undefined) {
    return '-'
  }

  if (unit === '元' || unit === '万元') {
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 4
  })
}

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleString('zh-CN', { hour12: false })
}

const calcTypeLabelMap: Record<string, string> = {
  SUM: '求和',
  AVG: '平均',
  MIN: '最小',
  MAX: '最大'
}

const getCalcTypeLabel = (type?: string) => {
  if (!type) return '求和'
  return calcTypeLabelMap[type] || type
}

const mapIndicator = (item: any): Indicator => ({
  code: item.indicatorKey || item.code,
  name: item.name || item.indicatorKey || item.code,
  value: Number(item.value ?? 0),
  unit: item.unit || '',
  formula: item.expression || item.formula || '',
  updatedAt: item.calcTime || item.updatedAt || new Date().toISOString()
})

const handleRecalculate = async () => {
  try {
    calculating.value = true
    const response = await axios.post(`/api/versions/${props.versionId}/recalc`)
    const data = response.data.data || []
    indicators.value = data.map(mapIndicator)
    ElMessage.success('重算完成')

    if (selectedIndicator.value) {
      const latest = indicators.value.find((item) => item.code === selectedIndicator.value?.code)
      if (latest) {
        await openTrace(latest)
      }
    }
  } catch {
    ElMessage.error('重算失败')
  } finally {
    calculating.value = false
  }
}

const openTrace = async (indicator: Indicator) => {
  selectedIndicator.value = indicator
  traceLoading.value = true

  try {
    const response = await axios.get(`/api/versions/${props.versionId}/indicators/${indicator.code}/trace`)
    const traceData = response.data.data || {}
    const formula = traceData.expression || indicator.formula

    selectedIndicator.value = { ...indicator, formula }

  const intermediate = Array.isArray(traceData.intermediate) ? traceData.intermediate : []
  calculationSteps.value = intermediate.map((item: any) => ({
      description: `汇总 ${getCalcTypeLabel(item.type)}`,
      formula: item.expression || '-',
      result: formatValue(Number(item.value ?? 0), indicator.unit)
    }))

    if (traceData.result !== undefined) {
      calculationSteps.value.push({
        description: '最终结果',
        formula: formula || '-',
        result: formatValue(Number(traceData.result ?? 0), indicator.unit)
      })
    }

    sourceData.value = intermediate.map((item: any) => ({
      source: '明细行',
      field: item.field || '-',
      condition: item.condition || '-',
      count: Number(item.count ?? 0),
      value: Number(item.value ?? 0),
      unit: indicator.unit
    }))
  } catch {
    ElMessage.error('获取追溯数据失败')
  } finally {
    traceLoading.value = false
  }
}

const exportTrace = () => {
  if (!selectedIndicator.value) {
    ElMessage.warning('请先选择指标')
    return
  }

  const lines: string[] = []
  lines.push(`指标: ${selectedIndicator.value.name}`)
  lines.push(`编码: ${selectedIndicator.value.code}`)
  lines.push(`公式: ${selectedIndicator.value.formula || '-'}`)
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push('')
  lines.push('=== 计算过程 ===')

  if (calculationSteps.value.length === 0) {
    lines.push('无')
  } else {
    calculationSteps.value.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.description}`)
      lines.push(`   表达式: ${step.formula}`)
      lines.push(`   结果: ${step.result}`)
    })
  }

  lines.push('')
  lines.push('=== 命中数据 ===')
  if (sourceData.value.length === 0) {
    lines.push('无')
  } else {
    sourceData.value.forEach((row) => {
      lines.push(`[${row.source}] 字段:${row.field} 条件:${row.condition} 记录:${row.count} 贡献:${formatValue(row.value, row.unit)}`)
    })
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `指标追溯-${selectedIndicator.value.code}-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
  ElMessage.success('追溯文件已导出')
}

const fetchIndicators = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/versions/${props.versionId}/indicators`)
    const data = response.data.data || []
    indicators.value = data.map(mapIndicator)
  } catch {
    ElMessage.error('获取指标数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchIndicators()
})
</script>

<style scoped>
.indicator-dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.dashboard-title {
  font-size: 16px;
}

.dashboard-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.dashboard-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.indicator-section,
.trace-section {
  padding: 10px;
  min-height: 0;
  overflow: auto;
}

.indicator-group + .indicator-group {
  margin-top: 10px;
}

.group-title {
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}

.indicator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.indicator-item {
  text-align: left;
  border: 1px solid #e1e7f0;
  border-radius: 4px;
  background: #f8fbff;
  padding: 10px;
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.indicator-item.active {
  border-color: #bfd0ff;
  background: #eef4ff;
}

.item-label {
  font-size: 12px;
  color: #6b7280;
}

.item-value {
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.item-meta {
  font-size: 12px;
  color: #94a3b8;
}

.trace-header {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trace-title {
  font-size: 14px;
}

.trace-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trace-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trace-label {
  font-size: 12px;
  color: #6b7280;
}

.trace-value {
  font-size: 13px;
  color: #1f2937;
}

.formula-box {
  border: 1px solid #dbe3ef;
  border-radius: 4px;
  background: #f8fbff;
  padding: 8px;
}

.formula-box code {
  font-size: 12px;
  color: #1d4ed8;
}

@media (max-width: 1080px) {
  .dashboard-body {
    grid-template-columns: 1fr;
  }
}
</style>
