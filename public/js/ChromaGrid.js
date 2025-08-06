import { gsap } from 'https://cdn.skypack.dev/gsap';

class ChromaGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            items: [],
            radius: 300,
            columns: 3,
            rows: 2,
            damping: 0.45,
            fadeOut: 0.6,
            ease: "power3.out",
            ...options
        };
        
        this.pos = { x: 0, y: 0 };
        this.setX = null;
        this.setY = null;
        this.fadeRef = null;
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupGSAP();
        this.bindEvents();
    }

    createGrid() {
        this.container.className = 'chroma-grid';
        this.container.style.setProperty('--r', `${this.options.radius}px`);
        this.container.style.setProperty('--cols', this.options.columns);
        this.container.style.setProperty('--rows', this.options.rows);

        // 清空容器
        this.container.innerHTML = '';

        // 创建卡片
        this.options.items.forEach((item, index) => {
            const card = this.createCard(item, index);
            this.container.appendChild(card);
        });

        // 创建覆盖层
        const overlay = document.createElement('div');
        overlay.className = 'chroma-overlay';
        this.container.appendChild(overlay);

        // 创建淡出层
        this.fadeRef = document.createElement('div');
        this.fadeRef.className = 'chroma-fade';
        this.container.appendChild(this.fadeRef);
    }

    createCard(item, index) {
        const card = document.createElement('article');
        card.className = 'chroma-card';
        card.style.setProperty('--card-border', item.borderColor || '#00ffff');
        card.style.setProperty('--card-gradient', item.gradient || 'linear-gradient(145deg, #00ffff, #000)');
        
        if (item.url) {
            card.style.cursor = 'pointer';
        }

        // 图片包装器
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'chroma-img-wrapper';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.loading = 'lazy';

        imgWrapper.appendChild(img);

        // 信息区域
        const info = document.createElement('footer');
        info.className = 'chroma-info';

        const title = document.createElement('h3');
        title.className = 'name';
        title.textContent = item.title;

        const subtitle = document.createElement('p');
        subtitle.className = 'role';
        subtitle.textContent = item.subtitle;

        info.appendChild(title);
        if (item.handle) {
            const handle = document.createElement('span');
            handle.className = 'handle';
            handle.textContent = item.handle;
            info.appendChild(handle);
        }
        info.appendChild(subtitle);

        if (item.location) {
            const location = document.createElement('span');
            location.className = 'location';
            location.textContent = item.location;
            info.appendChild(location);
        }

        card.appendChild(imgWrapper);
        card.appendChild(info);

        // 绑定卡片事件
        this.bindCardEvents(card, item);

        return card;
    }

    bindCardEvents(card, item) {
        // 鼠标移动效果
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        // 点击事件
        if (item.url) {
            card.addEventListener('click', () => {
                window.location.href = item.url;
            });
        }
    }

    setupGSAP() {
        this.setX = gsap.quickSetter(this.container, '--x', 'px');
        this.setY = gsap.quickSetter(this.container, '--y', 'px');
        
        const { width, height } = this.container.getBoundingClientRect();
        this.pos = { x: width / 2, y: height / 2 };
        this.setX(this.pos.x);
        this.setY(this.pos.y);
    }

    bindEvents() {
        this.container.addEventListener('pointermove', (e) => this.handleMove(e));
        this.container.addEventListener('pointerleave', () => this.handleLeave());
    }

    handleMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        gsap.to(this.fadeRef, { opacity: 0, duration: 0.25, overwrite: true });
    }

    handleLeave() {
        gsap.to(this.fadeRef, {
            opacity: 1,
            duration: this.options.fadeOut,
            overwrite: true,
        });
    }

    moveTo(x, y) {
        gsap.to(this.pos, {
            x,
            y,
            duration: this.options.damping,
            ease: this.options.ease,
            onUpdate: () => {
                this.setX?.(this.pos.x);
                this.setY?.(this.pos.y);
            },
            overwrite: true,
        });
    }

    updateItems(newItems) {
        this.options.items = newItems;
        this.createGrid();
        this.setupGSAP();
    }

    destroy() {
        // 清理 GSAP 动画
        gsap.killTweensOf(this.pos);
        gsap.killTweensOf(this.fadeRef);
        
        // 清空容器
        this.container.innerHTML = '';
        this.container.className = '';
    }
}

export default ChromaGrid;