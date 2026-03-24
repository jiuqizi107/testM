<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2>统计仪表盘</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #409eff">
          <div class="stat-card-header">
            <span class="stat-card-title">活跃项目</span>
            <el-icon :size="24" color="#409eff"><Folder /></el-icon>
          </div>
          <div class="stat-card-value">{{ stats.global?.totalProjects || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #67c23a">
          <div class="stat-card-header">
            <span class="stat-card-title">需求总数</span>
            <el-icon :size="24" color="#67c23a"><Document /></el-icon>
          </div>
          <div class="stat-card-value">{{ stats.global?.totalRequirements || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #e6a23c">
          <div class="stat-card-header">
            <span class="stat-card-title">测试用例</span>
            <el-icon :size="24" color="#e6a23c"><Tickets /></el-icon>
          </div>
          <div class="stat-card-value">{{ stats.global?.totalTestCases || 0 }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card" style="border-left: 4px solid #f56c6c">
          <div class="stat-card-header">
            <span class="stat-card-title">缺陷总数</span>
            <el-icon :size="24" color="#f56c6c"><Warning /></el-icon>
          </div>
          <div class="stat-card-value">{{ stats.global?.totalDefects || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="8">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px">需求状态分布</h3>
          <div ref="requirementChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px">缺陷严重程度分布</h3>
          <div ref="defectSeverityChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px">测试用例状态</h3>
          <div ref="testcaseChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 缺陷状态柱状图 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <div class="stat-card">
          <h3 style="margin-bottom: 16px">缺陷状态统计</h3>
          <div ref="defectStatusChartRef" style="height: 300px"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import request from '@/api'

const stats = ref({})

const requirementChartRef = ref()
const defectSeverityChartRef = ref()
const testcaseChartRef = ref()
const defectStatusChartRef = ref()

let charts = []

const statusMap = {
  pending: '待处理',
  submitted: '已提测',
  testing: '测试中',
  completed: '已完成',
  closed: '已关闭'
}

const severityMap = {
  critical: '致命',
  major: '严重',
  normal: '一般',
  minor: '轻微'
}

const testcaseStatusMap = {
  draft: '草稿',
  pending: '待执行',
  passed: '通过',
  failed: '失败',
  blocked: '阻塞'
}

const defectStatusMap = {
  new: '新建',
  confirmed: '已确认',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
}

onMounted(async () => {
  await fetchStats()
  initCharts()
})

onUnmounted(() => {
  charts.forEach(chart => chart.dispose())
})

async function fetchStats() {
  const res = await request.get('/workbench/stats')
  stats.value = res
}

function initCharts() {
  // 需求状态分布饼图
  const requirementChart = echarts.init(requirementChartRef.value)
  const requirementData = stats.value.charts?.requirementStatus?.map(item => ({
    name: statusMap[item.status] || item.status,
    value: item.count
  })) || []

  requirementChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: requirementData
    }]
  })
  charts.push(requirementChart)

  // 缺陷严重程度饼图
  const defectSeverityChart = echarts.init(defectSeverityChartRef.value)
  const severityData = stats.value.charts?.defectSeverity?.map(item => ({
    name: severityMap[item.severity] || item.severity,
    value: item.count
  })) || []

  defectSeverityChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: ['#f56c6c', '#e6a23c', '#409eff', '#67c23a'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: severityData
    }]
  })
  charts.push(defectSeverityChart)

  // 测试用例状态饼图
  const testcaseChart = echarts.init(testcaseChartRef.value)
  const testcaseData = stats.value.charts?.testcaseStatus?.map(item => ({
    name: testcaseStatusMap[item.status] || item.status,
    value: item.count
  })) || []

  testcaseChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: ['#909399', '#e6a23c', '#67c23a', '#f56c6c', '#909399'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: testcaseData
    }]
  })
  charts.push(testcaseChart)

  // 缺陷状态柱状图
  const defectStatusChart = echarts.init(defectStatusChartRef.value)
  const defectStatusData = stats.value.charts?.defectStatus || []

  defectStatusChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: defectStatusData.map(item => defectStatusMap[item.status] || item.status)
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: defectStatusData.map(item => item.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409eff' },
          { offset: 1, color: '#79bbff' }
        ]),
        borderRadius: [4, 4, 0, 0]
      }
    }]
  })
  charts.push(defectStatusChart)

  // 响应式
  window.addEventListener('resize', () => {
    charts.forEach(chart => chart.resize())
  })
}
</script>

<style scoped>
.stat-cards {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}
</style>
