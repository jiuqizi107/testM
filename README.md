# 测试管理平台

一个功能完整的本地测试管理平台，支持项目管理、需求管理、测试用例库、缺陷管理等核心功能。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus + ECharts
- **后端**: Node.js + Express
- **数据库**: SQLite
- **认证**: JWT Token

## 功能模块

- 🔐 **用户登录** - 账号密码登录，记住密码
- 📊 **统计仪表盘** - 多维度数据可视化
- 👤 **测试工作台** - 个人任务中心
- 📁 **项目管理** - 项目CRUD及统计
- 📝 **需求管理** - 需求台账、提测流程分配
- 🏷️ **版本管理** - 版本追踪管理
- 🔄 **退回台账** - 退回记录查询
- ✅ **测试用例库** - 用例管理、状态跟踪
- 🐛 **缺陷库** - 缺陷全生命周期管理

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 启动服务

```bash
# 启动后端服务 (在 server 目录)
npm start

# 启动前端服务 (在 client 目录，新开终端)
npm run dev
```

### 3. 访问系统

- 前端地址: http://localhost:5173
- 后端API: http://localhost:3000/api

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| tester1 | tester123 | 测试员 |
| tester2 | tester123 | 测试员 |

## 项目结构

```
test-management-platform/
├── client/                  # 前端项目
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── api/            # API封装
│   │   ├── stores/         # 状态管理
│   │   ├── router/         # 路由配置
│   │   └── assets/         # 静态资源
│   └── package.json
│
├── server/                  # 后端项目
│   ├── routes/             # API路由
│   ├── middleware/         # 中间件
│   ├── database/           # 数据库
│   ├── app.js              # 应用入口
│   └── package.json
│
└── README.md
```

## 构建部署

```bash
# 构建前端
cd client
npm run build

# 后端会自动托管前端静态文件
# 生产环境只需启动后端服务
cd ../server
npm start
```

## 状态说明

### 需求状态
- `pending` - 待处理
- `submitted` - 已提测
- `testing` - 测试中
- `completed` - 已完成
- `closed` - 已关闭

### 缺陷状态
- `new` - 新建
- `confirmed` - 已确认
- `processing` - 处理中
- `resolved` - 已解决
- `closed` - 已关闭

### 测试用例状态
- `draft` - 草稿
- `pending` - 待执行
- `passed` - 通过
- `failed` - 失败
- `blocked` - 阻塞

## License

MIT
