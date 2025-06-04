document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否登录且为管理员
    if (window.Auth && typeof window.Auth.requireAdmin === 'function') {
        // 如果用户不是管理员，Auth.requireAdmin会自动重定向
        if (!window.Auth.requireAdmin()) {
            return; // 终止执行剩余代码
        }
    }

    // DOM 元素
    const themesLoading = document.getElementById('themesLoading');
    const themesAdminGrid = document.getElementById('themesAdminGrid');
    const addThemeBtn = document.getElementById('addThemeBtn');
    const addThemeModal = document.getElementById('addThemeModal');
    const closeAddThemeModal = document.getElementById('closeAddThemeModal');
    const addThemeForm = document.getElementById('addThemeForm');
    const themeNameInput = document.getElementById('themeNameInput');
    const cancelAddTheme = document.getElementById('cancelAddTheme');
    
    // 图片管理区域
    const imageManagementSection = document.getElementById('imageManagementSection');
    const currentThemeName = document.getElementById('currentThemeName');
    const uploadImagesBtn = document.getElementById('uploadImagesBtn');
    const backToThemesBtn = document.getElementById('backToThemesBtn');
    const uploadArea = document.getElementById('uploadArea');
    const uploadBox = uploadArea?.querySelector('.upload-box');
    const imageInput = document.getElementById('imageInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const imagesLoading = document.getElementById('imagesLoading');
    const imagesAdminGrid = document.getElementById('imagesAdminGrid');
    
    // 确认删除模态框
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    // 消息提示
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    // 全局变量
    let currentThemeForImages = null;
    let deleteAction = null;

    // 初始化
    init();

    function init() {
        loadThemes();
        setupEventListeners();
        
        // 显示用户信息
        if (window.Auth && window.Auth.getCurrentUser()) {
            const user = window.Auth.getCurrentUser();
            showToast(`欢迎管理员: ${user.username || '管理员'}`, 'success');
        }
    }

    function setupEventListeners() {
        // 添加主题相关事件
        addThemeBtn.addEventListener('click', () => showModal(addThemeModal));
        closeAddThemeModal.addEventListener('click', () => hideModal(addThemeModal));
        cancelAddTheme.addEventListener('click', () => hideModal(addThemeModal));
        addThemeForm.addEventListener('submit', handleAddTheme);

        // 图片管理相关事件
        uploadImagesBtn.addEventListener('click', toggleUploadArea);
        backToThemesBtn.addEventListener('click', backToThemes);
        selectFilesBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleFileSelect);

        // 拖拽上传
        if (uploadBox) {
            uploadBox.addEventListener('dragover', handleDragOver);
            uploadBox.addEventListener('dragleave', handleDragLeave);
            uploadBox.addEventListener('drop', handleDrop);
        }

        // 确认删除相关事件
        closeConfirmModal.addEventListener('click', () => hideModal(confirmDeleteModal));
        cancelDelete.addEventListener('click', () => hideModal(confirmDeleteModal));
        confirmDelete.addEventListener('click', executeDelete);

        // 点击模态框背景关闭
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                hideModal(e.target);
            }
        });
    }

    // 加载主题
    async function loadThemes() {
        try {
            showLoading(themesLoading, true);
            
            const response = await fetch('/api/themes', {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch themes');
            }
            
            const themes = await response.json();
            displayThemes(themes);
            
        } catch (error) {
            console.error('Error loading themes:', error);
            showToast('加载主题失败', 'error');
        } finally {
            showLoading(themesLoading, false);
        }
    }

    // 获取认证头
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }

    // 显示主题
    function displayThemes(themes) {
        themesAdminGrid.innerHTML = '';
        
        themes.forEach(theme => {
            const themeCard = createThemeCard(theme);
            themesAdminGrid.appendChild(themeCard);
        });
    }

    // 创建主题卡片
    function createThemeCard(theme) {
        const card = document.createElement('div');
        card.className = 'admin-card';
        
        card.innerHTML = `
            <div class="admin-card-header">
                <h3 class="admin-card-title">${theme.displayName}</h3>
                <div class="admin-card-actions">
                    <button class="action-btn primary" onclick="manageImages('${theme.name}')">
                        管理图片
                    </button>
                    <button class="action-btn danger" onclick="deleteTheme('${theme.name}')">
                        删除
                    </button>
                </div>
            </div>
            <div class="admin-card-content">
                <img src="${theme.cover}" alt="${theme.displayName}" class="admin-card-preview" loading="lazy">
                <div class="admin-card-info">
                    <span>${theme.imageCount} 张图片</span>
                    <span class="theme-path">${theme.name}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    // 管理图片
    window.manageImages = function(themeName) {
        currentThemeForImages = themeName;
        currentThemeName.textContent = themeName;
        imageManagementSection.style.display = 'block';
        themesAdminGrid.parentElement.style.display = 'none';
        loadImages(themeName);
    };

    // 加载图片
    async function loadImages(themeName) {
        try {
            showLoading(imagesLoading, true);
            
            const response = await fetch(`/api/themes/${encodeURIComponent(themeName)}/images`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }
            
            const images = await response.json();
            displayImages(images);
            
        } catch (error) {
            console.error('Error loading images:', error);
            showToast('加载图片失败', 'error');
        } finally {
            showLoading(imagesLoading, false);
        }
    }

    // 显示图片
    function displayImages(images) {
        imagesAdminGrid.innerHTML = '';
        
        if (images.length === 0) {
            imagesAdminGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px; color: var(--accent-neon);">📷</div>
                    <h3 style="color: var(--accent-neon); margin-bottom: 10px;">暂无图片</h3>
                    <p style="color: var(--text-dim);">点击上传按钮添加第一张图片</p>
                </div>
            `;
            return;
        }
        
        images.forEach(image => {
            const imageCard = createImageCard(image);
            imagesAdminGrid.appendChild(imageCard);
        });
    }

    // 创建图片卡片
    function createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'admin-card image-admin-card';
        
        // 计算文件大小
        const size = formatFileSize(image.size || 0);
        
        card.innerHTML = `
            <div class="admin-card-actions">
                <button class="action-btn danger" onclick="deleteImage('${image.name}')">
                    删除
                </button>
            </div>
            <div class="admin-card-content">
                <img src="${image.url}" alt="${image.name}" class="admin-card-preview" loading="lazy">
                <div class="admin-card-info">
                    <span class="image-name" title="${image.name}">${truncateText(image.name, 20)}</span>
                    <span class="image-size">${size}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    // 返回主题管理
    function backToThemes() {
        imageManagementSection.style.display = 'none';
        themesAdminGrid.parentElement.style.display = 'block';
        uploadArea.classList.add('hidden');
        currentThemeForImages = null;
    }

    // 处理添加主题
    async function handleAddTheme(e) {
        e.preventDefault();
        
        const themeName = themeNameInput.value.trim();
        if (!themeName) {
            showToast('请输入主题名称', 'error');
            return;
        }
        
        try {
            hideModal(addThemeModal);
            showToast('正在创建主题...', 'info');
            
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ name: themeName })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create theme');
            }
            
            loadThemes();
            showToast('主题创建成功');
            themeNameInput.value = '';
            
        } catch (error) {
            console.error('Error creating theme:', error);
            showToast(error.message || '创建主题失败', 'error');
        }
    }

    // 删除主题
    window.deleteTheme = function(themeName) {
        deleteAction = async () => {
            try {
                const response = await fetch(`/api/themes/${encodeURIComponent(themeName)}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete theme');
                }
                
                loadThemes();
                showToast('主题删除成功');
            } catch (error) {
                console.error('Error deleting theme:', error);
                showToast('删除主题失败', 'error');
            }
        };
        
        deleteMessage.textContent = `确定要删除主题 "${themeName}" 吗？该操作无法撤销。`;
        showModal(confirmDeleteModal);
    };

    // 删除图片
    window.deleteImage = function(imagePath) {
        const themeName = currentThemeForImages;
        const imageName = imagePath.split('/').pop();
        
        deleteAction = async () => {
            try {
                const response = await fetch(`/api/themes/${encodeURIComponent(themeName)}/images/${encodeURIComponent(imageName)}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete image');
                }
                
                loadImages(themeName);
                showToast('图片删除成功');
            } catch (error) {
                console.error('Error deleting image:', error);
                showToast('删除图片失败', 'error');
            }
        };
        
        deleteMessage.textContent = `确定要删除图片 "${imageName}" 吗？该操作无法撤销。`;
        showModal(confirmDeleteModal);
    };

    // 执行删除操作
    async function executeDelete() {
        if (typeof deleteAction === 'function') {
            hideModal(confirmDeleteModal);
            await deleteAction();
            deleteAction = null;
        }
    }

    // 切换上传区域
    function toggleUploadArea() {
        uploadArea.classList.toggle('hidden');
    }

    // 处理文件选择
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            uploadFiles(files);
        }
    }

    // 拖拽处理
    function handleDragOver(e) {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            uploadFiles(files);
        } else {
            showToast('请选择图片文件', 'error');
        }
    }

    // 上传文件
    async function uploadFiles(files) {
        if (!currentThemeForImages) {
            showToast('请先选择主题', 'error');
            return;
        }
        
        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });
        
        try {
            showUploadProgress(true);
            
            const response = await fetch(`/api/themes/${encodeURIComponent(currentThemeForImages)}/images`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast(result.message, 'success');
                loadImages(currentThemeForImages);
                uploadArea.classList.add('hidden');
                imageInput.value = ''; // 清空文件输入
            } else {
                showToast(result.error || '上传失败', 'error');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showToast('上传失败', 'error');
        } finally {
            showUploadProgress(false);
        }
    }

    // 显示/隐藏上传进度
    function showUploadProgress(show) {
        if (show) {
            uploadProgress.classList.remove('hidden');
            progressFill.style.width = '0%';
            progressText.textContent = '上传中...';
            
            // 模拟进度
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 90) {
                    clearInterval(interval);
                    progress = 90;
                }
                progressFill.style.width = progress + '%';
            }, 200);
        } else {
            progressFill.style.width = '100%';
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
            }, 500);
        }
    }

    function showModal(modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }

    function hideModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }, 300);
    }

    function showLoading(element, show) {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        if (type === 'success') {
            toast.className = 'toast success';
            toastIcon.textContent = '✓';
        } else if (type === 'error') {
            toast.className = 'toast error';
            toastIcon.textContent = '✕';
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 导出showToast函数给背景管理系统使用
    window.showToast = showToast;

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}); 