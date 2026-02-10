import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface User {
  id: number
  username: string
  phone?: string
  status: string
  orgId?: number
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  userInfo: User
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isAuthenticated = ref(!!token.value)

  // 设置 axios 默认请求头
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const login = async (loginId: string, password: string) => {
    try {
      const response = await axios.post<{
        code: number
        message: string
        data: LoginResponse
      }>('/api/auth/login', {
        loginId,
        password
      })

      if (response.data.code === 0) {
        const { accessToken, refreshToken: newRefreshToken, userInfo } = response.data.data
        
        // 保存认证信息
        token.value = accessToken
        refreshToken.value = newRefreshToken
        user.value = userInfo
        isAuthenticated.value = true

        // 保存到本地存储
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(userInfo))

        // 设置 axios 默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        return { success: true }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请检查网络连接' 
      }
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await axios.post('/api/auth/logout')
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 清除认证信息
      token.value = null
      refreshToken.value = null
      user.value = null
      isAuthenticated.value = false

      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // 清除 axios 默认请求头
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const refreshTokens = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post<{
        code: number
        message: string
        data: LoginResponse
      }>('/api/auth/refresh', {
        refreshToken: refreshToken.value
      })

      if (response.data.code === 0) {
        const { accessToken, refreshToken: newRefreshToken, userInfo } = response.data.data
        
        token.value = accessToken
        refreshToken.value = newRefreshToken
        user.value = userInfo

        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        localStorage.setItem('user', JSON.stringify(userInfo))

        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        return true
      } else {
        await logout()
        return false
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      await logout()
      return false
    }
  }

  const getCurrentUser = async () => {
    try {
      const response = await axios.get<{
        code: number
        message: string
        data: User
      }>('/api/auth/me')

      if (response.data.code === 0) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(response.data.data))
        return response.data.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      await logout()
    }
    return null
  }

  // 初始化时从本地存储恢复用户信息
  const initializeAuth = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      } catch (error) {
        console.error('解析用户信息失败:', error)
        logout()
      }
    }
  }

  // 设置 axios 响应拦截器处理 401 错误
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && token.value) {
        // 尝试刷新令牌
        const refreshed = await refreshTokens()
        if (refreshed) {
          // 重新发送原请求
          return axios.request(error.config)
        }
      }
      return Promise.reject(error)
    }
  )

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    refreshTokens,
    getCurrentUser,
    initializeAuth
  }
})
