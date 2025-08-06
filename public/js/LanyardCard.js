/**
 * 3D挂绳卡片组件 - 纯JavaScript版本
 * 使用Three.js实现物理效果和3D渲染
 */

class LanyardCard {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            cardTexture: options.cardTexture || '/images/card-texture.jpg',
            lanyardTexture: options.lanyardTexture || '/images/lanyard-texture.png',
            position: options.position || [0, 0, 20],
            gravity: options.gravity || [0, -40, 0],
            fov: options.fov || 20,
            transparent: options.transparent !== undefined ? options.transparent : true,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.cardMesh = null;
        this.lanyardMesh = null;
        this.isDragging = false;
        this.mousePosition = { x: 0, y: 0 };

        this.init();
    }

    async init() {
        try {
            // 创建Three.js场景
            this.createScene();
            this.createCamera();
            this.createRenderer();
            this.createLights();
            
            // 创建挂绳和卡片
            await this.createLanyard();
            await this.createCard();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 开始渲染循环
            this.animate();
            
            console.log('LanyardCard initialized successfully');
        } catch (error) {
            console.error('Error initializing LanyardCard:', error);
            this.createFallback();
        }
    }

    createScene() {
        this.scene = new THREE.Scene();
        if (this.options.transparent) {
            this.scene.background = null;
        }
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            this.options.fov,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(...this.options.position);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: this.options.transparent,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.sortObjects = false;
        this.renderer.autoClear = false;
        
        if (this.options.transparent) {
            this.renderer.setClearColor(0x000000, 0);
        }

        // 设置canvas样式确保在最上层
        const canvas = this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '99999';
        canvas.style.pointerEvents = 'auto';
        canvas.style.backgroundColor = 'transparent';
        canvas.style.isolation = 'isolate';
        canvas.style.transform = 'translateZ(0)';
        canvas.style.willChange = 'transform';

        this.container.appendChild(canvas);
        
        // 确保故障终端背景在最底层
        setTimeout(() => {
            const terminalCanvases = document.querySelectorAll('.faulty-terminal-container canvas');
            terminalCanvases.forEach(terminalCanvas => {
                terminalCanvas.style.zIndex = '-999';
            });
        }, 100);
    }

    createLights() {
        // 环境光 - 增加强度
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        // 主光源 - 增加强度
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // 填充光 - 增加强度
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);

        // 正面补光 - 新增
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
        frontLight.position.set(0, 0, 10);
        this.scene.add(frontLight);
    }

    async createLanyard() {
        // 创建挂绳链条 - 连接到连接环
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 8, 0),
            new THREE.Vector3(0.1, 5, 0),
            new THREE.Vector3(0.1, 3.5, 0),
            new THREE.Vector3(0.05, 2.8, 0),
            new THREE.Vector3(0, 2.4, 0)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
        
        // 加载挂绳纹理
        const loader = new THREE.TextureLoader();
        let material;
        
        try {
            const texture = await new Promise((resolve, reject) => {
                loader.load(
                    this.options.lanyardTexture,
                    resolve,
                    undefined,
                    () => {
                        // 纹理加载失败，使用默认颜色
                        resolve(null);
                    }
                );
            });

            if (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(4, 1);
                material = new THREE.MeshPhongMaterial({ 
                    map: texture,
                    color: 0x00ffff,
                    shininess: 100,
                    emissive: 0x003333,
                    emissiveIntensity: 0.3
                });
            } else {
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ffff,
                    shininess: 100,
                    emissive: 0x003333,
                    emissiveIntensity: 0.3
                });
            }
        } catch (error) {
            material = new THREE.MeshPhongMaterial({ 
                color: 0x00ffff,
                shininess: 100,
                emissive: 0x003333,
                emissiveIntensity: 0.3
            });
        }

        this.lanyardMesh = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(this.lanyardMesh);
    }

    async createCard() {
        // 创建卡片几何体
        const cardGeometry = new THREE.BoxGeometry(3.2, 4.5, 0.04);
        
        // 加载卡片纹理
        const loader = new THREE.TextureLoader();
        let material;

        try {
            const texture = await new Promise((resolve, reject) => {
                loader.load(
                    this.options.cardTexture,
                    (loadedTexture) => {
                        console.log('卡片纹理加载成功:', this.options.cardTexture);
                        resolve(loadedTexture);
                    },
                    undefined,
                    (error) => {
                        console.warn('卡片纹理加载失败，使用默认纹理:', error);
                        resolve(this.createDefaultCardTexture());
                    }
                );
            });

            material = new THREE.MeshPhysicalMaterial({
                map: texture,
                clearcoat: 0.1,
                clearcoatRoughness: 0.05,
                roughness: 0.1,
                metalness: 0.05,
                color: 0xffffff,
                transparent: false,
                opacity: 1,
                emissive: 0x111111,
                emissiveIntensity: 0.2
            });
        } catch (error) {
            console.error('创建卡片材质时出错:', error);
            material = new THREE.MeshPhysicalMaterial({
                map: this.createDefaultCardTexture(),
                clearcoat: 0.1,
                clearcoatRoughness: 0.05,
                roughness: 0.1,
                metalness: 0.05,
                color: 0xffffff,
                transparent: false,
                opacity: 1,
                emissive: 0x111111,
                emissiveIntensity: 0.2
            });
        }

        this.cardMesh = new THREE.Mesh(cardGeometry, material);
        this.cardMesh.position.set(0, 0.3, 0);
        this.cardMesh.castShadow = true;
        this.cardMesh.receiveShadow = true;
        this.scene.add(this.cardMesh);

        // 在卡片顶部添加一个小的连接环
        const ringGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 100
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.set(0, 2.4, 0);
        ringMesh.rotation.x = Math.PI / 2;
        this.scene.add(ringMesh);
    }

    createDefaultCardTexture() {
        // 创建默认的霓虹风格卡片纹理
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 256, 256);
        gradient.addColorStop(0, '#000011');
        gradient.addColorStop(0.5, '#001122');
        gradient.addColorStop(1, '#000033');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        // 霓虹边框
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(10, 10, 236, 236);

        // 文字
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 20px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.fillText('AI NEON', 128, 80);
        ctx.fillText("'world", 128, 110);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

        // 触摸事件
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // 窗口resize事件
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.updateMousePosition(event);
        this.container.style.cursor = 'grabbing';
    }

    onMouseMove(event) {
        this.updateMousePosition(event);
        if (this.isDragging && this.cardMesh) {
            // 简单的拖拽效果
            const rect = this.container.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * 2 - 1;
            const y = -(event.clientY - rect.top) / rect.height * 2 + 1;
            
            this.cardMesh.position.x = x * 4;
            this.cardMesh.position.y = y * 4;
        }
    }

    onMouseUp(event) {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    onTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.onMouseDown(touch);
    }

    onTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.onMouseMove(touch);
    }

    onTouchEnd(event) {
        event.preventDefault();
        this.onMouseUp(event);
    }

    updateMousePosition(event) {
        const rect = this.container.getBoundingClientRect();
        this.mousePosition.x = (event.clientX - rect.left) / rect.width * 2 - 1;
        this.mousePosition.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    }

    onResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.cardMesh && !this.isDragging) {
            // 自然摆动效果
            const time = Date.now() * 0.001;
            this.cardMesh.rotation.x = Math.sin(time * 0.5) * 0.1;
            this.cardMesh.rotation.z = Math.sin(time * 0.3) * 0.05;
            
            // 轻微的位置摆动
            this.cardMesh.position.x = Math.sin(time * 0.8) * 0.1;
        }

        if (this.lanyardMesh) {
            // 挂绳轻微摆动
            const time = Date.now() * 0.001;
            this.lanyardMesh.rotation.z = Math.sin(time * 0.6) * 0.02;
        }

        // 清除并重新渲染
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }

    createFallback() {
        // 如果Three.js初始化失败，创建CSS备用方案
        this.container.innerHTML = `
            <div class="lanyard-fallback">
                <div class="lanyard-rope"></div>
                <div class="lanyard-card">
                    <div class="card-content">
                        <div class="card-title">AI NEON</div>
                        <div class="card-subtitle">'world</div>
                    </div>
                </div>
            </div>
        `;

        // 添加备用样式
        const style = document.createElement('style');
        style.textContent = `
            .lanyard-fallback {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 300px;
            }
            
            .lanyard-rope {
                width: 4px;
                height: 120px;
                background: linear-gradient(180deg, #00ffff, #0088cc);
                border-radius: 2px;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                animation: sway 3s ease-in-out infinite;
            }
            
            .lanyard-card {
                width: 80px;
                height: 120px;
                background: linear-gradient(145deg, #001122, #000033);
                border: 2px solid #00ffff;
                border-radius: 8px;
                box-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.3),
                    inset 0 0 20px rgba(0, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: cardSway 3s ease-in-out infinite 0.2s;
                margin-top: -4px;
            }
            
            .card-content {
                text-align: center;
                color: #00ffff;
                font-family: 'Orbitron', monospace;
                font-size: 8px;
                font-weight: bold;
                text-shadow: 0 0 5px #00ffff;
            }
            
            .card-title {
                margin-bottom: 2px;
            }
            
            @keyframes sway {
                0%, 100% { transform: rotate(-2deg); }
                50% { transform: rotate(2deg); }
            }
            
            @keyframes cardSway {
                0%, 100% { transform: rotate(-3deg) translateX(-2px); }
                50% { transform: rotate(3deg) translateX(2px); }
            }
        `;
        document.head.appendChild(style);
    }

    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        
        if (this.scene) {
            this.scene.clear();
        }
        
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}

// 导出供全局使用
window.LanyardCard = LanyardCard;