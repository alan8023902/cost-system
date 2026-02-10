import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface User {
  id: number
  username: string
  email?: string
  roles?: string[]
  status?: 'ACTIVE' | 'INACTIVE'
  department?: string
}

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)

  const fetchUsers = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/auth/simple/users')
      users.value = response.data.data || []
      // Mock additional fields if missing
      users.value = users.value.map(u => ({
        ...u,
        status: u.status || 'ACTIVE',
        department: u.department || 'Engineering',
        roles: u.roles || ['USER']
      }))
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      loading.value = false
    }
  }

  const createTestUser = async (username: string) => {
    try {
      const response = await axios.post(`/api/auth/simple/users/${username}`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to create user' }
    }
  }
  
  const createUser = async (data: any) => {
     // Mock create
     await new Promise(resolve => setTimeout(resolve, 500))
     const newUser = {
       id: Date.now(),
       username: data.username,
       email: data.email,
       roles: data.roles,
       status: 'ACTIVE',
       department: data.department
     }
     users.value.push(newUser)
     return { success: true }
  }

  const updateUser = async (id: number, data: Partial<User>) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 300))
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) {
       users.value[idx] = { ...users.value[idx], ...data }
    }
    return { success: true }
  }
  
  const deleteUser = async (id: number) => {
    // Mock delete
    await new Promise(resolve => setTimeout(resolve, 300))
    users.value = users.value.filter(u => u.id !== id)
    return { success: true }
  }

  return {
    users,
    loading,
    fetchUsers,
    createTestUser,
    createUser,
    updateUser,
    deleteUser
  }
})
