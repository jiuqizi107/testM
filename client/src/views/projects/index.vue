<template>
  <div class="projects-page">
    <div class="page-header">
      <h2>项目管理</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-input v-model="searchForm.keyword" placeholder="搜索项目名称/描述" clearable style="width: 200px" @clear="fetchData" @keyup.enter="fetchData" />
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px" @change="fetchData">
            <el-option label="进行中" value="active" />
            <el-option label="已归档" value="archived" />
            <el-option label="已暂停" value="paused" />
          </el-select>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新建项目
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="owner_name" label="负责人" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计" width="200">
          <template #default="{ row }">
            <span>需求: {{ row.requirementCount }}</span>
            <el-divider direction="vertical" />
            <span>用例: {{ row.testcaseCount }}</span>
            <el-divider direction="vertical" />
            <span>缺陷: {{ row.defectCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑项目' : '新建项目'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner_id">
          <el-select v-model="form.owner_id" placeholder="请选择负责人" style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="进行中" value="active" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api'

const loading = ref(false)
const tableData = ref([])
const users = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ keyword: '', status: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()

const form = reactive({ name: '', description: '', owner_id: '', status: 'active' })
const rules = { name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] }

const statusMap = { active: 'success', paused: 'warning', archived: 'info' }
const statusText = { active: '进行中', paused: '已暂停', archived: '已归档' }

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/projects', {
      params: { ...searchForm, ...pagination }
    })
    tableData.value = res.list
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  const res = await request.get('/auth/users')
  users.value = res
}

function handleAdd() {
  editId.value = null
  Object.assign(form, { name: '', description: '', owner_id: '', status: 'active' })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    description: row.description,
    owner_id: row.owner_id,
    status: row.status
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该项目吗？相关数据将被一并删除', '提示', { type: 'warning' })
  await request.delete(`/projects/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (editId.value) {
    await request.put(`/projects/${editId.value}`, form)
    ElMessage.success('更新成功')
  } else {
    await request.post('/projects', form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchUsers()
})
</script>
