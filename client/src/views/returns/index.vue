<template>
  <div class="returns-page">
    <div class="page-header">
      <h2>退回台账</h2>
    </div>

    <div class="stat-card">
      <!-- 工具栏 -->
      <div class="table-toolbar">
        <div class="search-form">
          <el-select v-model="searchForm.project_id" placeholder="选择项目" clearable style="width: 150px" @change="fetchData">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增记录
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="requirement_title" label="需求标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="version_name" label="版本" width="100" />
        <el-table-column prop="reason" label="退回原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column prop="return_date" label="退回日期" width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
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

    <!-- 新增对话框 -->
    <el-dialog v-model="dialogVisible" title="新增退回记录" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="需求" prop="requirement_id">
          <el-select v-model="form.requirement_id" placeholder="请选择需求" style="width: 100%" filterable>
            <el-option v-for="r in requirements" :key="r.id" :label="r.title" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="version_id">
          <el-select v-model="form.version_id" placeholder="请选择版本" style="width: 100%" clearable>
            <el-option v-for="v in versions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="退回原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请输入退回原因" />
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
const projects = ref([])
const requirements = ref([])
const versions = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ project_id: '' })

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ requirement_id: '', version_id: '', reason: '' })
const rules = {
  requirement_id: [{ required: true, message: '请选择需求', trigger: 'change' }],
  reason: [{ required: true, message: '请输入退回原因', trigger: 'blur' }]
}

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/returns', { params: { ...searchForm, ...pagination } })
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

async function fetchVersions() {
  const res = await request.get('/versions')
  versions.value = res
}

function handleAdd() {
  Object.assign(form, { requirement_id: '', version_id: '', reason: '' })
  dialogVisible.value = true
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该记录吗？', '提示', { type: 'warning' })
  await request.delete(`/returns/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  await request.post('/returns', form)
  ElMessage.success('创建成功')
  dialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchProjects()
  fetchRequirements()
  fetchVersions()
})
</script>
