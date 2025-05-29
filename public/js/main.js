document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const themesGrid = document.getElementById('themesGrid');
    const themeCount = document.getElementById('themeCount');

    // 加载主题
    loadThemes();

    async function loadThemes() {
        try {
            showLoading(true);
            
            const response = await fetch('/api/themes');
            if (!response.ok) {
                throw new Error('Failed to fetch themes');
            }
            
            const themes = await response.json();
            displayThemes(themes);
            updateThemeCount(themes.length);
            
        } catch (error) {
            console.error('Error loading themes:', error);
            showError('加载主题失败，请刷新页面重试');
        } finally {
            showLoading(false);
        }
    }

    function displayThemes(themes) {
        themesGrid.innerHTML = '';
        
        themes.forEach(theme => {
            const themeCard = createThemeCard(theme);
            themesGrid.appendChild(themeCard);
        });

        // 添加动画效果
        animateThemeCards();
    }

    function createThemeCard(theme) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        card.innerHTML = `
            <div class="theme-overlay"></div>
            <img src="${theme.cover}" alt="${theme.displayName}" class="theme-cover" loading="lazy">
            <div class="theme-info">
                <h3 class="theme-name">${theme.displayName}</h3>
                <p class="theme-count-text">${theme.imageCount} 张图片</p>
            </div>
        `;

        // 点击事件
        card.addEventListener('click', () => {
            navigateToTheme(theme.name);
        });

        // 图片加载错误处理
        const img = card.querySelector('.theme-cover');
        img.addEventListener('error', () => {
            img.src = '/placeholder.svg';
            img.alt = '图片加载失败';
        });

        return card;
    }

    function animateThemeCards() {
        const cards = document.querySelectorAll('.theme-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    function navigateToTheme(themeName) {
        const encodedThemeName = encodeURIComponent(themeName);
        window.location.href = `/theme/${encodedThemeName}`;
    }

    function updateThemeCount(count) {
        themeCount.textContent = count;
        
        // 数字动画效果
        animateNumber(themeCount, 0, count, 1000);
    }

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
            themesGrid.classList.add('hidden');
        } else {
            loading.classList.add('hidden');
            themesGrid.classList.remove('hidden');
        }
    }

    function showError(message) {
        themesGrid.innerHTML = `
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
}); 