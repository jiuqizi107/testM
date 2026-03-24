<template>
  <div class="workbench-page">
    <div class="page-header">
      <h2>测试工作台</h2>
    </div>

    <!-- 个人统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #409eff">
          <div class="stat-card-header">
            <span class="stat-card-title">我的待办需求</span>
          </div>
          <div class="stat-card-value">{{ personalStats.pendingRequirements || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #67c23a">
          <div class="stat-card-header">
            <span class="stat-card-title">我的测试用例</span>
          </div>
          <div class="stat-card-value">{{ personalStats.testCasesCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #f56c6c">
          <div class="stat-card-header">
            <span class="stat-card-title">待处理缺陷</span>
          </div>
          <div class="stat-card-value">{{ personalStats.pendingDefects || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 我的任务区域 -->
    <el-row :gutter="20">
      <!-- 我的待办需求 -->
      <el-col :xs="24" :lg="12">
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3>我的待办需求</h3>
            <el-button text type="primary" @click="$router.push('/requirements')">查看全部</el-button>
          </div>
          <el-table :data="workbenchData.myRequirements" stripe>
            <el-table-column prop="title" label="需求标题" min-width="150" show-overflow-tooltip />
            <el-table-column prop="project_name" label="项目" width="120" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="priorityMap[row.priority]" size="small">
                  {{ priorityText[row.priority] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]" size="small">
                  {{ statusText[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <!-- 待处理缺陷 -->
      <el-col :xs="24" :lg="12">
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3>待处理缺陷</h3>
            <el-button text type="primary" @click="$router.push('/defects')">查看全部</el-button>
          </div>
          <el-table :data="workbenchData.myDefects" stripe>
            <el-table-column prop="title" label="缺陷标题" min-width="150" show-overflow-tooltip />
            <el-table-column prop="project_name" label="项目" width="120" show-overflow-tooltip />
            <el-table-column prop="severity" label="严重程度" width="80">
              <template #default="{ row }">
                <el-tag :type="severityMap[row.severity]" size="small">
                  {{ severityText[row.severity] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="defectStatusMap[row.status]" size="small">
                  {{ defectStatusText[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <!-- 我的测试用例 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3>我创建的测试用例</h3>
            <el-button text type="primary" @click="$router.push('/testcases')">查看全部</el-button>
          </div>
          <el-table :data="workbenchData.myTestCases" stripe>
            <el-table-column prop="title" label="用例标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="project_name" label="项目" width="150" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="priorityMap[row.priority]" size="small">
                  {{ priorityText[row.priority] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="testcaseStatusMap[row.status]" size="small">
                  {{ testcaseStatusText[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api'

const workbenchData = ref({
  myRequirements: [],
  myTestCases: [],
  myDefects: [],
  createdDefects: []
})

const personalStats = ref({})

const priorityMap = { high: 'danger', medium: 'warning', low: 'info' }
const priorityText = { high: '高', medium: '中', low: '低' }

const statusTypeMap = { pending: 'info', submitted: 'warning', testing: 'primary', completed: 'success', closed: 'info' }
const statusText = { pending: '待处理', submitted: '已提测', testing: '测试中', completed: '已完成', closed: '已关闭' }

const severityMap = { critical: 'danger', major: 'warning', normal: 'info', minor: 'success' }
const severityText = { critical: '致命', major: '严重', normal: '一般', minor: '轻微' }

const defectStatusMap = { new: 'danger', confirmed: 'warning', processing: 'primary', resolved: 'success', closed: 'info' }
const defectStatusText = { new: '新建', confirmed: '已确认', processing: '处理中', resolved: '已解决', closed: '已关闭' }

const testcaseStatusMap = { draft: 'info', pending: 'warning', passed: 'success', failed: 'danger', blocked: 'info' }
const testcaseStatusText = { draft: '草稿', pending: '待执行', passed: '通过', failed: '失败', blocked: '阻塞' }

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(async () => {
  const [dataRes, statsRes] = await Promise.all([
    request.get('/workbench'),
    request.get('/workbench/stats')
  ])
  workbenchData.value = dataRes
  personalStats.value = statsRes.personal
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 20px;
}
</style>
