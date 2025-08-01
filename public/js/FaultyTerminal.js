import { Renderer, Program, Mesh, Color, Triangle } from '/node_modules/ogl/src/index.js';

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2; 
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  
  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545; // 1/2.2
  
  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);
  
  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);
  
  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
    
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
        
        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }
    
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    
    p = fract(p);
    p *= uDigitSize;
    
    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);
    
    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;
    
    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){
    
    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0; // more efficient than ternary
    bar *= uScanlineIntensity;
    
    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);
    
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
    
    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }
    
    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export class FaultyTerminal {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      scale: 1.5,
      gridMul: [2, 1],
      digitSize: 1.2,
      timeScale: 1,
      pause: false,
      scanlineIntensity: 1,
      glitchAmount: 1,
      flickerAmount: 1,
      noiseAmp: 1,
      chromaticAberration: 0,
      dither: 0,
      curvature: 0,
      tint: "#00ffff",
      mouseReact: true,
      mouseStrength: 0.5,
      pageLoadAnimation: false,
      brightness: 1,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      ...options
    };

    this.mouse = { x: 0.5, y: 0.5 };
    this.smoothMouse = { x: 0.5, y: 0.5 };
    this.frozenTime = 0;
    this.rafId = 0;
    this.loadAnimationStart = 0;
    this.timeOffset = Math.random() * 100;

    this.init();
  }

  init() {
    const { dpr } = this.options;
    
    this.renderer = new Renderer({ dpr });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(gl);

    const tintVec = hexToRgb(this.options.tint);
    const ditherValue = typeof this.options.dither === "boolean" ? (this.options.dither ? 1 : 0) : this.options.dither;

    this.program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          ),
        },
        uScale: { value: this.options.scale },
        uGridMul: { value: new Float32Array(this.options.gridMul) },
        uDigitSize: { value: this.options.digitSize },
        uScanlineIntensity: { value: this.options.scanlineIntensity },
        uGlitchAmount: { value: this.options.glitchAmount },
        uFlickerAmount: { value: this.options.flickerAmount },
        uNoiseAmp: { value: this.options.noiseAmp },
        uChromaticAberration: { value: this.options.chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: this.options.curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: {
          value: new Float32Array([
            this.smoothMouse.x,
            this.smoothMouse.y,
          ]),
        },
        uMouseStrength: { value: this.options.mouseStrength },
        uUseMouse: { value: this.options.mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: this.options.pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: this.options.pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: this.options.brightness },
      },
    });

    this.mesh = new Mesh(gl, { geometry, program: this.program });

    this.bindEvents();
    this.resize();
    this.animate();

    this.container.appendChild(gl.canvas);
  }

  bindEvents() {
    this.handleMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      this.mouse = { x, y };
    };

    this.handleResize = () => {
      this.resize();
    };

    if (this.options.mouseReact) {
      this.container.addEventListener("mousemove", this.handleMouseMove);
    }
    
    window.addEventListener("resize", this.handleResize);
  }

  resize() {
    if (!this.container || !this.renderer) return;
    
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    const gl = this.renderer.gl;
    
    this.program.uniforms.iResolution.value = new Color(
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height
    );
  }

  animate(t = 0) {
    this.rafId = requestAnimationFrame((time) => this.animate(time));

    if (this.options.pageLoadAnimation && this.loadAnimationStart === 0) {
      this.loadAnimationStart = t;
    }

    if (!this.options.pause) {
      const elapsed = (t * 0.001 + this.timeOffset) * this.options.timeScale;
      this.program.uniforms.iTime.value = elapsed;
      this.frozenTime = elapsed;
    } else {
      this.program.uniforms.iTime.value = this.frozenTime;
    }

    if (this.options.pageLoadAnimation && this.loadAnimationStart > 0) {
      const animationDuration = 2000;
      const animationElapsed = t - this.loadAnimationStart;
      const progress = Math.min(animationElapsed / animationDuration, 1);
      this.program.uniforms.uPageLoadProgress.value = progress;
    }

    if (this.options.mouseReact) {
      const dampingFactor = 0.08;
      this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * dampingFactor;
      this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * dampingFactor;

      const mouseUniform = this.program.uniforms.uMouse.value;
      mouseUniform[0] = this.smoothMouse.x;
      mouseUniform[1] = this.smoothMouse.y;
    }

    this.renderer.render({ scene: this.mesh });
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    
    if (this.options.mouseReact) {
      this.container.removeEventListener("mousemove", this.handleMouseMove);
    }
    window.removeEventListener("resize", this.handleResize);
    
    const gl = this.renderer.gl;
    if (gl.canvas.parentElement === this.container) {
      this.container.removeChild(gl.canvas);
    }
    
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.loadAnimationStart = 0;
    this.timeOffset = Math.random() * 100;
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Update uniforms
    const tintVec = hexToRgb(this.options.tint);
    const ditherValue = typeof this.options.dither === "boolean" ? (this.options.dither ? 1 : 0) : this.options.dither;
    
    this.program.uniforms.uScale.value = this.options.scale;
    this.program.uniforms.uGridMul.value = new Float32Array(this.options.gridMul);
    this.program.uniforms.uDigitSize.value = this.options.digitSize;
    this.program.uniforms.uScanlineIntensity.value = this.options.scanlineIntensity;
    this.program.uniforms.uGlitchAmount.value = this.options.glitchAmount;
    this.program.uniforms.uFlickerAmount.value = this.options.flickerAmount;
    this.program.uniforms.uNoiseAmp.value = this.options.noiseAmp;
    this.program.uniforms.uChromaticAberration.value = this.options.chromaticAberration;
    this.program.uniforms.uDither.value = ditherValue;
    this.program.uniforms.uCurvature.value = this.options.curvature;
    this.program.uniforms.uTint.value = new Color(tintVec[0], tintVec[1], tintVec[2]);
    this.program.uniforms.uMouseStrength.value = this.options.mouseStrength;
    this.program.uniforms.uUseMouse.value = this.options.mouseReact ? 1 : 0;
    this.program.uniforms.uBrightness.value = this.options.brightness;
  }
}