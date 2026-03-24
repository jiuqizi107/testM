<template>
  <div class="testcases-page">
    <div class="page-header">
      <h2>测试用例库</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-select v-model="searchForm.project_id" placeholder="选择项目" clearable style="width: 150px" @change="fetchData">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px" @change="fetchData">
            <el-option label="草稿" value="draft" />
            <el-option label="待执行" value="pending" />
            <el-option label="通过" value="passed" />
            <el-option label="失败" value="failed" />
            <el-option label="阻塞" value="blocked" />
          </el-select>
          <el-select v-model="searchForm.priority" placeholder="优先级" clearable style="width: 100px" @change="fetchData">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
          <el-input v-model="searchForm.keyword" placeholder="搜索用例" clearable style="width: 180px" @clear="fetchData" @keyup.enter="fetchData" />
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新建用例
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="title" label="用例标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="project_name" label="项目" width="120" show-overflow-tooltip />
        <el-table-column prop="requirement_title" label="关联需求" width="120" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityMap[row.priority]" size="small">{{ priorityText[row.priority] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
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
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑用例' : '新建用例'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属项目" prop="project_id">
              <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%" @change="handleProjectChange">
                <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联需求" prop="requirement_id">
              <el-select v-model="form.requirement_id" placeholder="请选择需求" style="width: 100%" clearable>
                <el-option v-for="r in filteredRequirements" :key="r.id" :label="r.title" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用例标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入用例标题" />
        </el-form-item>
        <el-form-item label="前置条件" prop="pre_condition">
          <el-input v-model="form.pre_condition" type="textarea" :rows="2" placeholder="请输入前置条件" />
        </el-form-item>
        <el-form-item label="测试步骤" prop="steps">
          <el-input v-model="form.steps" type="textarea" :rows="4" placeholder="请输入测试步骤" />
        </el-form-item>
        <el-form-item label="预期结果" prop="expected_result">
          <el-input v-model="form.expected_result" type="textarea" :rows="2" placeholder="请输入预期结果" />
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
                <el-option label="草稿" value="draft" />
                <el-option label="待执行" value="pending" />
                <el-option label="通过" value="passed" />
                <el-option label="失败" value="failed" />
                <el-option label="阻塞" value="blocked" />
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
const requirements = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ project_id: '', status: '', priority: '', keyword: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const form = reactive({
  project_id: '',
  requirement_id: '',
  title: '',
  pre_condition: '',
  steps: '',
  expected_result: '',
  priority: 'medium',
  status: 'draft'
})
const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  title: [{ required: true, message: '请输入用例标题', trigger: 'blur' }]
}

const priorityMap = { high: 'danger', medium: 'warning', low: 'info' }
const priorityText = { high: '高', medium: '中', low: '低' }
const statusMap = { draft: 'info', pending: 'warning', passed: 'success', failed: 'danger', blocked: 'info' }
const statusText = { draft: '草稿', pending: '待执行', passed: '通过', failed: '失败', blocked: '阻塞' }

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
    const res = await request.get('/testcases', { params: { ...searchForm, ...pagination } })
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

async function fetchRequirements() {
  const res = await request.get('/requirements', { params: { pageSize: 100 } })
  requirements.value = res.list
}

function handleAdd() {
  editId.value = null
  Object.assign(form, {
    project_id: '',
    requirement_id: '',
    title: '',
    pre_condition: '',
    steps: '',
    expected_result: '',
    priority: 'medium',
    status: 'draft'
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    project_id: row.project_id,
    requirement_id: row.requirement_id,
    title: row.title,
    pre_condition: row.pre_condition,
    steps: row.steps,
    expected_result: row.expected_result,
    priority: row.priority,
    status: row.status
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该用例吗？', '提示', { type: 'warning' })
  await request.delete(`/testcases/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (editId.value) {
    await request.put(`/testcases/${editId.value}`, form)
    ElMessage.success('更新成功')
  } else {
    await request.post('/testcases', form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchProjects()
  fetchRequirements()
})
</script>
