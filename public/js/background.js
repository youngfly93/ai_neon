// 背景管理系统
class BackgroundManager {
    constructor() {
        this.currentBackground = this.loadSavedBackground();
        this.backgroundsData = { presets: [], custom: [] };
        this.faultyTerminal = null;
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

        console.log('应用背景:', background);
        
        const backgroundEffects = document.querySelector('.background-effects');
        if (!backgroundEffects) return;

        // 清除所有背景效果和故障终端
        this.cleanupBackground();
        backgroundEffects.innerHTML = '';

        if (background.type === 'preset') {
            this.applyPresetBackground(background.name, backgroundEffects);
        } else if (background.type === 'custom') {
            this.applyCustomBackground(background.url, backgroundEffects);
        }

        // 对于非故障终端背景，保持浮动粒子效果
        if (background.name !== 'faulty-terminal') {
            const particles = document.createElement('div');
            particles.className = 'floating-particles';
            backgroundEffects.appendChild(particles);
        }
    }

    // 应用预设背景
    applyPresetBackground(backgroundName, container) {
        if (backgroundName === 'faulty-terminal') {
            this.applyFaultyTerminal(container);
        } else {
            const backgroundDiv = document.createElement('div');
            backgroundDiv.className = backgroundName;
            container.appendChild(backgroundDiv);
        }
    }

    // 应用故障终端背景
    async applyFaultyTerminal(container) {
        try {
            console.log('尝试导入 FaultyTerminal...');
            // 动态导入故障终端模块
            const module = await import('./FaultyTerminal.js');
            const { FaultyTerminal } = module;
            
            console.log('FaultyTerminal 导入成功:', FaultyTerminal);
            
            // 创建容器
            const terminalContainer = document.createElement('div');
            terminalContainer.className = 'faulty-terminal-container';
            terminalContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
            `;
            
            container.appendChild(terminalContainer);
            
            console.log('正在创建 FaultyTerminal 实例...');
            
            const options = {
                scale: 1.5,
                gridMul: [2, 1],
                digitSize: 0.6,  // Digit Size: 0.6
                timeScale: 0.5,  // Speed: 0.5
                pause: false,
                scanlineIntensity: 0.5,  // Scanline Intensity: 0.5
                glitchAmount: 1,
                flickerAmount: 1,
                noiseAmp: 1,  // Noise Amplitude: 1
                chromaticAberration: 0,
                dither: 0,
                curvature: 0.5,  // Curvature: 0.5
                tint: "#a7ef9e",  // RGB(167, 239, 158)
                mouseReact: true,  // Mouse React: 开启
                mouseStrength: 0.5,  // Mouse Strength: 0.5
                pageLoadAnimation: true,  // Page Load Animation: 开启
                brightness: 0.6  // Brightness: 0.6
            };
            
            console.log('FaultyTerminal 参数:', options);
            
            // 创建故障终端实例
            this.faultyTerminal = new FaultyTerminal(terminalContainer, options);
            
            console.log('FaultyTerminal 实例创建成功');
            
        } catch (error) {
            console.error('Failed to load FaultyTerminal:', error);
            this.showToast('故障终端加载失败，使用默认背景', 'error');
            
            // 降级到默认背景
            const backgroundDiv = document.createElement('div');
            backgroundDiv.className = 'neon-grid';
            container.appendChild(backgroundDiv);
        }
    }

    // 清理背景效果
    cleanupBackground() {
        // 清理故障终端实例
        if (this.faultyTerminal) {
            this.faultyTerminal.destroy();
            this.faultyTerminal = null;
        }
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

        this.cleanupBackground();
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