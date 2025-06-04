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

    // 上传和管理元素
    const uploadBtn = document.getElementById('uploadBtn');
    const manageBtn = document.getElementById('manageBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // 确认删除模态框
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    // 消息提示
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    let currentImages = [];
    let currentImageIndex = 0;
    let isManageMode = false;
    let imageToDelete = null;

    // 从URL获取主题名称
    const pathParts = window.location.pathname.split('/');
    const currentThemeName = decodeURIComponent(pathParts[pathParts.length - 1]);

    // 初始化
    init();
    setupEventListeners();

    async function init() {
        try {
            updatePageTitle(currentThemeName);
            await loadImages(currentThemeName);
        } catch (error) {
            console.error('Error initializing theme page:', error);
            showError('加载失败，请刷新页面重试');
        }
    }

    function setupEventListeners() {
        // 检查管理员权限
        checkAdminPermissions();

        // 上传按钮事件
        uploadBtn.addEventListener('click', () => {
            if (hasAdminPermission()) {
                toggleUploadArea();
            } else {
                showAdminRequired();
            }
        });
        selectFilesBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);

        // 管理按钮事件
        manageBtn.addEventListener('click', () => {
            if (hasAdminPermission()) {
                toggleManageMode();
            } else {
                showAdminRequired();
            }
        });

        // 拖拽上传事件
        const uploadBox = uploadArea.querySelector('.upload-box');
        uploadBox.addEventListener('dragover', handleDragOver);
        uploadBox.addEventListener('dragleave', handleDragLeave);
        uploadBox.addEventListener('drop', handleDrop);

        // 确认删除模态框事件
        cancelDelete.addEventListener('click', () => hideModal(confirmDeleteModal));
        confirmDelete.addEventListener('click', handleConfirmDelete);

        // 点击模态框背景关闭
        confirmDeleteModal.addEventListener('click', function(e) {
            if (e.target === confirmDeleteModal) {
                hideModal(confirmDeleteModal);
            }
        });
    }

    function updatePageTitle(name) {
        themeName.textContent = name;
        themeTitle.textContent = name;
        document.title = `${name} - AI NEON'world`;
    }

    async function loadImages(name) {
        try {
            showLoading(true);
            
            const response = await fetch(`/api/themes/${encodeURIComponent(name)}/images`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            
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
        card.className = 'image-card image-item';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.dataset.imagePath = image.path;

        card.innerHTML = `
            <img src="${image.url}" alt="${image.name}" class="image-thumbnail" loading="lazy">
        `;

        // 点击事件
        card.addEventListener('click', (e) => {
            if (isManageMode) {
                // 管理模式下点击删除按钮区域
                const rect = card.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // 检查是否点击了右上角删除区域
                if (clickX > rect.width - 40 && clickY < 40) {
                    showDeleteConfirmation(image);
                    return;
                }
            }

            // 正常模式下打开模态框
            if (!isManageMode) {
                openModal(index);
            }
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

    // 获取认证头
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }

    // 上传和管理功能
    function toggleUploadArea() {
        uploadArea.classList.toggle('hidden');
        if (!uploadArea.classList.contains('hidden')) {
            uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function toggleManageMode() {
        isManageMode = !isManageMode;
        const imageItems = document.querySelectorAll('.image-item');

        if (isManageMode) {
            manageBtn.textContent = '✓ 完成管理';
            manageBtn.style.background = 'var(--secondary-neon)';
            imageItems.forEach(item => item.classList.add('manage-mode'));
        } else {
            manageBtn.innerHTML = '<span>🗑️</span> 管理图片';
            manageBtn.style.background = '';
            imageItems.forEach(item => item.classList.remove('manage-mode'));
        }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            uploadFiles(files);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            uploadFiles(files);
        } else {
            showToastMessage('请选择图片文件', 'error');
        }
    }

    async function uploadFiles(files) {
        if (files.length === 0) return;

        if (!hasAdminPermission()) {
            showAdminRequired();
            return;
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            showUploadProgress(true);

            const response = await fetch(`/api/themes/${encodeURIComponent(currentThemeName)}/images`, {
                method: 'POST',
                headers: {
                    'X-Admin-Key': getAdminKey()
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToastMessage(result.message, 'success');
                await loadImages(currentThemeName);
                uploadArea.classList.add('hidden');
                fileInput.value = '';
            } else {
                showToastMessage(result.error || '上传失败', 'error');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showToastMessage('上传失败', 'error');
        } finally {
            showUploadProgress(false);
        }
    }

    function showUploadProgress(show) {
        if (show) {
            uploadProgress.classList.remove('hidden');
            progressFill.style.width = '0%';
            progressText.textContent = '上传中...';

            // 模拟进度
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 90) progress = 90;
                progressFill.style.width = progress + '%';

                if (progress >= 90) {
                    clearInterval(interval);
                }
            }, 200);
        } else {
            progressFill.style.width = '100%';
            progressText.textContent = '上传完成';
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
            }, 1000);
        }
    }

    function showDeleteConfirmation(image) {
        imageToDelete = image;
        deleteMessage.textContent = `确定要删除图片 "${image.name}" 吗？此操作无法撤销。`;
        showModal(confirmDeleteModal);
    }

    async function handleConfirmDelete() {
        if (!imageToDelete) return;

        if (!hasAdminPermission()) {
            showAdminRequired();
            hideModal(confirmDeleteModal);
            return;
        }

        try {
            const imageName = imageToDelete.name;
            const response = await fetch(`/api/themes/${encodeURIComponent(currentThemeName)}/images/${encodeURIComponent(imageName)}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Key': getAdminKey()
                }
            });

            const result = await response.json();

            if (result.success) {
                showToastMessage('图片删除成功', 'success');
                await loadImages(currentThemeName);
            } else {
                showToastMessage(result.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            showToastMessage('删除失败', 'error');
        } finally {
            hideModal(confirmDeleteModal);
            imageToDelete = null;
        }
    }

    function showModal(modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    function hideModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    function showToastMessage(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 权限管理函数
    function hasAdminPermission() {
        return localStorage.getItem('adminKey') !== null;
    }

    function getAdminKey() {
        return localStorage.getItem('adminKey');
    }

    function checkAdminPermissions() {
        if (!hasAdminPermission()) {
            // 如果没有管理员权限，完全隐藏管理功能
            uploadBtn.style.display = 'none';
            manageBtn.style.display = 'none';
            uploadArea.style.display = 'none';
        } else {
            // 如果有管理员权限，显示管理功能
            uploadBtn.style.display = 'flex';
            manageBtn.style.display = 'flex';
            uploadBtn.style.opacity = '1';
            manageBtn.style.opacity = '1';
            uploadBtn.title = '上传图片';
            manageBtn.title = '管理图片';
        }
    }

    function showAdminRequired() {
        // 这个函数现在主要用于后备保护，因为按钮已经隐藏
        const message = '此操作需要管理员权限。';
        showToastMessage(message, 'error');
    }
});