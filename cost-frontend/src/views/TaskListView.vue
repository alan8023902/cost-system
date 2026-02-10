<template>
  <div class="page-container">
    <div class="page-header">
      <h1>我的待办</h1>
      <el-button @click="fetchTasks">
        <el-icon class="mr-8"><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="待处理" name="pending">
          <el-table
            v-loading="loading"
            :data="pendingTasks"
            style="width: 100%"
          >
            <el-table-column prop="title" label="任务" min-width="200" />
            <el-table-column prop="description" label="说明" min-width="250" show-overflow-tooltip />
            <el-table-column prop="projectId" label="项目ID" width="100" />
            <el-table-column prop="versionId" label="版本ID" width="100" />
            <el-table-column prop="submitter" label="提交人" width="120" />
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleProcess(row)">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- Placeholder for Completed Tasks if API supported it -->
        <!-- <el-tab-pane label="已完成" name="completed">...</el-tab-pane> -->
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '../stores/workflow'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const store = useWorkflowStore()
const activeTab = ref('pending')

const loading = computed(() => store.loading)
const pendingTasks = computed(() => store.myTasks) // API currently only returns pending

const fetchTasks = () => {
  store.fetchMyTasks()
}

onMounted(() => {
  fetchTasks()
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const handleProcess = (task: any) => {
  // Navigate to version workspace where approval panel is
  router.push(`/projects/${task.projectId}/versions/${task.versionId}`)
}
</script>
