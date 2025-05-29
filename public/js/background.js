// 背景管理系统
class BackgroundManager {
    constructor() {
        this.currentBackground = this.loadSavedBackground();
        this.backgroundsData = { presets: [], custom: [] };
        this.init();
    }

    init() {
        this.createBackgroundButton();
        this.createBackgroundPanel();
        this.setupEventListeners();
        this.loadBackgrounds();
        this.applyBackground(this.currentBackground);
    }

    // 创建背景设置按钮
    createBackgroundButton() {
        const button = document.createElement('button');
        button.className = 'background-settings-btn';
        button.innerHTML = '🎨';
        button.title = '背景设置';
        button.id = 'backgroundSettingsBtn';
        document.body.appendChild(button);
    }

    // 创建背景设置面板
    createBackgroundPanel() {
        const panel = document.createElement('div');
        panel.className = 'background-panel';
        panel.id = 'backgroundPanel';
        
        panel.innerHTML = `
            <div class="background-panel-header">
                <h3 class="background-panel-title">
                    <span>🎨</span> 背景设置
                </h3>
                <button class="close-panel-btn" id="closePanelBtn">&times;</button>
            </div>
            <div class="background-panel-content">
                <div class="background-section">
                    <h3>预设背景</h3>
                    <div class="background-grid" id="presetBackgrounds">
                        <!-- 预设背景选项将在这里生成 -->
                    </div>
                </div>
                <div class="background-section">
                    <h3>自定义背景</h3>
                    <div class="custom-background-upload" id="backgroundUpload">
                        <div class="upload-icon">📁</div>
                        <p class="upload-text">拖拽图片到这里或点击上传</p>
                        <button class="upload-btn" id="selectBackgroundBtn">选择背景</button>
                        <input type="file" id="backgroundInput" accept="image/*" style="display: none;">
                    </div>
                    <div class="background-grid" id="customBackgrounds">
                        <!-- 自定义背景将在这里生成 -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    // 设置事件监听器
    setupEventListeners() {
        const settingsBtn = document.getElementById('backgroundSettingsBtn');
        const panel = document.getElementById('backgroundPanel');
        const closeBtn = document.getElementById('closePanelBtn');
        const uploadArea = document.getElementById('backgroundUpload');
        const selectBtn = document.getElementById('selectBackgroundBtn');
        const fileInput = document.getElementById('backgroundInput');

        // 打开/关闭面板
        settingsBtn.addEventListener('click', () => this.togglePanel());
        closeBtn.addEventListener('click', () => this.closePanel());

        // 点击面板外部关闭
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !settingsBtn.contains(e.target)) {
                this.closePanel();
            }
        });

        // 文件上传
        selectBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // ESC键关闭面板
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePanel();
            }
        });
    }

    // 切换面板显示
    togglePanel() {
        const panel = document.getElementById('backgroundPanel');
        panel.classList.toggle('open');
    }

    // 关闭面板
    closePanel() {
        const panel = document.getElementById('backgroundPanel');
        panel.classList.remove('open');
    }

    // 加载背景数据
    async loadBackgrounds() {
        try {
            const response = await fetch('/api/backgrounds');
            if (response.ok) {
                this.backgroundsData = await response.json();
                this.renderBackgrounds();
            } else {
                this.showToast('加载背景失败', 'error');
            }
        } catch (error) {
            console.error('Error loading backgrounds:', error);
            this.showToast('加载背景失败', 'error');
        }
    }

    // 渲染背景选项
    renderBackgrounds() {
        this.renderPresetBackgrounds();
        this.renderCustomBackgrounds();
    }

    // 渲染预设背景
    renderPresetBackgrounds() {
        const container = document.getElementById('presetBackgrounds');
        container.innerHTML = '';

        this.backgroundsData.presets.forEach(bg => {
            const option = document.createElement('div');
            option.className = 'background-option';
            option.dataset.background = JSON.stringify(bg);
            
            if (this.isCurrentBackground(bg)) {
                option.classList.add('active');
            }

            option.innerHTML = `
                <div class="background-option-preview ${bg.name}"></div>
                <div class="background-option-name">${bg.displayName}</div>
            `;

            option.addEventListener('click', () => this.selectBackground(bg));
            container.appendChild(option);
        });
    }

    // 渲染自定义背景
    renderCustomBackgrounds() {
        const container = document.getElementById('customBackgrounds');
        container.innerHTML = '';

        this.backgroundsData.custom.forEach(bg => {
            const option = document.createElement('div');
            option.className = 'custom-background-item';
            option.dataset.background = JSON.stringify(bg);
            
            if (this.isCurrentBackground(bg)) {
                option.classList.add('active');
            }

            option.innerHTML = `
                <img src="${bg.url}" alt="自定义背景" class="custom-background-preview">
                <div class="custom-background-actions">
                    <button class="delete-background-btn" data-name="${bg.name}">×</button>
                </div>
            `;

            option.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-background-btn')) {
                    this.selectBackground(bg);
                }
            });

            const deleteBtn = option.querySelector('.delete-background-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCustomBackground(bg.name);
            });

            container.appendChild(option);
        });
    }

    // 检查是否为当前背景
    isCurrentBackground(bg) {
        if (!this.currentBackground) return false;
        return this.currentBackground.name === bg.name && 
               this.currentBackground.type === bg.type;
    }

    // 选择背景
    selectBackground(background) {
        this.currentBackground = background;
        this.applyBackground(background);
        this.saveBackground(background);
        this.updateActiveStates();
        this.showToast(`已切换到 ${background.displayName || background.name}`, 'success');
    }

    // 应用背景
    applyBackground(background) {
        if (!background) {
            // 默认背景
            this.applyDefaultBackground();
            return;
        }

        const backgroundEffects = document.querySelector('.background-effects');
        if (!backgroundEffects) return;

        // 清除所有背景效果
        backgroundEffects.innerHTML = '';

        if (background.type === 'preset') {
            this.applyPresetBackground(background.name, backgroundEffects);
        } else if (background.type === 'custom') {
            this.applyCustomBackground(background.url, backgroundEffects);
        }

        // 始终保持浮动粒子效果
        const particles = document.createElement('div');
        particles.className = 'floating-particles';
        backgroundEffects.appendChild(particles);
    }

    // 应用预设背景
    applyPresetBackground(backgroundName, container) {
        const backgroundDiv = document.createElement('div');
        backgroundDiv.className = backgroundName;
        container.appendChild(backgroundDiv);
    }

    // 应用自定义背景
    applyCustomBackground(imageUrl, container) {
        const backgroundDiv = document.createElement('div');
        backgroundDiv.className = 'custom-background-image';
        backgroundDiv.style.backgroundImage = `url(${imageUrl})`;
        container.appendChild(backgroundDiv);
    }

    // 应用默认背景
    applyDefaultBackground() {
        const backgroundEffects = document.querySelector('.background-effects');
        if (!backgroundEffects) return;

        backgroundEffects.innerHTML = `
            <div class="neon-grid"></div>
            <div class="floating-particles"></div>
        `;
    }

    // 更新激活状态
    updateActiveStates() {
        document.querySelectorAll('.background-option, .custom-background-item').forEach(el => {
            el.classList.remove('active');
        });

        if (this.currentBackground) {
            const activeElement = document.querySelector(
                `[data-background*='"name":"${this.currentBackground.name}"'][data-background*='"type":"${this.currentBackground.type}"']`
            );
            if (activeElement) {
                activeElement.classList.add('active');
            }
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadBackground(file);
        }
    }

    // 处理拖拽
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            this.uploadBackground(imageFile);
        } else {
            this.showToast('请选择图片文件', 'error');
        }
    }

    // 上传背景
    async uploadBackground(file) {
        const formData = new FormData();
        formData.append('background', file);

        try {
            this.showToast('正在上传背景...', 'info');
            
            const response = await fetch('/api/backgrounds', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('背景上传成功', 'success');
                await this.loadBackgrounds();
                this.selectBackground(result.background);
            } else {
                this.showToast(result.error || '上传失败', 'error');
            }
        } catch (error) {
            console.error('Error uploading background:', error);
            this.showToast('上传失败', 'error');
        }
    }

    // 删除自定义背景
    async deleteCustomBackground(backgroundName) {
        if (!confirm('确定要删除这个背景吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/backgrounds/${encodeURIComponent(backgroundName)}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('背景删除成功', 'success');
                
                // 如果删除的是当前背景，切换到默认背景
                if (this.currentBackground && this.currentBackground.name === backgroundName) {
                    this.selectBackground(this.backgroundsData.presets[0]);
                }
                
                await this.loadBackgrounds();
            } else {
                this.showToast(result.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting background:', error);
            this.showToast('删除失败', 'error');
        }
    }

    // 保存背景设置
    saveBackground(background) {
        localStorage.setItem('ai-neon-background', JSON.stringify(background));
    }

    // 加载保存的背景设置
    loadSavedBackground() {
        const saved = localStorage.getItem('ai-neon-background');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error parsing saved background:', error);
            }
        }
        return null;
    }

    // 显示提示消息
    showToast(message, type = 'success') {
        // 如果页面有toast系统，使用它
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // 否则创建简单的提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--glass-bg);
            color: var(--text-light);
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid var(--glass-border);
            backdrop-filter: blur(10px);
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            transition: all 0.3s ease;
        `;
        
        if (type === 'error') {
            toast.style.borderColor = 'var(--secondary-neon)';
            toast.style.color = 'var(--secondary-neon)';
        } else if (type === 'success') {
            toast.style.borderColor = 'var(--accent-neon)';
            toast.style.color = 'var(--accent-neon)';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 在DOM加载完成后初始化背景管理器
document.addEventListener('DOMContentLoaded', function() {
    // 稍微延迟初始化，确保其他脚本已加载
    setTimeout(() => {
        window.backgroundManager = new BackgroundManager();
    }, 100);
}); 