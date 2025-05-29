document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const imagesGrid = document.getElementById('imagesGrid');
    const imageCount = document.getElementById('imageCount');
    const themeName = document.getElementById('themeName');
    const themeTitle = document.getElementById('themeTitle');
    
    // 模态框元素
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const imageName = document.getElementById('imageName');
    const currentIndex = document.getElementById('currentIndex');
    const totalImages = document.getElementById('totalImages');

    let currentImages = [];
    let currentImageIndex = 0;

    // 从URL获取主题名称
    const pathParts = window.location.pathname.split('/');
    const currentThemeName = decodeURIComponent(pathParts[pathParts.length - 1]);

    // 初始化
    init();

    async function init() {
        try {
            updatePageTitle(currentThemeName);
            await loadImages(currentThemeName);
        } catch (error) {
            console.error('Error initializing theme page:', error);
            showError('加载失败，请刷新页面重试');
        }
    }

    function updatePageTitle(name) {
        themeName.textContent = name;
        themeTitle.textContent = name;
        document.title = `${name} - AI NEON'world`;
    }

    async function loadImages(name) {
        try {
            showLoading(true);
            
            const response = await fetch(`/api/themes/${encodeURIComponent(name)}/images`);
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }
            
            const images = await response.json();
            currentImages = images;
            displayImages(images);
            updateImageCount(images.length);
            
        } catch (error) {
            console.error('Error loading images:', error);
            showError('加载图片失败，请刷新页面重试');
        } finally {
            showLoading(false);
        }
    }

    function displayImages(images) {
        imagesGrid.innerHTML = '';
        
        if (images.length === 0) {
            showEmptyState();
            return;
        }
        
        images.forEach((image, index) => {
            const imageCard = createImageCard(image, index);
            imagesGrid.appendChild(imageCard);
        });

        // 添加动画效果
        animateImageCards();
    }

    function createImageCard(image, index) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        card.innerHTML = `
            <img src="${image.url}" alt="${image.name}" class="image-thumbnail" loading="lazy">
        `;

        // 点击事件
        card.addEventListener('click', () => {
            openModal(index);
        });

        // 图片加载错误处理
        const img = card.querySelector('.image-thumbnail');
        img.addEventListener('error', () => {
            img.style.background = 'var(--glass-bg)';
            img.alt = '图片加载失败';
        });

        return card;
    }

    function animateImageCards() {
        const cards = document.querySelectorAll('.image-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    function openModal(index) {
        currentImageIndex = index;
        updateModalContent();
        imageModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 添加打开动画
        setTimeout(() => {
            imageModal.style.opacity = '1';
        }, 10);
    }

    function closeModalHandler() {
        imageModal.style.opacity = '0';
        setTimeout(() => {
            imageModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    function updateModalContent() {
        const image = currentImages[currentImageIndex];
        modalImage.src = image.url;
        imageName.textContent = image.name;
        currentIndex.textContent = currentImageIndex + 1;
        totalImages.textContent = currentImages.length;
        
        // 更新导航按钮状态
        prevBtn.style.opacity = currentImageIndex > 0 ? '1' : '0.5';
        nextBtn.style.opacity = currentImageIndex < currentImages.length - 1 ? '1' : '0.5';
    }

    function navigateModal(direction) {
        if (direction === 'prev' && currentImageIndex > 0) {
            currentImageIndex--;
        } else if (direction === 'next' && currentImageIndex < currentImages.length - 1) {
            currentImageIndex++;
        }
        updateModalContent();
    }

    function updateImageCount(count) {
        imageCount.textContent = count;
        
        // 数字动画效果
        animateNumber(imageCount, 0, count, 800);
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
            imagesGrid.classList.add('hidden');
        } else {
            loading.classList.add('hidden');
            imagesGrid.classList.remove('hidden');
        }
    }

    function showError(message) {
        imagesGrid.innerHTML = `
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

    function showEmptyState() {
        imagesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: var(--accent-neon);">📷</div>
                <h3 style="color: var(--accent-neon); margin-bottom: 10px;">暂无图片</h3>
                <p style="color: var(--text-dim);">这个主题还没有图片</p>
                <a href="/" style="
                    display: inline-block;
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: var(--primary-neon);
                    color: var(--bg-dark);
                    text-decoration: none;
                    border-radius: 20px;
                    font-family: 'Orbitron', monospace;
                    font-weight: 600;
                ">返回主页</a>
            </div>
        `;
    }

    // 事件监听器
    closeModal.addEventListener('click', closeModalHandler);
    prevBtn.addEventListener('click', () => navigateModal('prev'));
    nextBtn.addEventListener('click', () => navigateModal('next'));

    // 点击模态框背景关闭
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeModalHandler();
        }
    });

    // 键盘导航
    document.addEventListener('keydown', function(event) {
        if (imageModal.style.display === 'block') {
            switch(event.key) {
                case 'Escape':
                    closeModalHandler();
                    break;
                case 'ArrowLeft':
                    navigateModal('prev');
                    break;
                case 'ArrowRight':
                    navigateModal('next');
                    break;
            }
        }
    });

    // 触摸手势支持
    let touchStartX = 0;
    let touchEndX = 0;

    imageModal.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    imageModal.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    });

    function handleGesture() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // 向左滑动，下一张
                navigateModal('next');
            } else {
                // 向右滑动，上一张
                navigateModal('prev');
            }
        }
    }

    // 预加载相邻图片
    function preloadAdjacentImages() {
        const preloadIndices = [
            currentImageIndex - 1,
            currentImageIndex + 1
        ].filter(index => index >= 0 && index < currentImages.length);

        preloadIndices.forEach(index => {
            const img = new Image();
            img.src = currentImages[index].url;
        });
    }

    // 当模态框打开时预加载图片
    const originalUpdateModalContent = updateModalContent;
    updateModalContent = function() {
        originalUpdateModalContent();
        preloadAdjacentImages();
    };

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