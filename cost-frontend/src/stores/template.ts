import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Template {
  id: number
  name: string
  templateVersion: string
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED'
  schemaJson: string
  createdAt: string
  updatedAt: string
}

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([])
  const currentTemplate = ref<Template | null>(null)
  const loading = ref(false)

  const fetchTemplates = async (status?: string) => {
    loading.value = true
    try {
      const response = await axios.get('/api/templates', { params: { status } })
      templates.value = response.data.data || []
    } catch (error) {
      console.error('获取模板列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchTemplate = async (id: number) => {
    loading.value = true
    try {
      const response = await axios.get(`/api/templates/${id}`)
      currentTemplate.value = response.data.data
    } catch (error) {
      console.error('获取模板详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  const createTemplate = async (data: { name: string; schemaJson: string }) => {
    try {
      const response = await axios.post('/api/templates', data)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to create template' }
    }
  }

  const updateTemplate = async (id: number, data: { name: string; schemaJson: string }) => {
    try {
      const response = await axios.put(`/api/templates/${id}`, data)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to update template' }
    }
  }

  const publishTemplate = async (id: number) => {
    try {
      const response = await axios.post(`/api/templates/${id}/publish`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to publish template' }
    }
  }

  const disableTemplate = async (id: number) => {
    try {
      const response = await axios.post(`/api/templates/${id}/disable`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to disable template' }
    }
  }

  return {
    templates,
    currentTemplate,
    loading,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    publishTemplate,
    disableTemplate
  }
})
