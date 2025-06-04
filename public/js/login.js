document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const phoneTabBtn = document.getElementById('phoneTabBtn');
    const wechatTabBtn = document.getElementById('wechatTabBtn');
    const phoneLoginForm = document.getElementById('phoneLoginForm');
    const wechatLoginForm = document.getElementById('wechatLoginForm');
    
    phoneTabBtn.addEventListener('click', () => {
        phoneTabBtn.classList.add('active');
        wechatTabBtn.classList.remove('active');
        phoneLoginForm.classList.add('active');
        wechatLoginForm.classList.remove('active');
    });
    
    wechatTabBtn.addEventListener('click', () => {
        wechatTabBtn.classList.add('active');
        phoneTabBtn.classList.remove('active');
        wechatLoginForm.classList.add('active');
        phoneLoginForm.classList.remove('active');
        
        // Load WeChat QR code when tab is shown
        loadWechatQRCode();
    });
    
    // Phone verification code
    const phoneInput = document.getElementById('phone');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const verificationCodeInput = document.getElementById('verificationCode');
    const phoneLoginBtn = document.getElementById('phoneLoginBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    // Countdown for verification code
    let countdown = 0;
    let countdownInterval;
    
    // Send verification code
    sendCodeBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            showMessage('请输入手机号码');
            return;
        }
        
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            showMessage('请输入有效的手机号码');
            return;
        }
        
        if (countdown > 0) return;
        
        showLoading('正在发送验证码...');
        
        try {
            const response = await fetch('/api/auth/phone/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '发送验证码失败');
            }
            
            // Start countdown
            countdown = 60;
            sendCodeBtn.classList.add('disabled');
            countdownInterval = setInterval(() => {
                countdown--;
                sendCodeBtn.textContent = `重新发送(${countdown}s)`;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    sendCodeBtn.textContent = '获取验证码';
                    sendCodeBtn.classList.remove('disabled');
                }
            }, 1000);
            
            showMessage('验证码已发送');
            
            // For development: Auto-fill verification code
            if (data.code) {
                verificationCodeInput.value = data.code;
            }
        } catch (error) {
            showMessage(error.message);
        } finally {
            hideLoading();
        }
    });
    
    // Phone login
    phoneLoginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        const code = verificationCodeInput.value.trim();
        
        if (!phone) {
            showMessage('请输入手机号码');
            return;
        }
        
        if (!code) {
            showMessage('请输入验证码');
            return;
        }
        
        showLoading('正在验证登录...');
        
        try {
            const response = await fetch('/api/auth/phone/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, code })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '登录失败');
            }
            
            showMessage('登录成功，正在跳转...');
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to previous page or home
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                window.location.href = redirectUrl;
            }, 1000);
        } catch (error) {
            showMessage(error.message);
        } finally {
            hideLoading();
        }
    });
    
    // WeChat login
    const mockWechatLoginBtn = document.getElementById('mockWechatLoginBtn');
    const wechatQRCode = document.getElementById('wechatQRCode');
    
    // Load WeChat QR code
    async function loadWechatQRCode() {
        try {
            // In production, this would get a real QR code from WeChat
            // For development, we're just showing a placeholder
            const response = await fetch('/api/auth/wechat/qrcode');
            const data = await response.json();
            
            if (data.qrCodeUrl) {
                // In production, display the actual QR code
                wechatQRCode.innerHTML = `
                    <p>开发中: 模拟WeChat二维码</p>
                    <p>状态ID: ${data.state}</p>
                `;
            }
        } catch (error) {
            console.error('Error loading WeChat QR code:', error);
            wechatQRCode.innerHTML = `<p>加载二维码失败，请刷新重试</p>`;
        }
    }
    
    // Mock WeChat login (for development)
    mockWechatLoginBtn.addEventListener('click', async () => {
        showLoading('模拟微信登录中...');
        
        try {
            const mockWechatId = 'wx_' + Math.floor(Math.random() * 1000000);
            const mockUserInfo = {
                nickname: '微信用户' + Math.floor(Math.random() * 10000),
                avatar: ''
            };
            
            const response = await fetch('/api/auth/wechat/mock-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    mockWechatId,
                    mockUserInfo 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '登录失败');
            }
            
            showMessage('登录成功，正在跳转...');
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to previous page or home
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                window.location.href = redirectUrl;
            }, 1000);
        } catch (error) {
            showMessage(error.message);
        } finally {
            hideLoading();
        }
    });
    
    // Check if already logged in
    checkLoginStatus();
    
    async function checkLoginStatus() {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            
            if (data.loggedIn) {
                // User is already logged in, redirect
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    }
    
    // Helper functions
    function showLoading(message) {
        loadingText.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
    
    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }
    
    function showMessage(message, isError = false) {
        // Simple alert for now, can be replaced with a nicer notification
        alert(message);
    }
}); 