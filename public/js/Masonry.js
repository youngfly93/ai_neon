import { gsap } from '/node_modules/gsap/index.js';

class Masonry {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            items: [],
            ease: "power3.out",
            duration: 0.6,
            stagger: 0.05,
            animateFrom: "bottom",
            scaleOnHover: true,
            hoverScale: 0.95,
            blurToFocus: true,
            colorShiftOnHover: false,
            ...options
        };
        
        this.columns = 1;
        this.hasMounted = false;
        this.imagesReady = false;
        
        this.init();
    }

    init() {
        this.setupResponsiveColumns();
        this.preloadImages().then(() => {
            this.imagesReady = true;
            this.createGrid();
            this.bindEvents();
        });
    }

    setupResponsiveColumns() {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1800) this.columns = 4;
            else if (width >= 1400) this.columns = 3;
            else if (width >= 900) this.columns = 2;
            else if (width >= 600) this.columns = 2;
            else this.columns = 1;
            
            if (this.imagesReady) {
                this.updateLayout();
            }
        };
        
        updateColumns();
        window.addEventListener('resize', updateColumns);
    }

    async preloadImages() {
        const urls = this.options.items.map(item => item.image || item.img);
        await Promise.all(
            urls.map(src => new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = img.onerror = () => resolve();
            }))
        );
    }

    getInitialPosition(item, index) {
        const containerRect = this.container.getBoundingClientRect();
        let direction = this.options.animateFrom;

        if (direction === "random") {
            const directions = ["top", "bottom", "left", "right"];
            direction = directions[Math.floor(Math.random() * directions.length)];
        }

        switch (direction) {
            case "top":
                return { x: item.x, y: -200 };
            case "bottom":
                return { x: item.x, y: window.innerHeight + 200 };
            case "left":
                return { x: -200, y: item.y };
            case "right":
                return { x: window.innerWidth + 200, y: item.y };
            case "center":
                return {
                    x: containerRect.width / 2 - item.w / 2,
                    y: containerRect.height / 2 - item.h / 2,
                };
            default:
                return { x: item.x, y: item.y + 100 };
        }
    }

    calculateGrid() {
        const containerWidth = this.container.offsetWidth;
        const colHeights = new Array(this.columns).fill(0);
        const columnWidth = containerWidth / this.columns;
        const gap = 18; // 增大间隙 (12 * 1.5)

        return this.options.items.map((item) => {
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = columnWidth * col + (col > 0 ? gap * col / this.columns : 0);
            // 等比例放大高度 1.5倍
            const baseHeight = item.imageCount > 20 ? 280 : item.imageCount > 10 ? 240 : 200;
            const height = Math.floor(baseHeight * 1.5); // 放大1.5倍
            const y = colHeights[col];

            colHeights[col] += height + gap;

            return { 
                ...item, 
                x, 
                y, 
                w: columnWidth - (gap * (this.columns - 1) / this.columns), 
                h: height 
            };
        });
    }

    createGrid() {
        this.container.className = 'masonry-grid';
        this.container.innerHTML = '';

        const grid = this.calculateGrid();

        grid.forEach((item, index) => {
            const itemElement = this.createItem(item, index);
            this.container.appendChild(itemElement);
        });

        // 应用动画
        this.animateItems(grid);
    }

    createItem(item, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'masonry-item-wrapper';
        wrapper.setAttribute('data-key', item.handle || item.id || index);
        
        // 随机霓虹边框颜色
        const neonColors = ['#00ffff', '#ff0080', '#ffff00', '#80ff00', '#ff8000', '#8000ff'];
        const borderColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        wrapper.innerHTML = `
            <div class="masonry-item">
                <div class="masonry-item-img" style="background-image: url(${item.image || item.img})">
                    ${this.options.colorShiftOnHover ? `
                    <div class="color-overlay" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5));
                        opacity: 0;
                        pointer-events: none;
                        border-radius: 12px;
                    "></div>` : ''}
                </div>
                <div class="masonry-item-info">
                    <h3 class="masonry-item-title">${item.title || item.displayName}</h3>
                    <p class="masonry-item-subtitle">${item.subtitle || `${item.imageCount || 0} 张图片`}</p>
                </div>
            </div>
        `;

        wrapper.style.setProperty('--border-color', borderColor);

        // 绑定事件
        this.bindItemEvents(wrapper, item);

        return wrapper;
    }

    bindItemEvents(element, item) {
        element.addEventListener('click', () => {
            if (item.url) {
                window.location.href = item.url;
            } else if (item.name) {
                window.location.href = `/theme/${encodeURIComponent(item.name)}`;
            }
        });

        element.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, item));
        element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, item));
    }

    handleMouseEnter(e, item) {
        const selector = `[data-key="${item.handle || item.id || item.name}"]`;

        if (this.options.scaleOnHover) {
            gsap.to(selector, {
                scale: this.options.hoverScale,
                duration: 0.3,
                ease: "power2.out"
            });
        }

        if (this.options.colorShiftOnHover) {
            const overlay = e.currentTarget.querySelector(".color-overlay");
            if (overlay) {
                gsap.to(overlay, {
                    opacity: 0.3,
                    duration: 0.3,
                });
            }
        }
    }

    handleMouseLeave(e, item) {
        const selector = `[data-key="${item.handle || item.id || item.name}"]`;

        if (this.options.scaleOnHover) {
            gsap.to(selector, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        }

        if (this.options.colorShiftOnHover) {
            const overlay = e.currentTarget.querySelector(".color-overlay");
            if (overlay) {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.3,
                });
            }
        }
    }

    animateItems(grid) {
        grid.forEach((item, index) => {
            const selector = `[data-key="${item.handle || item.id || index}"]`;
            const element = this.container.querySelector(selector);
            
            if (!element) return;

            const animationProps = {
                x: item.x,
                y: item.y,
                width: item.w,
                height: item.h,
            };

            if (!this.hasMounted) {
                const initialPos = this.getInitialPosition(item, index);
                const initialState = {
                    opacity: 0,
                    x: initialPos.x,
                    y: initialPos.y,
                    width: item.w,
                    height: item.h,
                    ...(this.options.blurToFocus && { filter: "blur(10px)" }),
                };

                gsap.fromTo(selector, initialState, {
                    opacity: 1,
                    ...animationProps,
                    ...(this.options.blurToFocus && { filter: "blur(0px)" }),
                    duration: 0.8,
                    ease: "power3.out",
                    delay: index * this.options.stagger,
                });
            } else {
                gsap.to(selector, {
                    ...animationProps,
                    duration: this.options.duration,
                    ease: this.options.ease,
                    overwrite: "auto",
                });
            }
        });

        this.hasMounted = true;
    }

    updateLayout() {
        if (!this.imagesReady) return;
        const grid = this.calculateGrid();
        this.animateItems(grid);
    }

    bindEvents() {
        const resizeObserver = new ResizeObserver(() => {
            this.updateLayout();
        });
        resizeObserver.observe(this.container);
    }

    updateItems(newItems) {
        this.options.items = newItems;
        this.preloadImages().then(() => {
            this.createGrid();
        });
    }

    destroy() {
        // 清理 GSAP 动画
        gsap.killTweensOf(this.container.querySelectorAll('.masonry-item-wrapper'));
        
        // 清空容器
        this.container.innerHTML = '';
        this.container.className = '';
    }
}

export default Masonry;