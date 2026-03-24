# GitHub Codespaces 运行指南

## 快速开始

### 方式一：使用GitHub Codespaces（推荐）

1. **打开项目的GitHub页面**
   - 访问: https://github.com/jiuqizi107/testM

2. **创建Codespace**
   - 点击绿色的 `<> Code` 按钮
   - 选择 `Codespaces` 标签页
   - 点击 `Create codespace on main`

3. **等待环境准备**
   - Codespace会自动：
     - 安装Node.js 18
     - 安装项目依赖（server和client）
     - 配置VS Code扩展

4. **启动应用**
   
   在VS Code终端中执行：
   ```bash
   # 方式A: 分别运行（推荐）
   
   # 终端1: 启动服务器
   cd server
   npm start
   
   # 终端2: 启动客户端
   cd client
   npm run dev
   ```

   或者：
   ```bash
   # 方式B: 使用启动脚本（需要bash）
   bash start.sh
   ```

### 获取公网地址

当应用启动后，VS Code会自动提示端口转发。按照以下步骤：

1. **前端应用 (Vite)**
   - 你会看到一个通知：`Your application running on port 5173 is available`
   - 点击 `打开在浏览器中` 或 `Open in Browser`
   - GitHub会自动生成一个公网地址，格式如：
     ```
     https://jiuqizi107-testm-xxxxx.preview.app.github.dev:5173
     ```

2. **后端API**
   - 服务器运行在端口 3000
   - 公网地址格式：
     ```
     https://jiuqizi107-testm-xxxxx.preview.app.github.dev:3000
     ```

### 应用信息

- **前端地址**: `http://localhost:5173`
- **后端地址**: `http://localhost:3000`
- **默认账号**: 
  - 用户名: `admin`
  - 密码: `admin123`

### 开发环境配置

Codespace已预装：
- ✅ Node.js 18
- ✅ npm 9+
- ✅ Git
- ✅ VS Code插件：
  - Vue.volar (Vue3支持)
  - ESLint
  - Prettier

### 常见问题

**Q: 如何重新启动应用？**
```bash
# Ctrl+C 停止应用
# 重新运行启动命令
```

**Q: 如何查看公网地址？**
- VS Code左下角有个 `Ports` 标签窗格
- 你可以看到转发的所有端口和公网地址
- 点击地址旁的全球图标可复制公网链接

**Q: Codespace会保留多久？**
- 30天不活动会被自动删除
- 你随时可以重新创建新的Codespace

**Q: 如何停止Codespace节省配额？**
- GitHub页面右上角 → Codespaces → 选择你的Codespace → ⋯ → Stop codespace

### 技术栈

| 组件 | 技术 |
|-----|------|
| 前端 | Vue3 + Vite + Element Plus |
| 后端 | Node.js + Express |
| 数据库 | SQLite (sql.js) |
| 认证 | JWT |
| 状态管理 | Pinia |

---

**需要帮助？** 查看项目README.md或提交Issue到GitHub
