import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Project {
  id: number
  code: string
  name: string
  orgId?: number
  status: 'ACTIVE' | 'ARCHIVED'
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: number
  projectId: number
  userId: number
  username: string
  projectRole: string
  dataScope: string
  createdAt: string
}

export interface FormVersion {
  id: number
  projectId: number
  versionNo: number
  status: 'DRAFT' | 'IN_APPROVAL' | 'APPROVED' | 'ISSUED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const projectMembers = ref<ProjectMember[]>([])
  const projectVersions = ref<FormVersion[]>([])
  const loading = ref(false)

  const fetchProjects = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/projects')
      const data = response.data.data
      projects.value = data?.content ?? data ?? []
    } catch (error) {
      console.error('获取项目列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchProject = async (projectId: number) => {
    loading.value = true
    try {
      const response = await axios.get(`/api/projects/${projectId}`)
      currentProject.value = response.data.data
    } catch (error) {
      console.error('获取项目详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchProjectMembers = async (projectId: number) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/members`)
      projectMembers.value = response.data.data
    } catch (error) {
      console.error('获取项目成员失败:', error)
    }
  }

  const fetchProjectVersions = async (projectId: number) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/versions`)
      projectVersions.value = response.data.data
    } catch (error) {
      console.error('获取项目版本失败:', error)
    }
  }

  const createProject = async (projectData: { code: string; name: string; orgId?: number }) => {
    try {
      const response = await axios.post('/api/projects', projectData)
      await fetchProjects() // 刷新列表
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || '创建项目失败' 
      }
    }
  }

  return {
    projects,
    currentProject,
    projectMembers,
    projectVersions,
    loading,
    fetchProjects,
    fetchProject,
    fetchProjectMembers,
    fetchProjectVersions,
    createProject
  }
})
