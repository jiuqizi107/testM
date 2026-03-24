<template>
  <div class="versions-page">
    <div class="page-header">
      <h2>版本管理</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-select v-model="searchForm.project_id" placeholder="选择项目" clearable style="width: 150px" @change="fetchData">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px" @change="fetchData">
            <el-option label="开发中" value="developing" />
            <el-option label="测试中" value="testing" />
            <el-option label="已发布" value="released" />
          </el-select>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新建版本
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="版本号" width="120" />
        <el-table-column prop="project_name" label="所属项目" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="release_date" label="发布日期" width="120" />
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
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑版本' : '新建版本'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="name">
          <el-input v-model="form.name" placeholder="例如: v1.0.0" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入版本描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="开发中" value="developing" />
                <el-option label="测试中" value="testing" />
                <el-option label="已发布" value="released" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布日期" prop="release_date">
              <el-date-picker v-model="form.release_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
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
const projects = ref([])

const searchForm = reactive({ project_id: '', status: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const form = reactive({ project_id: '', name: '', description: '', status: 'developing', release_date: '' })
const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  name: [{ required: true, message: '请输入版本号', trigger: 'blur' }]
}

const statusMap = { developing: 'info', testing: 'warning', released: 'success' }
const statusText = { developing: '开发中', testing: '测试中', released: '已发布' }

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/versions', { params: searchForm })
    tableData.value = res
  } finally {
    loading.value = false
  }
}

async function fetchProjects() {
  const res = await request.get('/projects', { params: { pageSize: 100 } })
  projects.value = res.list
}

function handleAdd() {
  editId.value = null
  Object.assign(form, { project_id: '', name: '', description: '', status: 'developing', release_date: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    project_id: row.project_id,
    name: row.name,
    description: row.description,
    status: row.status,
    release_date: row.release_date
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该版本吗？', '提示', { type: 'warning' })
  await request.delete(`/versions/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (editId.value) {
    await request.put(`/versions/${editId.value}`, form)
    ElMessage.success('更新成功')
  } else {
    await request.post('/versions', form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchProjects()
})
</script>
