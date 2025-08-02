// 简化的背景控制系统
class SimpleBackgroundController {
    constructor() {
        this.isTerminalActive = false; // 将在故障终端加载成功后设为 true
        this.terminalInstance = null;
        this.init();
    }

    async init() {
        // 设置故障终端作为默认背景
        await this.setTerminalAsDefault();
        
        // 绑定按钮事件
        this.bindEvents();
    }

    bindEvents() {
        // 背景切换按钮已移除，保持故障终端背景
    }

    async setTerminalAsDefault() {
        const container = document.getElementById('backgroundContainer');
        
        if (container) {
            try {
                await this.loadTerminalBackground(container);
                this.isTerminalActive = true;
                console.log('故障终端背景已加载');
            } catch (error) {
                console.error('故障终端加载失败:', error);
            }
        }
    }

    setGridBackground() {
        const container = document.getElementById('backgroundContainer');
        if (container) {
            container.innerHTML = `
                <div class="neon-grid"></div>
                <div class="floating-particles"></div>
            `;
        }
    }

    async toggleBackground() {
        const container = document.getElementById('backgroundContainer');
        const toggleBtn = document.getElementById('backgroundToggle');
        
        if (!container) return;

        if (this.isTerminalActive) {
            // 切换到网格背景
            this.cleanupTerminal();
            this.setGridBackground();
            this.isTerminalActive = false;
            
            if (toggleBtn) {
                toggleBtn.innerHTML = '<span>🎨</span> 背景';
                toggleBtn.title = '切换到故障终端背景';
            }
            
            this.showMessage('已切换到网格背景', 'success');
        } else {
            // 切换回故障终端背景
            try {
                await this.loadTerminalBackground(container);
                this.isTerminalActive = true;
                
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<span>🔳</span> 默认';
                    toggleBtn.title = '切换到网格背景';
                }
                
                this.showMessage('已切换到故障终端背景', 'success');
            } catch (error) {
                console.error('故障终端加载失败:', error);
                this.showMessage('故障终端加载失败', 'error');
            }
        }
    }

    async loadTerminalBackground(container) {
        console.log('加载故障终端背景...');
        
        // 清除现有内容
        container.innerHTML = '';
        
        // 动态导入故障终端模块
        const { FaultyTerminal } = await import('./FaultyTerminal.js');
        
        // 创建终端容器
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
        
        // 创建故障终端实例
        this.terminalInstance = new FaultyTerminal(terminalContainer, {
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
        });
        
        console.log('故障终端背景加载成功');
    }

    cleanupTerminal() {
        if (this.terminalInstance) {
            this.terminalInstance.destroy();
            this.terminalInstance = null;
        }
    }

    showMessage(message, type = 'info') {
        // 创建简单的消息提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #00ffff;
            color: #00ffff;
            padding: 15px 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        `;
        
        if (type === 'error') {
            toast.style.borderColor = '#ff0080';
            toast.style.color = '#ff0080';
        } else if (type === 'success') {
            toast.style.borderColor = '#ffff00';
            toast.style.color = '#ffff00';
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.backgroundController = new SimpleBackgroundController();
});