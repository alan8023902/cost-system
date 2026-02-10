<template>
  <div class="forgot-password-container">
    <div class="forgot-password-shell">
      <div class="brand-block">
        <router-link to="/login" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回登录</span>
        </router-link>
        <div class="brand-icon">
          <el-icon><Lock /></el-icon>
        </div>
        <h1 class="brand-title">重置密码</h1>
        <p class="brand-subtitle">通过邮箱验证码重置密码</p>
      </div>

      <div class="forgot-card">
        <el-form
          ref="forgotFormRef"
          :model="forgotForm"
          :rules="forgotRules"
          class="forgot-form"
          label-position="top"
        >
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="forgotForm.email"
              placeholder="请输入注册邮箱"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input
                v-model="forgotForm.code"
                placeholder="请输入6位验证码"
                maxlength="6"
                size="large"
              />
              <el-button
                size="large"
                :loading="sendingCode"
                :disabled="codeCooldown > 0"
                @click="handleSendCode"
                class="send-code-btn"
              >
                {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="forgotForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              size="large"
              :prefix-icon="Key"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="forgotForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              :prefix-icon="Key"
              show-password
              @keyup.enter="handleResetPassword"
            />
          </el-form-item>

          <div
            v-if="errorMessage"
            class="error-message"
          >
            <el-icon class="error-icon"><InfoFilled /></el-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="resettingPassword"
              class="reset-button"
              @click="handleResetPassword"
            >
              {{ resettingPassword ? '重置中...' : '重置密码' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="help-text">
          <el-icon><QuestionFilled /></el-icon>
          <span>未收到验证码？请检查垃圾箱或联系管理员。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { ArrowLeft, InfoFilled, Key, Lock, Message, QuestionFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const forgotFormRef = ref<FormInstance>()

const sendingCode = ref(false)
const resettingPassword = ref(false)
const errorMessage = ref('')

const codeCooldown = ref(0)
let cooldownTimer: number | null = null

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码必须为6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== forgotForm.newPassword) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const startCooldown = () => {
  codeCooldown.value = 60
  if (cooldownTimer) {
    window.clearInterval(cooldownTimer)
  }

  cooldownTimer = window.setInterval(() => {
    if (codeCooldown.value > 0) {
      codeCooldown.value -= 1
    }

    if (codeCooldown.value <= 0 && cooldownTimer) {
      window.clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!forgotFormRef.value) {
    return
  }

  try {
    await forgotFormRef.value.validateField('email')
  } catch {
    return
  }

  sendingCode.value = true
  errorMessage.value = ''

  try {
    await axios.post('/api/auth/password/email-code', {
      email: forgotForm.email
    })
    ElMessage.success('验证码已发送')
    startCooldown()
  } catch (error: any) {
    const msg = error.response?.data?.message || '发送验证码失败'
    errorMessage.value = msg
    ElMessage.error(msg)
  } finally {
    sendingCode.value = false
  }
}

const handleResetPassword = async () => {
  if (!forgotFormRef.value) {
    return
  }

  await forgotFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    resettingPassword.value = true
    errorMessage.value = ''

    try {
      await axios.post('/api/auth/password/reset', {
        email: forgotForm.email,
        code: forgotForm.code,
        newPassword: forgotForm.newPassword,
        confirmPassword: forgotForm.confirmPassword
      })
      ElMessage.success('密码重置成功')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (error: any) {
      const msg = error.response?.data?.message || '重置密码失败'
      errorMessage.value = msg
      ElMessage.error(msg)
    } finally {
      resettingPassword.value = false
    }
  })
}

onBeforeUnmount(() => {
  if (cooldownTimer) {
    window.clearInterval(cooldownTimer)
  }
})
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';
@import '../styles/ui-standard.scss';

.forgot-password-container {
  min-height: 100vh;
  background: $neutral-100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.forgot-password-shell {
  width: 100%;
  max-width: 480px;
}

.brand-block {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
}

.back-link {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: $primary-600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    color: $primary-700;
    transform: translateX(-2px);
  }
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 12px;
  background: $primary-600;
  box-shadow: 0 10px 20px rgba($primary-600, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.brand-title {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
}

.brand-subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: $text-secondary;
}

.forgot-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid $border-light;
  box-shadow: $shadow-lg;
  padding: 32px;
}

.forgot-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.forgot-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8px;
}

.forgot-form :deep(.el-input__wrapper) {
  background: $neutral-50;
  box-shadow: 0 0 0 1px $border-light inset;
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s ease;
  
  &:hover {
     background: #fff;
     box-shadow: 0 0 0 1px $primary-300 inset;
  }
  
  &.is-focus {
     background: #fff;
     box-shadow: 0 0 0 2px $primary-500 inset !important;
  }
}

.code-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  
  .send-code-btn {
    min-width: 120px;
    border-radius: 8px;
  }
}

.error-message {
  margin-bottom: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 12px;
  color: #dc2626;
  font-size: 13px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.reset-button {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  background-color: $primary-600;
  border-color: $primary-600;
  
  &:hover {
    background-color: $primary-700;
    border-color: $primary-700;
  }
  
  &:active {
    background-color: $primary-800;
  }
}

.help-text {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid $border-light;
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-secondary;
  font-size: 13px;
  
  .el-icon {
    font-size: 16px;
  }
}

// Responsive
@include mobile {
  .forgot-password-container {
    padding: 16px;
    align-items: flex-start;
  }

  .forgot-password-shell {
    margin-top: 40px;
  }

  .forgot-card {
    padding: 24px;
  }

  .code-row {
    grid-template-columns: 1fr;
    gap: 8px;
    
    .send-code-btn {
      width: 100%;
    }
  }

  .back-link {
    position: static;
    justify-content: center;
    margin-bottom: 24px;
    display: flex;
  }
}
</style>