/**
 * 3D Pin组件 - 纯JavaScript版本
 * 基于Aceternity UI的3D Pin效果
 */

class ThreeDPin {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            title: options.title || 'AI NEON\'world',
            hoverTitle: options.hoverTitle || '抖音:ai neon(接定制）',
            href: options.href || '#',
            imageUrl: options.imageUrl || '/images/neon.jpg',
            width: options.width || 320,
            height: options.height || 200,
            ...options
        };

        this.isHovering = false;
        this.init();
    }

    init() {
        this.createPinContainer();
        this.setupEventListeners();
        this.createAnimations();
    }

    createPinContainer() {
        this.container.innerHTML = `
            <div class="pin-wrapper">
                <a href="${this.options.href}" class="pin-link">
                    <!-- 主要内容区域 -->
                    <div class="pin-perspective-container">
                        <div class="pin-content-container">
                            <div class="pin-content">
                                <div class="pin-image-wrapper">
                                    <img src="${this.options.imageUrl}" alt="3D Pin Image" class="pin-image">
                                </div>
                                <div class="pin-info">
                                    <h3 class="pin-title">${this.options.title}</h3>
                                    <p class="pin-description">赛博朋克风格展示卡片</p>
                                </div>
                                <div class="pin-gradient-bg"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 3D透视效果 -->
                    <div class="pin-perspective-overlay">
                        <div class="pin-hover-title">
                            <span>${this.options.hoverTitle}</span>
                        </div>
                        
                        <!-- 动画圆圈 -->
                        <div class="pin-circles">
                            <div class="pin-circle pin-circle-1"></div>
                            <div class="pin-circle pin-circle-2"></div>
                            <div class="pin-circle pin-circle-3"></div>
                        </div>
                        
                        <!-- 光束效果 -->
                        <div class="pin-beam-container">
                            <div class="pin-beam pin-beam-blur"></div>
                            <div class="pin-beam pin-beam-solid"></div>
                            <div class="pin-beam-dot pin-beam-dot-blur"></div>
                            <div class="pin-beam-dot pin-beam-dot-solid"></div>
                        </div>
                    </div>
                </a>
            </div>
        `;

        this.pinLink = this.container.querySelector('.pin-link');
        this.contentContainer = this.container.querySelector('.pin-content-container');
        this.perspectiveOverlay = this.container.querySelector('.pin-perspective-overlay');
    }

    setupEventListeners() {
        this.pinLink.addEventListener('mouseenter', () => this.onMouseEnter());
        this.pinLink.addEventListener('mouseleave', () => this.onMouseLeave());
    }

    onMouseEnter() {
        this.isHovering = true;
        this.contentContainer.style.transform = 'translate(-50%, -50%) rotateX(40deg) scale(0.8)';
        this.perspectiveOverlay.style.opacity = '1';
        
        // 触发光束动画
        const beams = this.container.querySelectorAll('.pin-beam');
        beams.forEach(beam => {
            beam.style.height = '160px';
        });
    }

    onMouseLeave() {
        this.isHovering = false;
        this.contentContainer.style.transform = 'translate(-50%, -50%) rotateX(0deg) scale(1)';
        this.perspectiveOverlay.style.opacity = '0';
        
        // 重置光束动画
        const beams = this.container.querySelectorAll('.pin-beam');
        beams.forEach(beam => {
            beam.style.height = '80px';
        });
    }

    createAnimations() {
        // CSS动画通过样式表处理
        // 这里可以添加更复杂的JavaScript动画逻辑
    }

    destroy() {
        if (this.pinLink) {
            this.pinLink.removeEventListener('mouseenter', this.onMouseEnter);
            this.pinLink.removeEventListener('mouseleave', this.onMouseLeave);
        }
        this.container.innerHTML = '';
    }
}

// 导出供全局使用
window.ThreeDPin = ThreeDPin;