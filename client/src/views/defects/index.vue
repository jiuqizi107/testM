<template>
  <div class="defects-page">
    <div class="page-header">
      <h2>缺陷库</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-select v-model="searchForm.project_id" placeholder="选择项目" clearable style="width: 150px" @change="fetchData">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px" @change="fetchData">
            <el-option label="新建" value="new" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-select v-model="searchForm.severity" placeholder="严重程度" clearable style="width: 100px" @change="fetchData">
            <el-option label="致命" value="critical" />
            <el-option label="严重" value="major" />
            <el-option label="一般" value="normal" />
            <el-option label="轻微" value="minor" />
          </el-select>
          <el-input v-model="searchForm.keyword" placeholder="搜索缺陷" clearable style="width: 180px" @clear="fetchData" @keyup.enter="fetchData" />
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新建缺陷
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="title" label="缺陷标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="project_name" label="项目" width="120" show-overflow-tooltip />
        <el-table-column prop="severity" label="严重程度" width="90">
          <template #default="{ row }">
            <el-tag :type="severityMap[row.severity]" size="small">{{ severityText[row.severity] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityMap[row.priority]" size="small">{{ priorityText[row.priority] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="处理人" width="100" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
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
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑缺陷' : '新建缺陷'" width="650px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%" @change="handleProjectChange">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="缺陷标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入缺陷标题" />
        </el-form-item>
        <el-form-item label="缺陷描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述缺陷现象、复现步骤等" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="form.severity" style="width: 100%">
                <el-option label="致命" value="critical" />
                <el-option label="严重" value="major" />
                <el-option label="一般" value="normal" />
                <el-option label="轻微" value="minor" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="新建" value="new" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="处理中" value="processing" />
                <el-option label="已解决" value="resolved" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="处理人" prop="assignee_id">
              <el-select v-model="form.assignee_id" placeholder="请选择处理人" style="width: 100%" clearable>
                <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联需求" prop="requirement_id">
              <el-select v-model="form.requirement_id" placeholder="请选择关联需求" style="width: 100%" clearable filterable>
                <el-option v-for="r in filteredRequirements" :key="r.id" :label="r.title" :value="r.id" />
              </el-select>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api'

const loading = ref(false)
const tableData = ref([])
const projects = ref([])
const users = ref([])
const requirements = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ project_id: '', status: '', severity: '', keyword: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const form = reactive({
  project_id: '',
  title: '',
  description: '',
  severity: 'major',
  priority: 'medium',
  status: 'new',
  assignee_id: '',
  requirement_id: ''
})
const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  title: [{ required: true, message: '请输入缺陷标题', trigger: 'blur' }]
}

const severityMap = { critical: 'danger', major: 'warning', normal: 'info', minor: 'success' }
const severityText = { critical: '致命', major: '严重', normal: '一般', minor: '轻微' }
const priorityMap = { high: 'danger', medium: 'warning', low: 'info' }
const priorityText = { high: '高', medium: '中', low: '低' }
const statusMap = { new: 'danger', confirmed: 'warning', processing: 'primary', resolved: 'success', closed: 'info' }
const statusText = { new: '新建', confirmed: '已确认', processing: '处理中', resolved: '已解决', closed: '已关闭' }

const filteredRequirements = computed(() => {
  if (!form.project_id) return []
  return requirements.value.filter(r => r.project_id === form.project_id)
})

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function handleProjectChange() {
  form.requirement_id = ''
}

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/defects', { params: { ...searchForm, ...pagination } })
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

async function fetchRequirements() {
  const res = await request.get('/requirements', { params: { pageSize: 100 } })
  requirements.value = res.list
}

function handleAdd() {
  editId.value = null
  Object.assign(form, {
    project_id: '',
    title: '',
    description: '',
    severity: 'major',
    priority: 'medium',
    status: 'new',
    assignee_id: '',
    requirement_id: ''
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    priority: row.priority,
    status: row.status,
    assignee_id: row.assignee_id,
    requirement_id: row.requirement_id
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该缺陷吗？', '提示', { type: 'warning' })
  await request.delete(`/defects/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (editId.value) {
    await request.put(`/defects/${editId.value}`, form)
    ElMessage.success('更新成功')
  } else {
    await request.post('/defects', form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchProjects()
  fetchUsers()
  fetchRequirements()
})
</script>
