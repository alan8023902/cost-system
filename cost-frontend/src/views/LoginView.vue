<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Brand Section -->
      <div class="brand-section">
        <div class="brand-icon" aria-label="工程成本管控系统">
          <svg class="brand-logo" viewBox="0 0 64 64" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#2563eb" />
                <stop offset="100%" stop-color="#1d4ed8" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#logoGradient)" />
            <path d="M22 24h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V28a4 4 0 0 1 4-4Z" fill="#ffffff" opacity="0.95" />
            <path d="M24 32h16M24 38h10" stroke="#1d4ed8" stroke-width="3" stroke-linecap="round" />
            <circle cx="44" cy="38" r="4" fill="#fbbf24" />
          </svg>
        </div>
        <h1 class="brand-title">工程成本管控系统</h1>
        <p class="brand-subtitle">工程成本计划与税务计控平台</p>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2>登录</h2>
          <p>使用您的账号登录系统</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名 / 手机号 / 邮箱"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-actions">
            <el-checkbox v-model="rememberLogin">
              记住登录状态
            </el-checkbox>
            <router-link to="/auth/forgot-password" class="forgot-link">
              忘记密码?
            </router-link>
          </div>

          <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="error"
            :closable="false"
            show-icon
            class="error-alert"
          />

          <el-form-item class="submit-item">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              native-type="submit"
              @click.prevent="handleLogin"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p class="tip">
            <el-icon><InfoFilled /></el-icon>
            首次登录请联系管理员获取账号
          </p>
        </div>
      </div>

      <!-- Copyright -->
      <div class="copyright">
        © {{ currentYear }} 工程建设集团 版权所有
      </div>
    </div>

    <!-- Background Decoration -->
    <div class="bg-decoration">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { InfoFilled, Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const errorMessage = ref('')
const rememberLogin = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名/手机号/邮箱', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const currentYear = computed(() => new Date().getFullYear())

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    errorMessage.value = ''

    try {
      const result = await authStore.login(loginForm.username, loginForm.password)

      if (result.success) {
        ElMessage.success({
          message: '登录成功',
          duration: 2000
        })
        
        setTimeout(() => {
          router.push('/projects')
        }, 500)
      } else {
        errorMessage.value = result.message || '登录失败，请检查用户名和密码'
      }
    } catch (error: any) {
      errorMessage.value = error.message || '网络错误，请稍后重试'
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
@import '../styles/design-tokens.scss';

.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: $space-6;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
}

.brand-section {
  text-align: center;
  margin-bottom: $space-8;
}

.brand-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto $space-4;
  background: rgba(255, 255, 255, 0.95);
  border-radius: $radius-xl;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary-600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
}

.brand-logo {
  width: 42px;
  height: 42px;
}

.brand-title {
  font-size: $text-3xl;
  font-weight: $font-bold;
  color: $neutral-0;
  margin: 0 0 $space-2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.brand-subtitle {
  font-size: $text-base;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: $radius-2xl;
  padding: $space-10 $space-8;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
}

.card-header {
  text-align: center;
  margin-bottom: $space-8;

  h2 {
    font-size: $text-2xl;
    font-weight: $font-semibold;
    color: $text-primary;
    margin: 0 0 $space-2;
  }

  p {
    font-size: $text-sm;
    color: $text-tertiary;
    margin: 0;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: $space-5;
  }
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: $space-1 0 $space-6;
}

.forgot-link {
  font-size: $text-sm;
  color: $primary-600;
  font-weight: $font-medium;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.error-alert {
  margin-bottom: $space-5;
}

.submit-item {
  margin-bottom: 0;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: $text-md;
  font-weight: $font-semibold;
}

.login-footer {
  margin-top: $space-6;
  padding-top: $space-6;
  border-top: 1px solid $border-light;

  .tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    font-size: $text-sm;
    color: $text-tertiary;
    margin: 0;
  }
}

.copyright {
  text-align: center;
  margin-top: $space-8;
  font-size: $text-sm;
  color: rgba(255, 255, 255, 0.8);
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.shape-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  left: -200px;
}

.shape-2 {
  width: 400px;
  height: 400px;
  bottom: -150px;
  right: -150px;
}

.shape-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  right: -100px;
}

@media (max-width: $breakpoint-md) {
  .login-page {
    padding: $space-4;
  }

  .login-card {
    padding: $space-8 $space-6;
  }

  .brand-title {
    font-size: $text-2xl;
  }
}
</style>
