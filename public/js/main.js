import Masonry from './Masonry.js';

document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const masonryContainer = document.getElementById('chromaGridContainer');
    // const themeCount = document.getElementById('themeCount'); // 已移除主题计数器
    
    let masonryGrid = null;

    // 管理员状态元素
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const adminStatus = document.getElementById('adminStatus');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    // 初始化
    console.log('页面加载完成，开始初始化...');

    // 检查管理员状态并设置UI
    checkAdminStatus();
    loadThemes();
    
    // 初始化3D Pin组件
    init3DPin();

    // 管理员登出事件
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminKey');
            checkAdminStatus();
            showToast('已退出管理员模式', 'success');
        });
    }

    // 监听管理员状态变化事件
    window.addEventListener('adminStatusChanged', function() {
        checkAdminStatus();
    });

    async function loadThemes() {
        try {
            showLoading(true);
            
            // 首先尝试从静态JSON文件加载（Vercel环境）
            let response = await fetch('/themes.json');
            
            if (!response.ok) {
                // 如果静态文件失败，尝试API
                response = await fetch('/api/themes', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch themes');
                }
            }
            
            const themes = await response.json();
            displayThemes(themes);
            
        } catch (error) {
            console.error('Error loading themes:', error);
            showError('加载主题失败，请刷新页面重试');
        } finally {
            showLoading(false);
        }
    }

    function displayThemes(themes) {
        // 转换主题数据为 Masonry 格式
        const masonryItems = themes.map(theme => ({
            image: theme.cover,
            img: theme.cover, // 兼容两种属性名
            title: theme.displayName,
            displayName: theme.displayName,
            subtitle: `${theme.imageCount} 张图片`,
            imageCount: theme.imageCount,
            name: theme.name,
            handle: theme.name,
            // 等比例放大高度 1.5倍
            height: Math.floor((theme.imageCount > 20 ? 280 : theme.imageCount > 10 ? 240 : 200) * 1.5),
            url: `/theme/${encodeURIComponent(theme.name)}`
        }));

        // 清理旧的网格
        if (masonryGrid) {
            masonryGrid.destroy();
        }

        // 创建新的 Masonry 瀑布流
        masonryGrid = new Masonry(masonryContainer, {
            items: masonryItems,
            ease: "power3.out",
            duration: 0.6,
            stagger: 0.03,
            animateFrom: "bottom",
            scaleOnHover: true,
            hoverScale: 0.98,
            blurToFocus: true,
            colorShiftOnHover: false
        });
    }

    function getRandomNeonColor() {
        const neonColors = [
            '#00ffff', // 青色
            '#ff0080', // 洋红
            '#ffff00', // 黄色
            '#80ff00', // 绿黄
            '#ff8000', // 橙色
            '#8000ff', // 紫色
            '#ff0040', // 红粉
            '#40ff00'  // 绿色
        ];
        return neonColors[Math.floor(Math.random() * neonColors.length)];
    }

    function getRandomNeonGradient() {
        const gradients = [
            'linear-gradient(145deg, #00ffff, #000)',
            'linear-gradient(180deg, #ff0080, #000)',
            'linear-gradient(210deg, #ffff00, #000)',
            'linear-gradient(165deg, #80ff00, #000)',
            'linear-gradient(195deg, #ff8000, #000)',
            'linear-gradient(225deg, #8000ff, #000)',
            'linear-gradient(135deg, #ff0040, #000)',
            'linear-gradient(270deg, #40ff00, #000)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    // 注意：旧的主题卡片函数已被 ChromaGrid 替代

    function navigateToTheme(themeName) {
        const encodedThemeName = encodeURIComponent(themeName);
        window.location.href = `/theme/${encodedThemeName}`;
    }

    // 已移除主题计数器功能
    // function updateThemeCount(count) {
    //     themeCount.textContent = count;
    //     
    //     // 数字动画效果
    //     animateNumber(themeCount, 0, count, 1000);
    // }

    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * easeOutQuart(progress));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function showLoading(show) {
        if (show) {
            loading.classList.remove('hidden');
            masonryContainer.classList.add('hidden');
        } else {
            loading.classList.add('hidden');
            masonryContainer.classList.remove('hidden');
        }
    }

    function showError(message) {
        masonryContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: var(--secondary-neon);">⚠️</div>
                <h3 style="color: var(--secondary-neon); margin-bottom: 10px;">出错了</h3>
                <p style="color: var(--text-dim);">${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: var(--primary-neon);
                    color: var(--bg-dark);
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: 'Orbitron', monospace;
                    font-weight: 600;
                ">重新加载</button>
            </div>
        `;
    }

    // 添加键盘快捷键
    document.addEventListener('keydown', function(event) {
        if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
            event.preventDefault();
            location.reload();
        }
    });

    // 添加鼠标粒子效果
    createMouseParticles();

    function createMouseParticles() {
        document.addEventListener('mousemove', function(e) {
            if (Math.random() > 0.9) { // 减少粒子频率
                createParticle(e.clientX, e.clientY);
            }
        });
    }

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: var(--primary-neon);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            left: ${x}px;
            top: ${y}px;
            box-shadow: 0 0 6px var(--primary-neon);
            animation: particleFade 1s ease-out forwards;
        `;

        document.body.appendChild(particle);

        // 移除粒子
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }

    // 添加粒子动画样式
    if (!document.querySelector('#particle-style')) {
        const style = document.createElement('style');
        style.id = 'particle-style';
        style.textContent = `
            @keyframes particleFade {
                0% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.5) translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 简单的toast函数供背景管理系统使用
    window.showToast = function(message, type = 'success') {
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

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };

    // 管理员状态检查函数
    function checkAdminStatus() {
        const hasAdminKey = localStorage.getItem('adminKey') !== null;
        const adminLinks = document.getElementById('adminLinks');

        // 检查是否有特殊参数显示管理员入口（例如 ?admin=true）
        const urlParams = new URLSearchParams(window.location.search);
        const showAdminEntry = urlParams.get('admin') === 'true';

        console.log('检查管理员状态:', { hasAdminKey, adminKey: localStorage.getItem('adminKey'), showAdminEntry });
        console.log('DOM元素:', { adminPanelBtn, adminStatus, adminLinks });

        if (hasAdminKey) {
            // 管理员模式：显示管理状态和管理链接，隐藏验证入口
            console.log('设置管理员模式UI');
            adminPanelBtn?.classList.add('hidden');
            adminStatus?.classList.remove('hidden');
            adminLinks?.classList.remove('hidden');
        } else {
            // 访客模式：默认隐藏所有管理功能，除非有特殊参数
            console.log('设置访客模式UI');
            if (showAdminEntry) {
                adminPanelBtn?.classList.remove('hidden');
            } else {
                adminPanelBtn?.classList.add('hidden');
            }
            adminStatus?.classList.add('hidden');
            adminLinks?.classList.add('hidden');
        }
    }

    // 使用window.showToast作为showToast的别名
    window.showToast = window.showToast || function(message, type = 'success') {
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

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };


    // 初始化3D Pin组件
    function init3DPin() {
        const pinContainer = document.getElementById('pinContainer');
        if (pinContainer && window.ThreeDPin) {
            try {
                const threeDPin = new ThreeDPin(pinContainer, {
                    title: 'AI NEON\'world',
                    href: '#',
                    imageUrl: '/neon_ai.gif'
                });
                
                console.log('3D Pin组件初始化成功');
            } catch (error) {
                console.error('3D Pin组件初始化失败:', error);
            }
        }
    }
});