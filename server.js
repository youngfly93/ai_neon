const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';

// MongoDB 相关变量
let mongooseAvailable = false;
let authRoutes = null;
let authMiddleware = { 
    optionalAuth: (req, res, next) => next(),
    verifyToken: (req, res, next) => next(),
    isAdmin: (req, res, next) => next()
};

// 尝试连接 MongoDB（如果配置了）
if (MONGO_URI) {
    try {
        const mongoose = require('mongoose');
        const cookieParser = require('cookie-parser');
        
        // 设置 Mongoose 连接选项
        mongoose.set('strictQuery', false);
        
        mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5秒超时
            socketTimeoutMS: 45000,
        })
            .then(() => {
                console.log('📦 MongoDB连接成功');
                mongooseAvailable = true;
                
                // 只有连接成功后才导入路由
                try {
                    authRoutes = require('./routes/auth');
                    authMiddleware = require('./middleware/auth');
                } catch (importErr) {
                    console.log('⚠️ 认证模块导入失败，运行在无数据库模式');
                }
            })
            .catch(err => {
                console.log('⚠️ MongoDB连接失败，运行在无数据库模式', err.message);
                console.log('💡 登录功能已禁用，所有功能开放访问');
            });
        
        app.use(cookieParser());
    } catch (err) {
        console.log('⚠️ MongoDB 模块未安装，运行在无数据库模式', err.message);
        console.log('💡 登录功能已禁用，所有功能开放访问');
    }
} else {
    console.log('ℹ️ 未配置 MongoDB，运行在无数据库模式');
    console.log('💡 登录功能已禁用，所有功能开放访问');
}

// 解构中间件
const { optionalAuth, verifyToken, isAdmin } = authMiddleware;

// 中间件
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static('.'));
app.use('/node_modules', express.static('node_modules'));

// 应用API路由（仅在 MongoDB 可用时）
if (authRoutes) {
    app.use('/api/auth', authRoutes);
} else {
    // 没有数据库时提供基础的认证端点
    app.get('/api/auth/me', (req, res) => {
        res.json({ loggedIn: false });
    });
    
    app.post('/api/auth/logout', (req, res) => {
        res.json({ success: true, message: '已退出登录' });
    });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const themeName = req.params.themeName;
        const themePath = path.join('.', themeName);
        
        // Vercel环境下不能动态创建目录，依赖预存在的文件夹
        cb(null, themePath);
    },
    filename: function (req, file, cb) {
        // 使用原始文件名，如果重复则添加时间戳
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const timestamp = Date.now();
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    }
});

// 背景文件夹路径（Vercel环境下不能动态创建目录）
const backgroundsPath = path.join('.', 'public', 'backgrounds');

// 配置背景上传的multer
const backgroundStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, backgroundsPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        cb(null, `background_${timestamp}${ext}`);
    }
});

const backgroundUpload = multer({ 
    storage: backgroundStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    },
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB限制（背景图片可以稍大）
    }
});

// API routes for themes (lightweight, serve static JSON when possible)
app.get('/api/themes', optionalAuth, (req, res) => {
    // Redirect to static themes.json for better performance on Vercel
    res.redirect(301, '/themes.json');
});

app.get('/api/themes/:themeName/images', optionalAuth, (req, res) => {
    // Redirect to static theme JSON for better performance on Vercel
    const themeName = req.params.themeName;
    res.redirect(301, `/${themeName}.json`);
});

// 创建新主题 - 需要登录（Vercel环境下禁用动态目录创建）
app.post('/api/themes', verifyToken, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持动态创建主题，请通过静态文件管理' 
    });
});

// 删除主题 - 需要管理员权限（Vercel环境下禁用文件系统操作）
app.delete('/api/themes/:themeName', verifyToken, isAdmin, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持动态删除主题，请通过静态文件管理' 
    });
});

// 简单的管理员密钥验证中间件
const adminKeyAuth = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'] || req.body.adminKey || req.query.adminKey;
    const correctKey = process.env.ADMIN_KEY || 'ai-neon-admin-2024'; // 可以通过环境变量设置

    if (adminKey === correctKey) {
        next();
    } else {
        res.status(403).json({ error: '需要管理员权限才能执行此操作' });
    }
};

// 上传图片到指定主题 - Vercel环境下禁用
app.post('/api/themes/:themeName/images', adminKeyAuth, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持文件上传，请通过静态文件管理' 
    });
});

// 删除指定图片 - Vercel环境下禁用
app.delete('/api/themes/:themeName/images/:imageName', adminKeyAuth, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持文件删除，请通过静态文件管理' 
    });
});

// 获取所有背景图片 - 仅返回预设背景
app.get('/api/backgrounds', optionalAuth, (req, res) => {
    try {
        // 仅提供预设背景，不扫描文件系统
        const presetBackgrounds = [
            { name: 'neon-grid', url: 'preset', type: 'preset', displayName: '霓虹网格' },
            { name: 'cyber-matrix', url: 'preset', type: 'preset', displayName: '赛博矩阵' },
            { name: 'starfield', url: 'preset', type: 'preset', displayName: '星空' },
            { name: 'digital-rain', url: 'preset', type: 'preset', displayName: '数字雨' },
            { name: 'faulty-terminal', url: 'preset', type: 'preset', displayName: '故障终端' }
        ];
        
        res.json({
            presets: presetBackgrounds,
            custom: [] // Vercel环境下不支持自定义背景
        });
    } catch (error) {
        console.error('Error reading backgrounds:', error);
        res.status(500).json({ error: 'Failed to read backgrounds' });
    }
});

// 上传背景图片 - Vercel环境下禁用
app.post('/api/backgrounds', verifyToken, isAdmin, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持背景上传，请使用预设背景' 
    });
});

// 删除背景图片 - Vercel环境下禁用
app.delete('/api/backgrounds/:backgroundName', verifyToken, isAdmin, (req, res) => {
    res.status(501).json({ 
        error: 'Vercel环境下不支持背景删除，请使用预设背景' 
    });
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 主题详情页路由
app.get('/theme/:themeName', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'theme.html'));
    } catch (error) {
        console.error('Theme page error:', error);
        res.status(500).send('Theme page unavailable');
    }
});

// 管理页面路由 - 需要登录才能访问
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 管理员验证面板路由
app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// 登录页面路由
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        themes: 'loaded via static files',
        db: mongooseAvailable ? 'connected' : 'disabled'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件太大，最大支持15MB' });
        }
    }
    
    if (error.message === '只允许上传图片文件！') {
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: '服务器内部错误' });
});

// 仅在非 Vercel 环境下启动服务器
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 AI NEON'world server running at http://localhost:${PORT}`);
        console.log(`🎨 Neon-powered file management system is ready!`);
        console.log(`🛠️  Admin panel available at http://localhost:${PORT}/admin`);
        console.log(`🔑 Login system enabled - http://localhost:${PORT}/login`);
    });
}

// 导出 app 供 Vercel 使用
module.exports = app; 