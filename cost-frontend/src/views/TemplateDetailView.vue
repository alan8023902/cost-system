<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex-center">
        <el-button link @click="$router.back()">
          <el-icon class="mr-8"><ArrowLeft /></el-icon> 返回
        </el-button>
        <h1 class="ml-16">{{ isEdit ? '编辑模板' : '新建模板' }}</h1>
      </div>
      <div>
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </div>
    </div>

    <div class="page-content">
        <el-form :model="form" label-position="top" :rules="rules" ref="formRef">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isEdit">
            <el-form-item label="当前版本">
              <el-input v-model="form.templateVersion" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="结构配置（JSON）" prop="schemaJson">
          <div class="mb-8 flex-between">
             <span class="text-secondary text-xs">使用 JSON 描述成本条目结构。</span>
             <el-button size="small" @click="formatJson" :icon="Tools">格式化并校验</el-button>
          </div>
          <el-input
            v-model="form.schemaJson"
            type="textarea"
            :rows="20"
            class="font-mono"
            placeholder="{ ... }"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplateStore } from '../stores/template'
import { ArrowLeft, Tools } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useTemplateStore()

const formRef = ref()
const saving = ref(false)
const isEdit = computed(() => route.params.id !== 'create')

const form = ref({
  name: '',
  templateVersion: '',
  schemaJson: '{}'
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  schemaJson: [
    { required: true, message: '请输入结构配置 JSON', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        try {
          JSON.parse(value)
          callback()
        } catch (e) {
          callback(new Error('JSON 格式不正确'))
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

onMounted(async () => {
  if (isEdit.value) {
    const id = Number(route.params.id)
    await store.fetchTemplate(id)
    if (store.currentTemplate) {
      form.value = {
        name: store.currentTemplate.name,
        templateVersion: store.currentTemplate.templateVersion,
        schemaJson: store.currentTemplate.schemaJson || '{}'
      }
      // Auto-format on load
      formatJson()
    }
  }
})

const formatJson = () => {
  try {
    const obj = JSON.parse(form.value.schemaJson)
    form.value.schemaJson = JSON.stringify(obj, null, 2)
    return true
  } catch (e) {
    ElMessage.error('JSON 格式不正确')
    return false
  }
}

const save = async () => {
  if (!formRef.value) return
  
  // Validate JSON first
  if (!formatJson()) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await store.updateTemplate(Number(route.params.id), {
            name: form.value.name,
            schemaJson: form.value.schemaJson
          })
          ElMessage.success('模板已更新')
        } else {
          await store.createTemplate({
            name: form.value.name,
            schemaJson: form.value.schemaJson
          })
          ElMessage.success('模板已创建')
          router.push('/templates')
        }
      } catch (e) {
        ElMessage.error('模板保存失败')
      } finally {
        saving.value = false
      }
    }
  })
}
</script>

<style scoped>
:deep(.el-textarea__inner) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace !important;
  font-size: 13px;
  line-height: 1.5;
}
</style>