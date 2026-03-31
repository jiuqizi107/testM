<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>测试管理平台</h1>
      </div>

      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计仪表盘</span>
        </el-menu-item>

        <el-menu-item index="/workbench">
          <el-icon><User /></el-icon>
          <span>测试工作台</span>
        </el-menu-item>

        <!-- 项目类测试 -->
        <el-sub-menu index="project-test">
          <template #title>
            <el-icon><FolderOpened /></el-icon>
            <span>项目类测试</span>
          </template>
          <el-menu-item index="/project-test/projects">
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item index="/project-test/testcases-project">
            <span>项目用例库</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 日常需求测试 -->
        <el-sub-menu index="daily-test">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>日常需求测试</span>
          </template>
          <el-menu-item index="/daily-test/versions">
            <span>版本管理</span>
          </el-menu-item>
          <el-menu-item index="/daily-test/requirements">
            <span>需求管理</span>
          </el-menu-item>
          <el-menu-item index="/daily-test/testcases-daily">
            <span>日常用例库</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 公共模块 -->
        <el-menu-item index="/defects">
          <el-icon><Warning /></el-icon>
          <span>缺陷库</span>
        </el-menu-item>

        <el-menu-item index="/returns">
          <el-icon><RefreshLeft /></el-icon>
          <span>退回台账</span>
        </el-menu-item>

        <!-- 报表模块 -->
        <el-sub-menu index="reports">
          <template #title>
            <el-icon><DataBoard /></el-icon>
            <span>报表管理</span>
          </template>
          <el-menu-item index="/reports/weekly-reports">
            <span>测试室周报</span>
          </el-menu-item>
          <el-menu-item index="/reports/personal-reports">
            <span>个人工作汇报</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 测试资产库 -->
        <el-sub-menu index="test-assets">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>测试资产库</span>
          </template>
          <el-menu-item index="/test-assets/asset-list">
            <span>资产列表</span>
          </el-menu-item>
          <el-menu-item index="/test-assets/experience-list">
            <span>测试经验库</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- AI智能助手 -->
        <el-sub-menu index="ai-tools">
          <template #title>
            <el-icon><MagicStick /></el-icon>
            <span>AI智能助手</span>
          </template>
          <el-menu-item index="/ai-tools/ai-generate">
            <span>AI用例生成</span>
          </el-menu-item>
          <el-menu-item index="/ai-tools/ai-check">
            <span>AI用例检查</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 系统管理 -->
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user-management">
            <span>用户与权限</span>
          </el-menu-item>
          <el-menu-item index="/system/systems">
            <span>系统字典</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <div class="header">
        <div class="header-left">
          <span class="current-time">{{ currentTime }}</span>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="User" />
              <span style="margin-left: 8px">{{ userStore.userInfo?.real_name }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentTime = ref('')

let timer = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 修改密码
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning'
      })
      userStore.logout()
      router.push('/login')
    } catch {}
  } else if (command === 'password') {
    passwordDialogVisible.value = true
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await request.put('/auth/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    userStore.logout()
    router.push('/login')
  } catch (error) {
    // 错误已在拦截器处理
  }
}
</script>

<style scoped>
.sidebar :deep(.el-menu) {
  border-right: none;
}

.sidebar :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.sidebar :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar :deep(.el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

.header-left {
  font-size: 14px;
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #333;
}

.user-info:hover {
  color: #409eff;
}
</style>
