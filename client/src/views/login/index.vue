<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <h2>测试管理平台</h2>
        <p>Test Management Platform</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <p>默认账号: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  const savedUsername = localStorage.getItem('savedUsername')
  const savedPassword = localStorage.getItem('savedPassword')
  if (savedUsername && savedPassword) {
    form.username = savedUsername
    form.password = savedPassword
    rememberMe.value = true
  }
})

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.username, form.password)

    if (rememberMe.value) {
      localStorage.setItem('savedUsername', form.username)
      localStorage.setItem('savedPassword', form.password)
    } else {
      localStorage.removeItem('savedUsername')
      localStorage.removeItem('savedPassword')
    }

    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-tips {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-tips p {
  color: #999;
  font-size: 12px;
}
</style>
