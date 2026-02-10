<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex-center">
         <h1>用户管理</h1>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新增用户
      </el-button>
    </div>

    <div class="page-content">
       <div class="filter-bar mb-16 flex-center">
         <el-input 
           v-model="search" 
           placeholder="搜索用户名或邮箱" 
           style="width: 300px" 
           :prefix-icon="Search" 
           clearable 
         />
       </div>

       <el-table :data="filteredUsers" v-loading="loading" style="width: 100%">
         <el-table-column prop="username" label="用户" min-width="180">
            <template #default="{ row }">
              <div class="flex-center" style="justify-content: flex-start">
                 <el-avatar :size="32" class="mr-8">{{ row.username.charAt(0).toUpperCase() }}</el-avatar>
                 <div>
                   <div class="font-bold">{{ row.username }}</div>
                   <div class="text-secondary text-xs">{{ row.email || '未设置邮箱' }}</div>
                 </div>
              </div>
            </template>
         </el-table-column>
         <el-table-column prop="department" label="部门" width="150" />
         <el-table-column label="角色" min-width="200">
           <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role" size="small" class="mr-4">{{ getRoleLabel(role) }}</el-tag>
          </template>
        </el-table-column>
         <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small" effect="plain">
                {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
            </template>
         </el-table-column>
         <el-table-column label="操作" width="150" fixed="right">
           <template #default="{ row }">
             <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
             <el-popconfirm title="确定停用该用户吗？" @confirm="handleDelete(row)">
               <template #reference>
                 <el-button link type="danger">停用</el-button>
               </template>
             </el-popconfirm>
           </template>
         </el-table-column>
       </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
       <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="用户名" prop="username">
             <el-input v-model="form.username" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
             <el-input v-model="form.email" />
          </el-form-item>
          <el-form-item label="部门" prop="department">
             <el-select v-model="form.department" style="width: 100%">
               <el-option label="工程部" value="Engineering" />
               <el-option label="财务部" value="Finance" />
               <el-option label="管理部" value="Management" />
             </el-select>
          </el-form-item>
          <el-form-item label="角色">
             <el-checkbox-group v-model="form.roles">
                <el-checkbox label="ADMIN">管理员</el-checkbox>
                <el-checkbox label="PROJECT_MANAGER">项目经理</el-checkbox>
                <el-checkbox label="COST_ENGINEER">成本工程师</el-checkbox>
                <el-checkbox label="VIEWER">查看者</el-checkbox>
             </el-checkbox-group>
          </el-form-item>
          <el-form-item label="状态" v-if="isEdit">
             <el-radio-group v-model="form.status">
               <el-radio label="ACTIVE">启用</el-radio>
               <el-radio label="INACTIVE">停用</el-radio>
             </el-radio-group>
          </el-form-item>
       </el-form>
       <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
       </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useUserStore, type User } from '../stores/user'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'

const store = useUserStore()
const loading = computed(() => store.loading)
const users = computed(() => store.users)

const search = ref('')
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
  department: '',
  roles: [] as string[],
  status: 'ACTIVE'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

const roleLabelMap: Record<string, string> = {
  ADMIN: '管理员',
  PROJECT_MANAGER: '项目经理',
  COST_ENGINEER: '成本工程师',
  VIEWER: '查看者'
}

const getRoleLabel = (role: string) => {
  return roleLabelMap[role] || role
}

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const lower = search.value.toLowerCase()
  return users.value.filter(u => 
    u.username.toLowerCase().includes(lower) || 
    (u.email && u.email.toLowerCase().includes(lower))
  )
})

onMounted(() => {
  store.fetchUsers()
})

const handleCreate = () => {
  isEdit.value = false
  currentId.value = null
  form.username = ''
  form.email = ''
  form.department = 'Engineering'
  form.roles = ['COST_ENGINEER']
  form.status = 'ACTIVE'
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  isEdit.value = true
  currentId.value = row.id
  form.username = row.username
  form.email = row.email || ''
  form.department = row.department || 'Engineering'
  form.roles = row.roles || []
  form.status = row.status || 'ACTIVE'
  dialogVisible.value = true
}

const handleDelete = async (row: User) => {
  await store.deleteUser(row.id)
  ElMessage.success('用户已停用')
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value && currentId.value) {
          await store.updateUser(currentId.value, {
             email: form.email,
             department: form.department,
             roles: form.roles,
             status: form.status as any
          })
          ElMessage.success('用户已更新')
        } else {
          await store.createUser({
            username: form.username,
            email: form.email,
            department: form.department,
            roles: form.roles
          })
          ElMessage.success('用户已创建')
        }
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>