<template>
  <div class="projects-page">
    <div class="page-header">
      <h2>项目管理</h2>
    </div>

    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="search-form">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索项目编号/名称"
          clearable
          style="width: 200px"
          @clear="fetchData"
          @keyup.enter="fetchData"
          v-model:trim="searchForm.keyword"
        />
        <el-select v-model="searchForm.test_status" placeholder="项目状态" clearable style="width: 150px" @change="fetchData">
          <el-option label="需求分析" value="需求分析" />
          <el-option label="测试用例编写" value="测试用例编写" />
          <el-option label="测试用例已评审" value="测试用例已评审" />
          <el-option label="集成测试" value="集成测试" />
          <el-option label="系统测试" value="系统测试" />
          <el-option label="业务验收测试" value="业务验收测试" />
          <el-option label="已投产" value="已投产" />
          <el-option label="完成复盘" value="完成复盘" />
        </el-select>
        <el-button type="primary" @click="fetchData">查询</el-button>
      </div>
      <el-button v-if="isAdmin" type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增项目
      </el-button>
    </div>

    <!-- 项目Grid展示 -->
    <div class="project-grid" v-loading="loading">
      <div
        v-for="project in tableData"
        :key="project.id"
        class="project-card"
        @click="openProjectDetail(project)"
      >
        <div class="card-header">
          <span class="project-code" @click.stop="openProjectDetail(project)">{{ project.project_code }}</span>
          <el-tag :type="testStatusTypeMap[project.test_status]" size="small">{{ project.test_status || '需求分析' }}</el-tag>
        </div>
        <div class="card-body">
          <div class="project-name">{{ project.name }}</div>
          <div class="project-info">
            <div class="info-item">
              <span class="label">所属系统：</span>
              <span class="value">{{ project.system_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">研发经理：</span>
              <span class="value">{{ project.project_manager || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">测试负责人：</span>
              <span class="value">{{ project.test_leader || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="stat">需求: {{ project.requirementCount || 0 }}</span>
          <span class="stat">用例: {{ project.testcaseCount || 0 }}</span>
          <span class="stat">缺陷: {{ project.defectCount || 0 }}</span>
          <div class="actions" v-if="isAdmin" @click.stop>
            <el-button text type="primary" size="small" @click="handleEdit(project)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(project)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && tableData.length === 0" description="暂无项目数据" />

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

    <!-- 新增/编辑对话框 - 卡片模式 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑项目' : '新增项目'" width="700px" :close-on-click-modal="false">
      <div class="form-container">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <!-- 基础信息卡片 -->
          <el-card class="form-card">
            <template #header>
              <span class="card-title">基础信息</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目编号" prop="project_code">
                  <el-input v-model="form.project_code" placeholder="如：P2025001" :disabled="!!editId" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="名称" prop="name">
                  <el-input v-model="form.name" placeholder="项目名称" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="项目描述" />
            </el-form-item>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所属系统" prop="system_id">
                  <el-select v-model="form.system_id" placeholder="请选择系统" style="width: 100%" @change="handleSystemChange">
                    <el-option v-for="sys in systems" :key="sys.id" :label="sys.system_name" :value="sys.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="研发经理" prop="project_manager">
                  <el-select v-model="form.project_manager" placeholder="请选择研发经理" style="width: 100%">
                    <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.real_name" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="测试负责人" prop="test_leader">
              <el-select v-model="form.test_leader" placeholder="请选择测试负责人" style="width: 100%">
                <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.real_name" />
              </el-select>
            </el-form-item>
          </el-card>

          <!-- 项目信息卡片 -->
          <el-card class="form-card">
            <template #header>
              <span class="card-title">项目信息</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目状态">
                  <el-select v-model="form.test_status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="需求分析" value="需求分析" />
                    <el-option label="测试用例编写" value="测试用例编写" />
                    <el-option label="测试用例已评审" value="测试用例已评审" />
                    <el-option label="集成测试" value="集成测试" />
                    <el-option label="系统测试" value="系统测试" />
                    <el-option label="业务验收测试" value="业务验收测试" />
                    <el-option label="已投产" value="已投产" />
                    <el-option label="完成复盘" value="完成复盘" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计划提测日期">
                  <el-date-picker v-model="form.submit_test_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="系统测试开始">
                  <el-date-picker v-model="form.sys_test_start_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="系统测试结束">
                  <el-date-picker v-model="form.sys_test_end_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="计划投产日期">
              <el-date-picker v-model="form.production_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-card>

          <!-- 里程碑计划卡片 -->
          <el-card class="form-card">
            <template #header>
              <div class="card-header-row">
                <span class="card-title">里程碑计划</span>
                <el-button type="primary" text size="small" @click="addMilestone">+ 添加里程碑</el-button>
              </div>
            </template>
            <el-table :data="milestoneList" border size="small">
              <el-table-column prop="name" label="里程碑名称" min-width="120">
                <template #default="{ row, $index }">
                  <el-input v-model="row.name" placeholder="如：需求分析" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="date" label="计划日期" width="150">
                <template #default="{ row }">
                  <el-date-picker v-model="row.date" type="date" placeholder="选择日期" size="small" style="width: 100%" value-format="YYYY-MM-DD" />
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.description" placeholder="备注说明" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button text type="danger" size="small" @click="removeMilestone($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 测试计划卡片 -->
          <el-card class="form-card">
            <template #header>
              <div class="card-header-row">
                <span class="card-title">测试计划</span>
                <el-button type="primary" text size="small" @click="addTestRound">+ 添加轮次</el-button>
              </div>
            </template>
            <el-table :data="testPlanList" border size="small">
              <el-table-column prop="round" label="轮次" width="100">
                <template #default="{ row, $index }">
                  <el-input v-model="row.round" placeholder="如：第一轮" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="start_date" label="开始时间" width="150">
                <template #default="{ row }">
                  <el-date-picker v-model="row.start_date" type="date" placeholder="选择日期" size="small" style="width: 100%" value-format="YYYY-MM-DD" />
                </template>
              </el-table-column>
              <el-table-column prop="end_date" label="结束时间" width="150">
                <template #default="{ row }">
                  <el-date-picker v-model="row.end_date" type="date" placeholder="选择日期" size="small" style="width: 100%" value-format="YYYY-MM-DD" />
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明">
                <template #default="{ row }">
                  <el-input v-model="row.description" placeholder="如：功能测试" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button text type="danger" size="small" @click="removeTestRound($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 项目详情抽屉 -->
    <el-drawer v-model="detailVisible" title="项目详情" size="600px" direction="rtl">
      <div class="detail-container" v-if="currentProject">
        <!-- 基本信息 -->
        <el-card class="detail-card">
          <template #header>
            <span class="detail-title">基本信息</span>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">项目编号：</span>
              <span class="value">{{ currentProject.project_code }}</span>
            </div>
            <div class="detail-item">
              <span class="label">项目名称：</span>
              <span class="value">{{ currentProject.name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">所属系统：</span>
              <span class="value">{{ currentProject.system_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">研发经理：</span>
              <span class="value">{{ currentProject.project_manager }}</span>
            </div>
            <div class="detail-item">
              <span class="label">测试负责人：</span>
              <span class="value">{{ currentProject.test_leader }}</span>
            </div>
            <div class="detail-item">
              <span class="label">项目状态：</span>
              <el-tag :type="testStatusTypeMap[currentProject.test_status]" size="small">
                {{ currentProject.test_status || '需求分析' }}
              </el-tag>
            </div>
          </div>
          <div class="detail-item full-width">
            <span class="label">项目描述：</span>
            <div class="value">{{ currentProject.description || '-' }}</div>
          </div>
        </el-card>

        <!-- 时间计划 -->
        <el-card class="detail-card">
          <template #header>
            <span class="detail-title">时间计划</span>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">计划提测日期：</span>
              <span class="value">{{ currentProject.submit_test_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">系统测试开始：</span>
              <span class="value">{{ currentProject.sys_test_start_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">系统测试结束：</span>
              <span class="value">{{ currentProject.sys_test_end_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">计划投产日期：</span>
              <span class="value">{{ currentProject.production_date || '-' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 里程碑计划 -->
        <el-card class="detail-card" v-if="milestoneDisplayList.length > 0">
          <template #header>
            <span class="detail-title">里程碑计划</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in milestoneDisplayList"
              :key="index"
              :timestamp="item.date"
              :type="index === 0 ? 'primary' : ''"
            >
              {{ item.name }}
              <div class="timeline-desc" v-if="item.description">{{ item.description }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 测试计划 -->
        <el-card class="detail-card" v-if="testPlanDisplayList.length > 0">
          <template #header>
            <span class="detail-title">测试计划</span>
          </template>
          <el-table :data="testPlanDisplayList" border size="small">
            <el-table-column prop="round" label="轮次" width="80" />
            <el-table-column prop="start_date" label="开始时间" width="120" />
            <el-table-column prop="end_date" label="结束时间" width="120" />
            <el-table-column prop="description" label="说明" />
          </el-table>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="detail-card">
          <template #header>
            <span class="detail-title">测试统计</span>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value">{{ currentProject.requirementCount || 0 }}</div>
              <div class="stat-label">需求数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ currentProject.testcaseCount || 0 }}</div>
              <div class="stat-label">用例数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ currentProject.defectCount || 0 }}</div>
              <div class="stat-label">缺陷数</div>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <div class="detail-actions" v-if="isAdmin">
          <el-button type="primary" @click="handleEdit(currentProject); detailVisible = false">编辑</el-button>
          <el-button type="danger" @click="handleDelete(currentProject); detailVisible = false">删除</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/api'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')

const loading = ref(false)
const tableData = ref([])
const systems = ref([])
const users = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchForm = reactive({ keyword: '', test_status: '' })

const dialogVisible = ref(false)
const detailVisible = ref(false)
const editId = ref(null)
const currentProject = ref(null)
const formRef = ref()

// 里程碑计划列表
const milestoneList = ref([])
// 测试计划列表
const testPlanList = ref([])

const form = reactive({
  project_code: '',
  name: '',
  description: '',
  system_id: '',
  system_name: '',
  project_manager: '',
  test_leader: '',
  test_status: '需求分析',
  submit_test_date: '',
  sys_test_start_date: '',
  sys_test_end_date: '',
  production_date: '',
  requirement_doc: '',
  design_doc: '',
  milestone_plan: '',
  test_plan: ''
})

const rules = {
  project_code: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
  system_id: [{ required: true, message: '请选择所属系统', trigger: 'change' }],
  project_manager: [{ required: true, message: '请选择研发经理', trigger: 'change' }],
  test_leader: [{ required: true, message: '请选择测试负责人', trigger: 'change' }]
}

const testStatusTypeMap = {
  '需求分析': 'info',
  '测试用例编写': 'warning',
  '测试用例已评审': 'success',
  '集成测试': 'warning',
  '系统测试': 'warning',
  '业务验收测试': 'warning',
  '已投产': 'danger',
  '完成复盘': 'success'
}

// 获取项目列表
async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/projects', {
      params: { ...searchForm, ...pagination }
    })
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

// 获取系统字典
async function fetchSystems() {
  const res = await request.get('/projects/systems')
  systems.value = res || []
}

// 获取用户列表
async function fetchUsers() {
  const res = await request.get('/projects/users')
  users.value = res || []
}

// 处理系统选择变化
function handleSystemChange(systemId) {
  const sys = systems.value.find(s => s.id === systemId)
  if (sys) {
    form.system_name = sys.system_name
  }
}

// 添加里程碑
function addMilestone() {
  milestoneList.value.push({ name: '', date: '', description: '' })
}

// 删除里程碑
function removeMilestone(index) {
  milestoneList.value.splice(index, 1)
}

// 添加测试轮次
function addTestRound() {
  testPlanList.value.push({ round: '', start_date: '', end_date: '', description: '' })
}

// 删除测试轮次
function removeTestRound(index) {
  testPlanList.value.splice(index, 1)
}

// 打开项目详情
function openProjectDetail(project) {
  currentProject.value = project
  detailVisible.value = true
}

// 获取显示用的里程碑列表
const milestoneDisplayList = computed(() => {
  if (!currentProject.value?.milestone_plan) return []
  try {
    return JSON.parse(currentProject.value.milestone_plan)
  } catch {
    return []
  }
})

// 获取显示用的测试计划列表
const testPlanDisplayList = computed(() => {
  if (!currentProject.value?.test_plan) return []
  try {
    return JSON.parse(currentProject.value.test_plan)
  } catch {
    return []
  }
})

// 新增项目
function handleAdd() {
  editId.value = null
  Object.assign(form, {
    project_code: '',
    name: '',
    description: '',
    system_id: '',
    system_name: '',
    project_manager: '',
    test_leader: '',
    test_status: '需求分析',
    submit_test_date: '',
    sys_test_start_date: '',
    sys_test_end_date: '',
    production_date: '',
    requirement_doc: '',
    design_doc: '',
    milestone_plan: '',
    test_plan: ''
  })
  milestoneList.value = []
  testPlanList.value = []
  dialogVisible.value = true
}

// 编辑项目
function handleEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    project_code: row.project_code || '',
    name: row.name || '',
    description: row.description || '',
    system_id: row.system_id || '',
    system_name: row.system_name || '',
    project_manager: row.project_manager || '',
    test_leader: row.test_leader || '',
    test_status: row.test_status || '需求分析',
    submit_test_date: row.submit_test_date || '',
    sys_test_start_date: row.sys_test_start_date || '',
    sys_test_end_date: row.sys_test_end_date || '',
    production_date: row.production_date || '',
    requirement_doc: row.requirement_doc || '',
    design_doc: row.design_doc || '',
    milestone_plan: row.milestone_plan || '',
    test_plan: row.test_plan || ''
  })

  // 解析里程碑和测试计划
  if (row.milestone_plan) {
    try {
      milestoneList.value = JSON.parse(row.milestone_plan)
    } catch {
      milestoneList.value = []
    }
  } else {
    milestoneList.value = []
  }

  if (row.test_plan) {
    try {
      testPlanList.value = JSON.parse(row.test_plan)
    } catch {
      testPlanList.value = []
    }
  } else {
    testPlanList.value = []
  }

  dialogVisible.value = true
}

// 删除项目
async function handleDelete(row) {
  await ElMessageBox.confirm('确定要删除该项目吗？相关数据将被一并删除', '提示', { type: 'warning' })
  await request.delete(`/projects/${row.id}`)
  ElMessage.success('删除成功')
  fetchData()
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 序列化里程碑和测试计划
  const submitData = { ...form }
  submitData.milestone_plan = JSON.stringify(milestoneList.value)
  submitData.test_plan = JSON.stringify(testPlanList.value)

  try {
    if (editId.value) {
      await request.put(`/projects/${editId.value}`, submitData)
      ElMessage.success('更新成功')
    } else {
      await request.post('/projects', submitData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  fetchData()
  fetchSystems()
  fetchUsers()
})
</script>

<style scoped>
.projects-page {
  padding: 20px;
}

.page-header h2 {
  margin: 0 0 20px 0;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  gap: 10px;
}

/* Grid布局 */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-code {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.project-code:hover {
  text-decoration: underline;
}

.card-body {
  margin-bottom: 12px;
}

.project-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-info {
  font-size: 13px;
  color: #606266;
}

.info-item {
  display: flex;
  margin-bottom: 6px;
}

.info-item .label {
  color: #909399;
  width: 80px;
}

.info-item .value {
  color: #606266;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #909399;
}

.card-footer .stat {
  margin-right: 12px;
}

.card-footer .actions {
  display: flex;
  gap: 8px;
}

/* 表单卡片 */
.form-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.form-card {
  margin-bottom: 16px;
}

.card-title {
  font-weight: 500;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 详情抽屉 */
.detail-container {
  padding: 0 10px;
}

.detail-card {
  margin-bottom: 16px;
}

.detail-title {
  font-weight: 500;
  font-size: 15px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
}

.detail-item.full-width {
  grid-column: 1 / -1;
  flex-direction: column;
  margin-top: 12px;
}

.detail-item .label {
  color: #909399;
  min-width: 100px;
}

.detail-item .value {
  color: #606266;
  flex: 1;
}

.timeline-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-item .stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>