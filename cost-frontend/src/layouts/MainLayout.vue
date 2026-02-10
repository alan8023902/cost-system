<template>
  <div class="workbench-layout">
    <!-- Left Navigation -->
    <aside 
      class="workbench-left-nav"
      :class="{ collapsed: navCollapsed, open: mobileMenuOpen }"
    >
      <div class="nav-header">
        <div class="brand">
          <el-icon :size="28"><Document /></el-icon>
          <transition name="fade">
            <span v-show="!navCollapsed" class="brand-text">成本管控</span>
          </transition>
        </div>
        <el-button
          text
          :icon="navCollapsed ? Expand : Fold"
          @click="toggleNav"
          class="collapse-btn lg:block md:hidden"
        />
      </div>

      <el-scrollbar class="nav-scrollbar">
        <nav class="nav-menu">
          <div class="nav-section">
            <div v-show="!navCollapsed" class="nav-section-title">工作台</div>
            <router-link
              to="/projects"
              class="nav-item"
              :class="{ active: isActive('/projects') }"
            >
              <el-icon><Folder /></el-icon>
              <span v-show="!navCollapsed">项目管理</span>
            </router-link>
            
            <router-link
              to="/tasks"
              class="nav-item"
              :class="{ active: isActive('/tasks') }"
            >
              <el-icon><Calendar /></el-icon>
              <span v-show="!navCollapsed">我的待办</span>
              <el-badge 
                v-if="taskCount > 0 && !navCollapsed" 
                :value="taskCount" 
                class="task-badge"
              />
            </router-link>
          </div>

          <div class="nav-section">
            <div v-show="!navCollapsed" class="nav-section-title">配置</div>
            <router-link
              to="/templates"
              class="nav-item"
              :class="{ active: isActive('/templates') }"
            >
              <el-icon><Document /></el-icon>
              <span v-show="!navCollapsed">模板管理</span>
            </router-link>
            
            <router-link
              to="/workflows"
              class="nav-item"
              :class="{ active: isActive('/workflows') }"
            >
              <el-icon><Connection /></el-icon>
              <span v-show="!navCollapsed">工作流</span>
            </router-link>
          </div>

          <div class="nav-section" v-if="hasAdminPermission">
            <div v-show="!navCollapsed" class="nav-section-title">系统</div>
            <router-link
              to="/users"
              class="nav-item"
              :class="{ active: isActive('/users') }"
            >
              <el-icon><User /></el-icon>
              <span v-show="!navCollapsed">用户管理</span>
            </router-link>
          </div>
        </nav>
      </el-scrollbar>

      <div class="nav-footer">
        <div class="user-info" :class="{ collapsed: navCollapsed }">
          <el-avatar :size="36" :src="userAvatar">
            {{ userInitial }}
          </el-avatar>
          <transition name="fade">
            <div v-show="!navCollapsed" class="user-details">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
          </transition>
        </div>
      </div>
    </aside>

    <!-- Mobile Menu Backdrop -->
    <div 
      v-if="mobileMenuOpen" 
      class="mobile-backdrop"
      @click="closeMobileMenu"
    />

    <!-- Main Content Area -->
    <div class="workbench-main">
      <!-- Top Header -->
      <header class="workbench-header">
        <div class="header-left">
          <el-button
            text
            :icon="Menu"
            @click="toggleMobileMenu"
            class="mobile-menu-btn md:block lg:hidden"
          />
          <div class="header-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item 
                v-for="(item, index) in breadcrumbs" 
                :key="index"
                :to="item.path"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="header-right">
          <el-tooltip content="通知" placement="bottom">
            <el-badge :value="notificationCount" :hidden="notificationCount === 0">
              <el-button text :icon="Bell" />
            </el-badge>
          </el-tooltip>

          <el-dropdown @command="handleUserCommand" trigger="click">
            <el-button text class="user-dropdown-btn">
              <el-avatar :size="32" :src="userAvatar">
                {{ userInitial }}
              </el-avatar>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <div class="dropdown-user-info">
                    <div class="dropdown-user-name">{{ userName }}</div>
                    <div class="dropdown-user-email">{{ userEmail }}</div>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="profile">
                  <el-icon><User /></el-icon> 个人设置
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon> 修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page Content -->
      <main class="workbench-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Bell,
  Calendar,
  Connection,
  Document,
  Expand,
  Fold,
  Folder,
  Lock,
  Menu,
  SwitchButton,
  User
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Navigation State
const navCollapsed = ref(false)
const mobileMenuOpen = ref(false)

// User Info
const userName = computed(() => authStore.user?.username || '未登录用户')
const userEmail = computed(() => authStore.user?.email || '未设置邮箱')
const userRole = computed(() => '系统管理员') // TODO: Get from user permissions
const userAvatar = computed(() => authStore.user?.avatar || '')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

// Permissions
const hasAdminPermission = computed(() => {
  // TODO: Check actual permissions
  return true
})

// Notifications & Tasks
const notificationCount = ref(0)
const taskCount = ref(0)

// Breadcrumbs
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  const crumbs: Array<{ title: string; path: string }> = [
    { title: '首页', path: '/' }
  ]

  const nameMap: Record<string, string> = {
    projects: '项目管理',
    templates: '模板管理',
    workflows: '工作流',
    tasks: '我的待办',
    users: '用户管理'
  }

  let currentPath = ''
  paths.forEach((path) => {
    currentPath += `/${path}`
    crumbs.push({
      title: nameMap[path] || path,
      path: currentPath
    })
  })

  return crumbs
})

// Navigation Methods
const toggleNav = () => {
  navCollapsed.value = !navCollapsed.value
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

// User Dropdown Actions
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: Open profile dialog
      ElMessage.info('个人设置功能开发中')
      break
    case 'password':
      // TODO: Open password change dialog
      ElMessage.info('修改密码功能开发中')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '确认退出',
      {
        confirmButtonText: '退出',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/auth/login')
  } catch (error) {
    // User cancelled
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-tokens.scss';

.workbench-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: $neutral-50;
}

// Left Navigation
.workbench-left-nav {
  width: $left-nav-width;
  background: $neutral-0;
  border-right: 1px solid $border-light;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width $transition-base;
  position: relative;
  z-index: $z-fixed;

  &.collapsed {
    width: $left-nav-collapsed-width;
  }
}

.nav-header {
  height: $header-height;
  padding: 0 $space-4;
  border-bottom: 1px solid $border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: $space-3;
  color: $primary-600;
  font-weight: $font-semibold;
  font-size: $text-lg;

  .brand-text {
    white-space: nowrap;
  }
}

.collapse-btn {
  font-size: 18px;
  color: $text-tertiary;

  &:hover {
    color: $primary-600;
  }
}

.nav-scrollbar {
  flex: 1;
  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.nav-menu {
  padding: $space-4 0;
}

.nav-section {
  margin-bottom: $space-6;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-section-title {
  padding: 0 $space-4 $space-2;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-4;
  margin: 0 $space-2;
  border-radius: $radius-md;
  color: $text-secondary;
  font-size: $text-base;
  text-decoration: none;
  transition: all $transition-fast;
  position: relative;

  .el-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    white-space: nowrap;
  }

  &:hover {
    background: $bg-hover;
    color: $primary-600;
  }

  &.active {
    background: $primary-50;
    color: $primary-700;
    font-weight: $font-medium;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      bottom: 20%;
      width: 3px;
      background: $primary-600;
      border-radius: 0 2px 2px 0;
    }
  }
}

.task-badge {
  :deep(.el-badge__content) {
    transform: translateY(0);
  }
}

.nav-footer {
  padding: $space-4;
  border-top: 1px solid $border-light;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $bg-hover;
  }

  &.collapsed {
    justify-content: center;
  }
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: $text-xs;
  color: $text-tertiary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Main Content
.workbench-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.workbench-header {
  height: $header-height;
  background: $neutral-0;
  border-bottom: 1px solid $border-light;
  padding: 0 $space-6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $space-4;
  flex: 1;
  min-width: 0;
}

.mobile-menu-btn {
  font-size: 20px;
  display: none;
}

.header-breadcrumb {
  flex: 1;
  min-width: 0;

  :deep(.el-breadcrumb__inner) {
    color: $text-secondary;
    font-weight: $font-normal;

    &.is-link:hover {
      color: $primary-600;
    }
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: $text-primary;
    font-weight: $font-medium;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.user-dropdown-btn {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-1 $space-2;

  &:hover {
    background: $bg-hover;
  }
}

.dropdown-user-info {
  padding: $space-2 0;
}

.dropdown-user-name {
  font-weight: $font-medium;
  color: $text-primary;
  margin-bottom: 2px;
}

.dropdown-user-email {
  font-size: $text-xs;
  color: $text-tertiary;
}

.workbench-content {
  flex: 1;
  overflow-y: auto;
  background: $neutral-50;
}

// Responsive - Tablet & Mobile
@media (max-width: $breakpoint-lg) {
  .workbench-left-nav {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform $transition-base;
    box-shadow: $shadow-xl;

    &.open {
      transform: translateX(0);
    }
  }

  .mobile-menu-btn {
    display: flex !important;
  }

  .workbench-header {
    padding: 0 $space-4;
  }
}

.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-modal-backdrop;
  display: none;

  @media (max-width: $breakpoint-lg) {
    display: block;
  }
}

// Animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
