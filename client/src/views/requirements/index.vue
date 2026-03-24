<template>
  <div class="requirements-page">
    <div class="page-header">
      <h2>需求管理</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-select v-model="searchForm.project_id" placeholder="选择项目" clearable style="width: 150px" @change="fetchData">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px" @change="fetchData">
            <el-option label="待处理" value="pending" />
            <el-option label="已提测" value="submitted" />
            <el-option label="测试中" value="testing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-select v-model="searchForm.priority" placeholder="优先级" clearable style="width: 100px" @change="fetchData">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
          <el-input v-model="searchForm.keyword" placeholder="搜索需求" clearable style="width: 180px" @clear="fetchData" @keyup.enter="fetchData" />
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新建需求
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="title" label="需求标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="project_name" label="项目" width="120" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityMap[row.priority]" size="small">{{ priorityText[row.priority] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="负责人" width="100" />
        <el-table-column prop="submitter_name" label="提测人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="primary" @click="handleAssign(row)">分配</el-button>
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
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑需求' : '新建需求'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入需求标题" />
        </el-form-item>
        <el-form-item label="需求描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入需求描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="待处理" value="pending" />
                <el-option label="已提测" value="submitted" />
                <el-option label="测试中" value="testing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="负责人" prop="assignee_id">
          <el-select v-model="form.assignee_id" placeholder="请选择负责人" clearable style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配负责人" width="400px">
      <el-form label-width="80px">
        <el-form-item label="需求">
          <span>{{ currentRequirement?.title }}</span>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="assignForm.assignee_id" placeholder="请选择负责人" style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
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
const projects = ref([])
const users = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ project_id: '', status: '', priority: '', keyword: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const form = reactive({ project_id: '', title: '', description: '', priority: 'medium', status: 'pending', assignee_id: '' })
const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }]
}

const assignDialogVisible = ref(false)
const currentRequirement = ref(null)
const assignForm = reactive({ assignee_id: '' })

const priorityMap = { high: 'danger', medium: 'warning', low: 'info' }
const priorityText = { high: '高', medium: '中', low: '低' }
const statusTypeMap = { pending: 'info', submitted: 'warning', testing: 'primary', completed: 'success', closed: 'info' }
const statusText = { pending: '待处理', submitted: '已提测', testing: '测试中', completed: '已完成', closed: '已关闭' }

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/requirements', { params: { ...searchForm, ...pagination } })
    tableData.value = res.list
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

async function fetchProjects() {
  const res = await request.get('/projects', { params: { pageSize: 100 } })
  projects.value = res.list
}

async function fetchUsers() {
  const res = await request.get('/auth/users')
  users.value = res
}

function handleAdd() {
  editId.value = null
  Object.assign(form, { project_id: '', title: '', description: '', priority: 'medium', status: 'pending', assignee_id: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    assignee_id: row.assignee_id
  })
  dialogVisible.value = true
}

function handleAssign(row) {
  currentRequirement.value = row
  assignForm.assignee_id = row.assignee_id || ''
  assignDialogVisible.value = true
}

async function handleAssignSubmit() {
  if (!assignForm.assignee_id) {
    ElMessage.warning('请选择负责人')
    return
  }
  await request.post(`/requirements/${currentRequirement.value.id}/assign`, assignForm)
  ElMessage.success('分配成功')
  assignDialogVisible.value = false
  fetchData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该需求吗？', '提示', { type: 'warning' })
  await request.delete(`/requirements/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (editId.value) {
    await request.put(`/requirements/${editId.value}`, form)
    ElMessage.success('更新成功')
  } else {
    await request.post('/requirements', form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchProjects()
  fetchUsers()
})
</script>
