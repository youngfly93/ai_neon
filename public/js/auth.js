// auth.js - 处理客户端认证

// 用户状态
let currentUser = null;

// DOM元素
const userInfoElement = document.getElementById('userInfo');
const usernameElement = userInfoElement ? userInfoElement.querySelector('.username') : null;
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// 初始化认证状态
function initAuth() {
    // 检查本地存储
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateUIForLoggedInUser();
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('user');
        }
    }
    
    // 检查服务器会话
    checkAuthStatus();
    
    // 注册登出事件
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// 检查认证状态
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.loggedIn) {
            // 更新用户信息
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
        } else {
            // 用户未登录
            currentUser = null;
            localStorage.removeItem('user');
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        // 出错时假设未登录
        updateUIForLoggedOutUser();
    }
}

// 更新UI为已登录状态
function updateUIForLoggedInUser() {
    if (!userInfoElement || !usernameElement || !loginBtn) return;
    
    // 显示用户信息
    userInfoElement.classList.remove('hidden');
    usernameElement.textContent = currentUser.username || '用户';
    
    // 隐藏登录按钮
    loginBtn.classList.add('hidden');
    
    // 根据用户角色更新UI
    document.body.classList.toggle('is-admin', currentUser.isAdmin === true);
}

// 更新UI为未登录状态
function updateUIForLoggedOutUser() {
    if (!userInfoElement || !loginBtn) return;
    
    // 隐藏用户信息
    userInfoElement.classList.add('hidden');
    
    // 显示登录按钮
    loginBtn.classList.remove('hidden');
    
    // 移除管理员标记
    document.body.classList.remove('is-admin');
}

// 处理登出
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // 清除本地存储和状态
        localStorage.removeItem('user');
        currentUser = null;
        
        // 更新UI
        updateUIForLoggedOutUser();
        
        // 如果在管理页面，重定向到首页
        if (window.location.pathname.includes('/admin')) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// 获取当前用户
function getCurrentUser() {
    return currentUser;
}

// 检查是否已登录
function isLoggedIn() {
    return currentUser !== null;
}

// 检查是否是管理员
function isAdmin() {
    return currentUser && currentUser.isAdmin === true;
}

// 需要登录才能访问
function requireLogin(redirectUrl = null) {
    if (!isLoggedIn()) {
        const currentPath = window.location.pathname;
        const loginRedirect = redirectUrl || currentPath;
        window.location.href = `/login?redirect=${encodeURIComponent(loginRedirect)}`;
        return false;
    }
    return true;
}

// 需要管理员权限才能访问
function requireAdmin() {
    if (!isAdmin()) {
        if (!isLoggedIn()) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        } else {
            // 已登录但不是管理员
            alert('需要管理员权限访问此页面');
            window.location.href = '/';
        }
        return false;
    }
    return true;
}

// 当DOM加载完成初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 导出认证API
window.Auth = {
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    requireLogin,
    requireAdmin,
    checkAuthStatus
}; 