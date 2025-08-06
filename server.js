const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_neon_world';

// 连接MongoDB数据库
mongoose.connect(MONGO_URI)
  .then(() => console.log('📦 MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 导入路由
const authRoutes = require('./routes/auth');

// 导入中间件
const { optionalAuth, verifyToken, isAdmin } = require('./middleware/auth');

// 中间件
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/images', express.static('.'));
app.use('/node_modules', express.static('node_modules'));

// 应用API路由
app.use('/api/auth', authRoutes);

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const themeName = req.params.themeName;
        const themePath = path.join('.', themeName);
        
        // 确保主题文件夹存在
        if (!fs.existsSync(themePath)) {
            fs.mkdirSync(themePath, { recursive: true });
        }
        
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

// 创建背景文件夹（如果不存在）
const backgroundsPath = path.join('.', 'public', 'backgrounds');
if (!fs.existsSync(backgroundsPath)) {
    fs.mkdirSync(backgroundsPath, { recursive: true });
}

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

// 获取所有主题文件夹
app.get('/api/themes', optionalAuth, (req, res) => {
    try {
        const themes = [];
        const items = fs.readdirSync('.');
        
        for (const item of items) {
            const itemPath = path.join('.', item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && 
                item !== 'node_modules' && item !== 'public' && item !== 'api' &&
                item !== 'models' && item !== 'middleware' && item !== 'routes') {
                
                // 获取文件夹中的第一张图片作为封面
                const files = fs.readdirSync(itemPath);
                const imageFiles = files.filter(file => 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
                );
                
                themes.push({
                    name: item,
                    displayName: item,
                    cover: imageFiles.length > 0 ? `/images/${item}/${imageFiles[0]}` : '/placeholder.svg',
                    imageCount: imageFiles.length
                });
            }
        }
        
        res.json(themes);
    } catch (error) {
        console.error('Error reading themes:', error);
        res.status(500).json({ error: 'Failed to read themes' });
    }
});

// 获取特定主题下的所有图片
app.get('/api/themes/:themeName/images', optionalAuth, (req, res) => {
    try {
        const themeName = decodeURIComponent(req.params.themeName);
        const themePath = path.join('.', themeName);
        
        if (!fs.existsSync(themePath)) {
            return res.status(404).json({ error: 'Theme not found' });
        }
        
        const files = fs.readdirSync(themePath);
        const imageFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                name: file,
                url: `/images/${themeName}/${file}`,
                path: `${themeName}/${file}`
            }));
        
        res.json(imageFiles);
    } catch (error) {
        console.error('Error reading theme images:', error);
        res.status(500).json({ error: 'Failed to read theme images' });
    }
});

// 创建新主题 - 需要登录
app.post('/api/themes', verifyToken, (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: '主题名称不能为空' });
        }
        
        // 清理主题名称，移除特殊字符
        const cleanName = name.trim().replace(/[<>:"/\\|?*]/g, '');
        
        if (!cleanName) {
            return res.status(400).json({ error: '主题名称无效' });
        }
        
        const themePath = path.join('.', cleanName);
        
        if (fs.existsSync(themePath)) {
            return res.status(400).json({ error: '主题已存在' });
        }
        
        fs.mkdirSync(themePath, { recursive: true });
        
        res.json({ 
            success: true, 
            message: '主题创建成功',
            theme: {
                name: cleanName,
                displayName: cleanName,
                cover: '/placeholder.svg',
                imageCount: 0
            }
        });
    } catch (error) {
        console.error('Error creating theme:', error);
        res.status(500).json({ error: '创建主题失败' });
    }
});

// 删除主题 - 需要管理员权限
app.delete('/api/themes/:themeName', verifyToken, isAdmin, (req, res) => {
    try {
        const themeName = decodeURIComponent(req.params.themeName);
        const themePath = path.join('.', themeName);
        
        if (!fs.existsSync(themePath)) {
            return res.status(404).json({ error: '主题不存在' });
        }
        
        // 递归删除文件夹
        fs.rmSync(themePath, { recursive: true, force: true });
        
        res.json({ success: true, message: '主题删除成功' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ error: '删除主题失败' });
    }
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

// 上传图片到指定主题 - 需要管理员密钥
app.post('/api/themes/:themeName/images', adminKeyAuth, upload.array('images', 10), (req, res) => {
    try {
        const themeName = decodeURIComponent(req.params.themeName);
        const uploadedFiles = req.files;
        
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: '没有选择文件' });
        }
        
        const results = uploadedFiles.map(file => ({
            name: file.filename,
            url: `/images/${themeName}/${file.filename}`,
            path: `${themeName}/${file.filename}`,
            size: file.size
        }));
        
        res.json({ 
            success: true, 
            message: `成功上传 ${uploadedFiles.length} 张图片`,
            images: results
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: '上传图片失败' });
    }
});

// 删除指定图片 - 需要管理员密钥
app.delete('/api/themes/:themeName/images/:imageName', adminKeyAuth, (req, res) => {
    try {
        const themeName = decodeURIComponent(req.params.themeName);
        const imageName = decodeURIComponent(req.params.imageName);
        const imagePath = path.join('.', themeName, imageName);
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: '图片不存在' });
        }
        
        fs.unlinkSync(imagePath);
        
        res.json({ success: true, message: '图片删除成功' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: '删除图片失败' });
    }
});

// 获取所有背景图片
app.get('/api/backgrounds', optionalAuth, (req, res) => {
    try {
        const backgrounds = [];
        
        // 检查backgrounds文件夹是否存在
        if (fs.existsSync(backgroundsPath)) {
            const files = fs.readdirSync(backgroundsPath);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
            );
            
            imageFiles.forEach(file => {
                backgrounds.push({
                    name: file,
                    url: `/backgrounds/${file}`,
                    type: 'custom'
                });
            });
        }
        
        // 添加预设背景
        const presetBackgrounds = [
            { name: 'neon-grid', url: 'preset', type: 'preset', displayName: '霓虹网格' },
            { name: 'cyber-matrix', url: 'preset', type: 'preset', displayName: '赛博矩阵' },
            { name: 'starfield', url: 'preset', type: 'preset', displayName: '星空' },
            { name: 'digital-rain', url: 'preset', type: 'preset', displayName: '数字雨' },
            { name: 'faulty-terminal', url: 'preset', type: 'preset', displayName: '故障终端' }
        ];
        
        res.json({
            presets: presetBackgrounds,
            custom: backgrounds
        });
    } catch (error) {
        console.error('Error reading backgrounds:', error);
        res.status(500).json({ error: 'Failed to read backgrounds' });
    }
});

// 上传背景图片 - 需要管理员权限
app.post('/api/backgrounds', verifyToken, isAdmin, backgroundUpload.single('background'), (req, res) => {
    try {
        const uploadedFile = req.file;
        
        if (!uploadedFile) {
            return res.status(400).json({ error: '没有选择文件' });
        }
        
        res.json({ 
            success: true, 
            message: '背景上传成功',
            background: {
                name: uploadedFile.filename,
                url: `/backgrounds/${uploadedFile.filename}`,
                type: 'custom',
                size: uploadedFile.size
            }
        });
    } catch (error) {
        console.error('Error uploading background:', error);
        res.status(500).json({ error: '上传背景失败' });
    }
});

// 删除背景图片 - 需要管理员权限
app.delete('/api/backgrounds/:backgroundName', verifyToken, isAdmin, (req, res) => {
    try {
        const backgroundName = decodeURIComponent(req.params.backgroundName);
        const backgroundPath = path.join(backgroundsPath, backgroundName);
        
        if (!fs.existsSync(backgroundPath)) {
            return res.status(404).json({ error: '背景图片不存在' });
        }
        
        fs.unlinkSync(backgroundPath);
        
        res.json({ success: true, message: '背景删除成功' });
    } catch (error) {
        console.error('Error deleting background:', error);
        res.status(500).json({ error: '删除背景失败' });
    }
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 主题详情页路由
app.get('/theme/:themeName', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'theme.html'));
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