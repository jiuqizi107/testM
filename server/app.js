const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./database/init');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化数据库并启动服务器
async function startServer() {
  try {
    await db.initDatabase();

    // 静态文件服务（前端构建后）
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // API路由
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/projects', require('./routes/projects'));
    app.use('/api/requirements', require('./routes/requirements'));
    app.use('/api/versions', require('./routes/versions'));
    app.use('/api/testcases', require('./routes/testcases'));
    app.use('/api/defects', require('./routes/defects'));
    app.use('/api/returns', require('./routes/returns'));
    app.use('/api/workbench', require('./routes/workbench'));

    // 前端路由支持（SPA）
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });

    // 错误处理
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: '服务器内部错误', error: err.message });
    });

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`测试管理平台服务已启动: http://localhost:${PORT}`);
      console.log('默认账号: admin / admin123');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
