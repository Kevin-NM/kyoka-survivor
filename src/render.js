// three.js HD-2D style renderer: tilted perspective camera, billboard pixel sprites (instanced),
// projected silhouette shadows, glow layers, textured ground, and a post chain
// (tilt-shift blur, bloom, colour grading, vignette, grain).
import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, WebGLRenderTarget, HalfFloatType, UnsignedByteType,
  LinearFilter, NearestFilter, RepeatWrapping, CanvasTexture, InstancedBufferGeometry, InstancedBufferAttribute,
  Float32BufferAttribute, Mesh, ShaderMaterial, PlaneGeometry, Vector2, Vector3, AdditiveBlending, CustomBlending,
  OneFactor, AddEquation, NormalBlending, NotEqualStencilFunc, ReplaceStencilOp, KeepStencilOp, DynamicDrawUsage,
  NoColorSpace, LinearSRGBColorSpace, Color, BufferGeometry, DoubleSide, GreaterDepth
} from 'three';

export const PIX = 0.62; // world units per art pixel

function tex(canvas, nearest, repeat) {
  const t = new CanvasTexture(canvas); t.colorSpace = NoColorSpace; t.flipY = false; t.generateMipmaps = false;
  t.magFilter = t.minFilter = nearest ? NearestFilter : LinearFilter;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.needsUpdate = true; return t;
}
function noiseCanvas() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
  const g = 16, G = []; let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < g * g; i++) G.push(r());
  for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) {
    let v = 0, amp = 0.6;
    for (const sc of [4, 8, 16]) { const gx = X / N * sc, gy = y / N * sc, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const q = (a, b) => G[((a % sc) * g + (b % sc)) % (g * g)];
      v += amp * ((q(x0, y0) * (1 - sx) + q(x0 + 1, y0) * sx) * (1 - sy) + (q(x0, y0 + 1) * (1 - sx) + q(x0 + 1, y0 + 1) * sx) * sy); amp *= 0.5; }
    const b = Math.max(0, Math.min(255, v / 1.05 * 255)); const i = (y * N + X) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = b; im.data[i + 3] = 255;
  }
  x.putImageData(im, 0, 0); return c;
}

const SPRITE_VS = `
attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iUV; attribute vec4 iTint; attribute vec4 iPar;
uniform vec3 uUp; uniform vec2 uFog;
varying vec2 vUv; varying vec3 vTint; varying vec3 vPar; varying float vFog;
void main(){
  vec3 wp = iPos + vec3(position.x * iSize.x, 0.0, 0.0) + uUp * (position.y * iSize.y);
  float u = position.x + 0.5; if (iPar.x > 0.5) u = 1.0 - u;
  vUv = vec2(iUV.x + u * iUV.z, iUV.y + (1.0 - position.y) * iUV.w);
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  vec4 bc = projectionMatrix * modelViewMatrix * vec4(iPos.x, 0.0, iPos.z + iPar.w, 1.0);
  gl_Position.z = clamp(bc.z / bc.w, -1.0, 1.0) * gl_Position.w;
  vTint = iTint.rgb; vPar = iPar.xyz;
  vFog = clamp((-mv.z - uFog.x) / uFog.y, 0.0, 1.0);
}`;
const XRAY_FS = `
uniform sampler2D uTex; uniform float uTime;
varying vec2 vUv; varying vec3 vTint; varying vec3 vPar; varying float vFog;
void main(){
  vec4 c = texture2D(uTex, vUv); if (c.a < 0.5) discard;
  float l = dot(c.rgb, vec3(0.3, 0.55, 0.15));
  gl_FragColor = vec4(mix(vTint * 0.75, vTint, l), 0.62 + 0.08 * sin(uTime * 4.0));
}`;
const SPRITE_FS = `
uniform sampler2D uTex; uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFogMax;
varying vec2 vUv; varying vec3 vTint; varying vec3 vPar; varying float vFog;
void main(){
  vec4 c = texture2D(uTex, vUv); if (c.a < 0.5) discard;
  vec3 col = c.rgb * vTint;
  col = mix(col * uAmb, col * (1.0 + vPar.z * 0.9), step(0.01, vPar.z));
  col = mix(col, vec3(1.0, 0.98, 0.96) * 1.15, vPar.y);
  col = mix(col, uFogCol, vFog * uFogMax * (1.0 - min(vPar.z, 1.0) * 0.6));
  gl_FragColor = vec4(col, 1.0);
}`;
const SHADOW_VS = `
attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iUV; attribute vec4 iTint; attribute vec4 iPar;
uniform vec2 uDir; varying vec2 vUv; varying float vA;
void main(){
  float u = position.x + 0.5; if (iPar.x > 0.5) u = 1.0 - u;
  vUv = vec2(iUV.x + u * iUV.z, iUV.y + (1.0 - position.y) * iUV.w);
  float h = position.y * iSize.y;
  vec3 wp = vec3(iPos.x + position.x * iSize.x + uDir.x * h, 0.12, iPos.z + uDir.y * h + 0.5);
  vA = iTint.a;
  if (iTint.a < 0.01) wp = vec3(0.0, -9999.0, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(wp, 1.0);
}`;
const SHADOW_FS = `
uniform sampler2D uTex; uniform vec4 uCol; varying vec2 vUv; varying float vA;
void main(){ vec4 c = texture2D(uTex, vUv); if (c.a < 0.5) discard; gl_FragColor = vec4(uCol.rgb, uCol.a * vA); }`;
const GLOW_VS = `
attribute vec3 iPos; attribute vec3 iSize; attribute vec4 iUV; attribute vec4 iCol; attribute float iMode;
uniform vec3 uUp; varying vec2 vUv; varying vec4 vCol;
void main(){
  vec2 p = position.xy;
  float c = cos(iSize.z), s = sin(iSize.z);
  vec2 q = vec2(p.x * iSize.x, p.y * iSize.y); q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
  vec3 wp = iMode > 0.5 ? iPos + vec3(q.x, 0.0, -q.y) : iPos + vec3(q.x, 0.0, 0.0) + uUp * q.y;
  vUv = vec2(iUV.x + (p.x + 0.5) * iUV.z, iUV.y + (0.5 - p.y) * iUV.w);
  vCol = iCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(wp, 1.0);
}`;
const GLOW_FS_ADD = `uniform sampler2D uTex; varying vec2 vUv; varying vec4 vCol;
void main(){ float a = texture2D(uTex, vUv).a * vCol.a; gl_FragColor = vec4(vCol.rgb * a, a); }`;
const GLOW_FS_NORM = `uniform sampler2D uTex; varying vec2 vUv; varying vec4 vCol;
void main(){ float a = texture2D(uTex, vUv).a * vCol.a; if (a < 0.003) discard; gl_FragColor = vec4(vCol.rgb, a); }`;
const GROUND_VS = `
uniform vec2 uFog; varying vec3 vW; varying float vFog;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv; vFog = clamp((-mv.z - uFog.x) / uFog.y, 0.0, 1.0); }`;
const GROUND_FS = `
uniform sampler2D uG0; uniform sampler2D uG1; uniform sampler2D uNoise; uniform float uMix; uniform float uTexel; uniform float uTime;
uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFogMax; uniform vec2 uPlayer; uniform vec3 uPool;
varying vec3 vW; varying float vFog;
void main(){
  vec2 uv = vW.xz / (256.0 * uTexel);
  vec3 col = mix(texture2D(uG0, uv).rgb, texture2D(uG1, uv).rgb, uMix);
  float n = texture2D(uNoise, vW.xz / 1500.0).r;
  col *= 0.84 + 0.3 * n;
  float cs = texture2D(uNoise, vW.xz / 1100.0 + uTime * vec2(0.006, 0.003)).r;
  col *= mix(0.86, 1.05, smoothstep(0.38, 0.62, cs));
  float d = length(vW.xz - uPlayer);
  col += uPool * pow(max(0.0, 1.0 - d / 150.0), 2.0);
  col *= uAmb;
  col = mix(col, uFogCol, vFog * uFogMax);
  gl_FragColor = vec4(col, 1.0);
}`;
const FS_QUAD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const COPY_FS = `uniform sampler2D tSrc; uniform float uThr; varying vec2 vUv; uniform vec2 uTexel;
void main(){
  vec3 c = (texture2D(tSrc, vUv + uTexel * vec2(-0.5,-0.5)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0.5,-0.5)).rgb + texture2D(tSrc, vUv + uTexel * vec2(-0.5,0.5)).rgb + texture2D(tSrc, vUv + uTexel * vec2(0.5,0.5)).rgb) * 0.25;
  if (uThr > 0.0) { float l = max(c.r, max(c.g, c.b)); c *= smoothstep(uThr, uThr + 0.35, l); }
  gl_FragColor = vec4(c, 1.0);
}`;
const BLUR_FS = `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227;
  c += (texture2D(tSrc, vUv + uDir * 1.385).rgb + texture2D(tSrc, vUv - uDir * 1.385).rgb) * 0.316;
  c += (texture2D(tSrc, vUv + uDir * 3.231).rgb + texture2D(tSrc, vUv - uDir * 3.231).rgb) * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`;
const COMP_FS = `
uniform sampler2D tScene; uniform sampler2D tBlur; uniform sampler2D tBloom; uniform sampler2D tBloom2;
uniform vec2 uRes; uniform float uTime; uniform float uBloom; uniform float uSat; uniform float uContrast; uniform float uVig;
uniform vec3 uVigCol; uniform vec3 uGain; uniform vec3 uLift; uniform vec3 uShTone; uniform vec3 uHiTone; uniform float uFlash; uniform float uTilt; uniform vec3 uFlashCol;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  vec3 sc = texture2D(tScene, uv).rgb;
  vec3 bl = texture2D(tBlur, uv).rgb;
  float ts = smoothstep(0.3, 0.52, abs(uv.y - 0.47)) * uTilt;
  vec3 col = mix(sc, bl, ts);
  col += (texture2D(tBloom, uv).rgb * 0.7 + texture2D(tBloom2, uv).rgb * 0.6) * uBloom;
  col = col * uGain + uLift * (1.0 - col);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSat);
  col = (col - 0.5) * uContrast + 0.5;
  col += mix(uShTone, uHiTone, smoothstep(0.15, 0.85, l)) * 0.07;
  vec2 d = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float v = smoothstep(0.42, 1.2, length(d));
  col = mix(col, uVigCol, v * uVig);
  col = mix(col, uFlashCol, uFlash);
  float g = fract(sin(dot(floor(uv * uRes) + fract(uTime) * 91.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.022;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

class Batch {
  constructor(cap, layout, mat, quad) {
    const g = new InstancedBufferGeometry();
    if (quad === 'center') g.setAttribute('position', new Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3));
    else g.setAttribute('position', new Float32BufferAttribute([-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.a = {}; this.cap = cap; this.n = 0;
    for (const [name, size] of layout) { const arr = new Float32Array(cap * size), at = new InstancedBufferAttribute(arr, size); at.setUsage(DynamicDrawUsage); g.setAttribute(name, at); this.a[name] = arr; }
    g.instanceCount = 0; this.g = g;
    this.mesh = new Mesh(g, mat); this.mesh.frustumCulled = false;
  }
  end() { this.g.instanceCount = this.n; for (const k in this.a) { const at = this.g.getAttribute(k); at.needsUpdate = true; at.clearUpdateRanges && at.clearUpdateRanges(); at.addUpdateRange && at.addUpdateRange(0, this.n * at.itemSize); } }
}

export class Renderer {
  constructor(canvas, atlas, glowCanvas, groundCanvases) {
    this.canvas = canvas;
    const r = this.r = new WebGLRenderer({ canvas, antialias: false, stencil: true, powerPreference: 'high-performance' });
    r.outputColorSpace = LinearSRGBColorSpace; r.autoClear = false;
    this.R = atlas.R;
    this.tAtlas = tex(atlas.canvas, true); this.tGlow = tex(glowCanvas, false);
    this.tGround = groundCanvases.map(c => tex(c, true, true));
    this.tNoise = tex(noiseCanvas(), false, true);
    this.scene = new Scene(); this.cam = new PerspectiveCamera(24, 1, 20, 4000);
    this.tilt = 50 * Math.PI / 180;
    const up = new Vector3(0, Math.cos(this.tilt), -Math.sin(this.tilt));
    const fog = new Vector2(600, 500);
    this.U = { amb: new Color(1, 1, 1), fogCol: new Color(0.6, 0.72, 0.7) };
    const common = { uUp: { value: up }, uFog: { value: fog }, uAmb: { value: this.U.amb }, uFogCol: { value: this.U.fogCol }, uFogMax: { value: 0.5 } };
    this.common = common;
    // ground
    this.groundMat = new ShaderMaterial({ vertexShader: GROUND_VS, fragmentShader: GROUND_FS, uniforms: Object.assign({}, common, {
      uG0: { value: this.tGround[0] }, uG1: { value: this.tGround[0] }, uNoise: { value: this.tNoise }, uMix: { value: 0 }, uTexel: { value: PIX }, uTime: { value: 0 },
      uPlayer: { value: new Vector2() }, uPool: { value: new Color(0.06, 0.05, 0.02) } }) });
    const gg = new PlaneGeometry(5000, 5000); gg.rotateX(-Math.PI / 2);
    this.ground = new Mesh(gg, this.groundMat); this.ground.renderOrder = 0; this.ground.frustumCulled = false; this.scene.add(this.ground);
    // blobs (contact shadows)
    const glowLayout = [['iPos', 3], ['iSize', 3], ['iUV', 4], ['iCol', 4], ['iMode', 1]];
    const mkGlow = (add, depthTest) => new ShaderMaterial({ vertexShader: GLOW_VS, fragmentShader: add ? GLOW_FS_ADD : GLOW_FS_NORM, uniforms: { uTex: { value: this.tGlow }, uUp: common.uUp },
      transparent: true, side: DoubleSide, depthWrite: false, depthTest, blending: add ? CustomBlending : NormalBlending, blendSrc: OneFactor, blendDst: OneFactor, blendEquation: AddEquation });
    this.blob = new Batch(900, glowLayout, mkGlow(false, true), 'center'); this.blob.mesh.renderOrder = 1; this.scene.add(this.blob.mesh);
    // sprites + projected shadows (share instance buffers)
    const spLayout = [['iPos', 3], ['iSize', 2], ['iUV', 4], ['iTint', 4], ['iPar', 4]];
    this.spMat = new ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: Object.assign({ uTex: { value: this.tAtlas } }, common) });
    this.sp = new Batch(4000, spLayout, this.spMat); this.sp.mesh.renderOrder = 4; this.scene.add(this.sp.mesh);
    const shMat = new ShaderMaterial({ vertexShader: SHADOW_VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false, side: DoubleSide,
      uniforms: { uTex: { value: this.tAtlas }, uDir: { value: new Vector2(0.42, 0.62) }, uCol: { value: [0.1, 0.05, 0.16, 0.42] } } });
    shMat.stencilWrite = true; shMat.stencilFunc = NotEqualStencilFunc; shMat.stencilRef = 1; shMat.stencilZPass = ReplaceStencilOp; shMat.stencilFail = KeepStencilOp; shMat.stencilZFail = KeepStencilOp;
    this.shMat = shMat;
    this.shadow = new Mesh(this.sp.g, shMat); this.shadow.frustumCulled = false; this.shadow.renderOrder = 2; this.scene.add(this.shadow);
    this.gGlow = new Batch(800, glowLayout, mkGlow(true, true), 'center'); this.gGlow.mesh.renderOrder = 3; this.scene.add(this.gGlow.mesh);
    this.aGlow = new Batch(1500, glowLayout, mkGlow(true, false), 'center'); this.aGlow.mesh.renderOrder = 5; this.scene.add(this.aGlow.mesh);
    // x-ray silhouette: draws the player/seals only where something in front hides them
    this.xrMat = new ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: XRAY_FS, uniforms: Object.assign({ uTex: { value: this.tAtlas }, uTime: { value: 0 } }, common),
      transparent: true, depthWrite: false, depthFunc: GreaterDepth });
    this.xray = new Batch(64, spLayout, this.xrMat); this.xray.mesh.renderOrder = 4.5; this.scene.add(this.xray.mesh);
    // player + seals: own batch drawn after the x-ray pass, so silhouettes only show through props/enemies, not through each other
    const chMat = this.spMat.clone(); chMat.uniforms = this.spMat.uniforms; chMat.transparent = true; chMat.depthWrite = true; // transparent list so it sorts after the x-ray pass
    this.chars = new Batch(64, spLayout, chMat); this.chars.mesh.renderOrder = 4.6; this.scene.add(this.chars.mesh);
    this.charShadow = new Mesh(this.chars.g, shMat); this.charShadow.frustumCulled = false; this.charShadow.renderOrder = 2; this.scene.add(this.charShadow);
    const ovMat = this.spMat.clone(); ovMat.depthTest = false; ovMat.uniforms = this.spMat.uniforms;
    this.ov = new Batch(800, spLayout, ovMat); this.ov.mesh.renderOrder = 6; this.scene.add(this.ov.mesh);
    // post
    this.pcam = new OrthographicCamera(-1, 1, 1, -1, 0, 1); this.pscene = new Scene();
    this.quad = new Mesh(new PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.pscene.add(this.quad);
    const pm = (fs, u) => new ShaderMaterial({ vertexShader: FS_QUAD_VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
    this.mCopy = pm(COPY_FS, { tSrc: { value: null }, uThr: { value: 0 }, uTexel: { value: new Vector2() } });
    this.mBlur = pm(BLUR_FS, { tSrc: { value: null }, uDir: { value: new Vector2() } });
    this.G = { bloom: 0.55, sat: 1.12, contrast: 1.06, vig: 0.5, vigCol: new Color(0.05, 0.02, 0.07), gain: new Color(1.02, 1.0, 0.97), lift: new Color(0.03, 0.02, 0.05), sh: new Color(-0.2, -0.25, 0.35), hi: new Color(0.35, 0.18, -0.15), flash: 0, tilt: 0.85, flashCol: new Color(1, 1, 1) };
    this.mComp = pm(COMP_FS, { tScene: { value: null }, tBlur: { value: null }, tBloom: { value: null }, tBloom2: { value: null }, uRes: { value: new Vector2() }, uTime: { value: 0 },
      uBloom: { value: 0 }, uSat: { value: 1 }, uContrast: { value: 1 }, uVig: { value: 0 }, uVigCol: { value: this.G.vigCol }, uGain: { value: this.G.gain }, uLift: { value: this.G.lift },
      uShTone: { value: this.G.sh }, uHiTone: { value: this.G.hi }, uFlash: { value: 0 }, uTilt: { value: 0.85 }, uFlashCol: { value: this.G.flashCol } });
    let hf = true; try { hf = r.capabilities.isWebGL2; } catch (e) { }
    this.rtType = hf ? HalfFloatType : UnsignedByteType;
    this.rts = null; this.viewW = 430; this.viewH = 300; this.zoom = 1;
  }
  mkRT(w, h, depth) { const t = new WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { type: this.rtType, depthBuffer: !!depth, stencilBuffer: !!depth, minFilter: LinearFilter, magFilter: LinearFilter }); t.texture.colorSpace = NoColorSpace; return t; }
  resize(w, h, pr) {
    this.r.setPixelRatio(pr); this.r.setSize(w, h, false);
    const W = Math.round(w * pr), H = Math.round(h * pr); this.W = W; this.H = H;
    if (this.rts) Object.values(this.rts).forEach(t => t.dispose());
    this.rts = { scene: this.mkRT(W, H, true), half: this.mkRT(W >> 1, H >> 1), halfB: this.mkRT(W >> 1, H >> 1), q: this.mkRT(W >> 2, H >> 2), qB: this.mkRT(W >> 2, H >> 2), e: this.mkRT(W >> 3, H >> 3), eB: this.mkRT(W >> 3, H >> 3) };
    this.aspect = w / h; this.cam.aspect = this.aspect; this.setZoom(this.zoom);
  }
  setZoom(z) {
    this.zoom = z; const t = Math.tan(this.cam.fov / 2 * Math.PI / 180);
    const needW = (this.aspect < 1 ? 185 : 390) * z, needH = 222 * z;
    this.D = Math.max(needH / (2 * t), needW / (2 * t * this.aspect));
    this.viewW = 2 * this.D * t * this.aspect; this.viewH = 2 * this.D * t / Math.sin(this.tilt) * 1.15;
    this.cam.near = this.D * 0.3; this.cam.far = this.D * 3; this.cam.updateProjectionMatrix();
    this.common.uFog.value.set(this.D * 1.0, this.D * 0.9);
  }
  begin() { this.xray.n = this.chars.n = 0; this.sp.n = this.ov.n = this.blob.n = this.gGlow.n = this.aGlow.n = 0; }
  // sprite: r = atlas rect; x,z ground position; h height above ground
  spr(r, x, h, z, o, batch) {
    const b = batch || this.sp; if (b.n >= b.cap) return; const i = b.n++, A = b.a, s = (o && o.s) || 1, sy = (o && o.sy) || 1;
    A.iPos[i * 3] = x; A.iPos[i * 3 + 1] = h; A.iPos[i * 3 + 2] = z;
    A.iSize[i * 2] = r.w * PIX * s; A.iSize[i * 2 + 1] = r.h * PIX * s * sy;
    A.iUV[i * 4] = r.u; A.iUV[i * 4 + 1] = r.v; A.iUV[i * 4 + 2] = r.uw; A.iUV[i * 4 + 3] = r.vh;
    const t = o && o.tint; A.iTint[i * 4] = t ? t[0] : 1; A.iTint[i * 4 + 1] = t ? t[1] : 1; A.iTint[i * 4 + 2] = t ? t[2] : 1; A.iTint[i * 4 + 3] = o && o.sh !== undefined ? o.sh : 1;
    A.iPar[i * 4] = o && o.flip ? 1 : 0; A.iPar[i * 4 + 1] = (o && o.flash) || 0; A.iPar[i * 4 + 2] = (o && o.em) || 0; A.iPar[i * 4 + 3] = (o && o.zb) || 0;
  }
  // glow: kind 0 circle, 1 ring, 2 beam, 3 star
  glow(kind, x, h, z, w, hh, rot, col, a, ground, batch) {
    const b = batch || (ground ? this.gGlow : this.aGlow); if (b.n >= b.cap) return; const i = b.n++, A = b.a;
    A.iPos[i * 3] = x; A.iPos[i * 3 + 1] = h; A.iPos[i * 3 + 2] = z; A.iSize[i * 3] = w; A.iSize[i * 3 + 1] = hh; A.iSize[i * 3 + 2] = rot || 0;
    A.iUV[i * 4] = kind * 0.25; A.iUV[i * 4 + 1] = 0; A.iUV[i * 4 + 2] = 0.25; A.iUV[i * 4 + 3] = 1;
    A.iCol[i * 4] = col[0]; A.iCol[i * 4 + 1] = col[1]; A.iCol[i * 4 + 2] = col[2]; A.iCol[i * 4 + 3] = a; A.iMode[i] = ground ? 1 : 0;
  }
  blobShadow(x, z, w, a) { this.glow(0, x, 0.2, z + 1, w, w * 0.55, 0, [0.12, 0.06, 0.16], a, true, this.blob); }
  setLook(look) { // per-biome lighting & grading
    this.U.amb.setRGB(...look.amb); this.U.fogCol.setRGB(...look.fog); this.common.uFogMax.value = look.fogMax;
    this.groundMat.uniforms.uPool.value.setRGB(...look.pool);
    this.G.gain.setRGB(...look.gain); this.G.lift.setRGB(...look.lift); this.G.sat = look.sat; this.G.vig = look.vig; this.G.bloom = look.bloom;
    this.shMat.uniforms.uCol.value = look.shadow;
  }
  draw(tx, tz, time, shakeX, shakeZ) {
    this.sp.end(); this.xray.end(); this.chars.end(); this.xrMat.uniforms.uTime.value = time; this.ov.end(); this.blob.end(); this.gGlow.end(); this.aGlow.end();
    const c = this.cam, D = this.D;
    c.position.set(tx + shakeX, Math.sin(this.tilt) * D, tz + Math.cos(this.tilt) * D + shakeZ);
    c.lookAt(tx + shakeX, 0, tz + shakeZ);
    this.ground.position.set(Math.round(tx / 100) * 100, 0, Math.round(tz / 100) * 100);
    this.groundMat.uniforms.uTime.value = time; this.groundMat.uniforms.uPlayer.value.set(tx, tz);
    const r = this.r, R = this.rts;
    r.setRenderTarget(R.scene); r.setClearColor(this.U.fogCol, 1); r.clear(true, true, true); r.render(this.scene, c);
    const pass = (mat, out) => { this.quad.material = mat; r.setRenderTarget(out); r.render(this.pscene, this.pcam); };
    const copy = (src, out, thr) => { this.mCopy.uniforms.tSrc.value = src.texture; this.mCopy.uniforms.uThr.value = thr; this.mCopy.uniforms.uTexel.value.set(1 / src.width, 1 / src.height); pass(this.mCopy, out); };
    const blur = (a, b, sc) => { this.mBlur.uniforms.tSrc.value = a.texture; this.mBlur.uniforms.uDir.value.set(sc / a.width, 0); pass(this.mBlur, b); this.mBlur.uniforms.tSrc.value = b.texture; this.mBlur.uniforms.uDir.value.set(0, sc / a.height); pass(this.mBlur, a); };
    copy(R.scene, R.half, 0); blur(R.half, R.halfB, 1.2);
    copy(R.half, R.q, 0.97); blur(R.q, R.qB, 1); blur(R.q, R.qB, 1.6);
    copy(R.q, R.e, 0); blur(R.e, R.eB, 1.5); blur(R.e, R.eB, 2.2);
    const u = this.mComp.uniforms, G = this.G;
    u.tScene.value = R.scene.texture; u.tBlur.value = R.half.texture; u.tBloom.value = R.q.texture; u.tBloom2.value = R.e.texture;
    u.uRes.value.set(this.W, this.H); u.uTime.value = time; u.uBloom.value = G.bloom; u.uSat.value = G.sat; u.uContrast.value = G.contrast; u.uVig.value = G.vig; u.uFlash.value = G.flash; u.uTilt.value = G.tilt;
    pass(this.mComp, null);
  }
}
