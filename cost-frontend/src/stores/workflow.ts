import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Task {
  id: number
  projectId: number
  versionId: number
  title: string
  description: string
  submitter: string
  status: string
  createdAt: string
  processedAt?: string
  comment?: string
}

export interface WorkflowDefinition {
  id: number
  name: string
  key: string
  description?: string
  version: number
  isActive: boolean
  nodesJson: string // JSON string for workflow steps
  createdAt: string
  updatedAt: string
}

export const useWorkflowStore = defineStore('workflow', () => {
  // Tasks (Runtime)
  const myTasks = ref<Task[]>([])
  const loading = ref(false)

  // Definitions (Design time)
  const definitions = ref<WorkflowDefinition[]>([])
  const currentDefinition = ref<WorkflowDefinition | null>(null)

  // Actions - Tasks
  const fetchMyTasks = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/workflow/my-tasks')
      myTasks.value = response.data.data || []
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      loading.value = false
    }
  }

  // Actions - Definitions
  const fetchDefinitions = async () => {
    loading.value = true
    try {
      // Mock API call
      // const response = await axios.get('/api/workflow/definitions')
      // definitions.value = response.data.data || []
      
      // Mock data for UI development
      await new Promise(resolve => setTimeout(resolve, 500))
      if (definitions.value.length === 0) {
        definitions.value = [
          {
            id: 1,
            name: 'Standard Cost Approval',
            key: 'standard_cost_approval',
            description: 'Standard multi-level approval process for cost versions',
            version: 1,
            isActive: true,
            nodesJson: '[]',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Emergency Budget Change',
            key: 'emergency_change',
            description: 'Fast-track approval for emergency changes',
            version: 1,
            isActive: true,
            nodesJson: '[]',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    } catch (error) {
      console.error('Failed to fetch definitions:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchDefinition = async (id: number) => {
    loading.value = true
    try {
      // const response = await axios.get(`/api/workflow/definitions/${id}`)
      // currentDefinition.value = response.data.data
      
      await new Promise(resolve => setTimeout(resolve, 300))
      currentDefinition.value = definitions.value.find(d => d.id === id) || null
    } catch (error) {
      console.error('Failed to fetch definition:', error)
    } finally {
      loading.value = false
    }
  }

  const createDefinition = async (data: Partial<WorkflowDefinition>) => {
    loading.value = true
    try {
      // await axios.post('/api/workflow/definitions', data)
      await new Promise(resolve => setTimeout(resolve, 500))
      const newDef: WorkflowDefinition = {
        id: Date.now(),
        name: data.name || 'New Workflow',
        key: data.key || 'new_workflow',
        description: data.description,
        version: 1,
        isActive: true,
        nodesJson: data.nodesJson || '[]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      definitions.value.push(newDef)
      return newDef
    } finally {
      loading.value = false
    }
  }

  const updateDefinition = async (id: number, data: Partial<WorkflowDefinition>) => {
    loading.value = true
    try {
      // await axios.put(`/api/workflow/definitions/${id}`, data)
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = definitions.value.findIndex(d => d.id === id)
      if (index !== -1) {
        definitions.value[index] = { ...definitions.value[index], ...data, updatedAt: new Date().toISOString() }
        currentDefinition.value = definitions.value[index]
      }
    } finally {
      loading.value = false
    }
  }

  return {
    myTasks,
    definitions,
    currentDefinition,
    loading,
    fetchMyTasks,
    fetchDefinitions,
    fetchDefinition,
    createDefinition,
    updateDefinition
  }
})
