export interface ViewportState {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
  dpr: number
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
}

export interface CanvasLayer {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext | null
  ctx2d: CanvasRenderingContext2D | null
  type: 'webgl2' | '2d'
  purpose: 'candles' | 'volume' | 'heatmap' | 'overlay' | 'hud' | 'grid'
}

export function createWebGL2Context(
  canvas: HTMLCanvasElement,
  options: WebGLContextAttributes = {}
): WebGL2RenderingContext | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    ...options,
  }) as WebGL2RenderingContext | null

  if (!gl) return null

  gl.enable(gl.BLEND)
  gl.blendFuncSeparate(
    gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE, gl.ONE_MINUS_SRC_ALPHA
  )
  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)
  return gl
}

export function createLayerStack(
  container: HTMLDivElement,
  width: number,
  height: number,
  dpr: number
): CanvasLayer[] {
  const LAYERS: Array<{ purpose: CanvasLayer['purpose']; type: CanvasLayer['type'] }> = [
    { purpose: 'grid', type: 'webgl2' },
    { purpose: 'heatmap', type: 'webgl2' },
    { purpose: 'volume', type: 'webgl2' },
    { purpose: 'candles', type: 'webgl2' },
    { purpose: 'overlay', type: '2d' },
    { purpose: 'hud', type: '2d' },
  ]

  return LAYERS.map(({ purpose, type }, index) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.cssText = `
      position:absolute;top:0;left:0;
      width:${width}px;height:${height}px;
      z-index:${index + 1};
      pointer-events:${purpose === 'hud' ? 'all' : 'none'};
    `
    container.appendChild(canvas)

    if (type === 'webgl2') {
      const gl = createWebGL2Context(canvas)
      return { canvas, gl, ctx2d: null, type: gl ? 'webgl2' : '2d', purpose }
    } else {
      const ctx2d = canvas.getContext('2d', { alpha: true })!
      ctx2d.scale(dpr, dpr)
      return { canvas, gl: null, ctx2d, type: '2d', purpose }
    }
  })
}

export class CoordinateMapper {
  private vp: ViewportState

  constructor(viewport: ViewportState) {
    this.vp = viewport
  }

  update(viewport: Partial<ViewportState>): void {
    this.vp = { ...this.vp, ...viewport }
  }

  private get chartW() {
    return this.vp.width - this.vp.paddingLeft - this.vp.paddingRight
  }

  private get chartH() {
    return this.vp.height - this.vp.paddingTop - this.vp.paddingBottom
  }

  xToPixel(t: number): number {
    return this.vp.paddingLeft + (t - this.vp.xMin) / (this.vp.xMax - this.vp.xMin) * this.chartW
  }

  yToPixel(p: number): number {
    return this.vp.paddingTop + (1 - (p - this.vp.yMin) / (this.vp.yMax - this.vp.yMin)) * this.chartH
  }

  pixelToX(px: number): number {
    return this.vp.xMin + (px - this.vp.paddingLeft) / this.chartW * (this.vp.xMax - this.vp.xMin)
  }

  pixelToY(py: number): number {
    return this.vp.yMin + (1 - (py - this.vp.paddingTop) / this.chartH) * (this.vp.yMax - this.vp.yMin)
  }

  getCandleWidth(barMs: number): number {
    return Math.max(1, (barMs / (this.vp.xMax - this.vp.xMin)) * this.chartW * 0.8)
  }

  getPriceRange(): number { return this.vp.yMax - this.vp.yMin }
  getTimeRange(): number { return this.vp.xMax - this.vp.xMin }
  getViewport(): ViewportState { return { ...this.vp } }

  static autoScaleY(prices: Float64Array, outlierPct = 0.02): { yMin: number; yMax: number } {
    if (!prices.length) return { yMin: 0, yMax: 1 }
    const sorted = Float64Array.from(prices).sort()
    const lo = Math.floor(sorted.length * outlierPct)
    const hi = Math.ceil(sorted.length * (1 - outlierPct)) - 1
    const rawMin = sorted[Math.max(0, lo)]
    const rawMax = sorted[Math.min(sorted.length - 1, hi)]
    const pad = (rawMax - rawMin) * 0.05
    return { yMin: rawMin - pad, yMax: rawMax + pad }
  }
}

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error:\n${log}`)
  }
  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Shader link error: ${gl.getProgramInfoLog(program)}`)
  }
  gl.deleteShader(vert)
  gl.deleteShader(frag)
  return program
}

export const CANDLE_VERT_SHADER = `#version 300 es
precision highp float;
layout(location=0) in float a_x;
layout(location=1) in float a_open;
layout(location=2) in float a_close;
layout(location=3) in float a_high;
layout(location=4) in float a_low;
layout(location=5) in float a_width;
layout(location=6) in vec2  a_vertex;
layout(location=7) in float a_isWick;
out float v_isBullish;
out float v_isWick;
void main() {
  v_isBullish = a_close >= a_open ? 1.0 : 0.0;
  v_isWick    = a_isWick;
  float bodyTop    = max(a_open, a_close);
  float bodyBottom = min(a_open, a_close);
  float bodyHeight = max(bodyTop - bodyBottom, 0.001);
  vec2 pos;
  if (a_isWick > 0.5) {
    pos.x = a_x + a_vertex.x * a_width * 0.12;
    pos.y = a_low + a_vertex.y * (a_high - a_low);
  } else {
    pos.x = a_x + a_vertex.x * a_width;
    pos.y = bodyBottom + a_vertex.y * bodyHeight;
  }
  gl_Position = vec4(pos, 0.0, 1.0);
}`

export const CANDLE_FRAG_SHADER = `#version 300 es
precision mediump float;
in float v_isBullish;
in float v_isWick;
out vec4 fragColor;
void main() {
  vec4 bull = vec4(0.0,  1.0,   0.533, 1.0);
  vec4 bear = vec4(1.0,  0.192, 0.192, 1.0);
  vec4 base = v_isBullish > 0.5 ? bull : bear;
  fragColor  = v_isWick > 0.5 ? base * vec4(1,1,1,0.6) : base;
}`

export const HEATMAP_VERT_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec2  a_position;
layout(location=1) in float a_intensity;
out float v_intensity;
void main() {
  v_intensity = a_intensity;
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = 4.0;
}`

export const HEATMAP_FRAG_SHADER = `#version 300 es
precision mediump float;
in float v_intensity;
out vec4 fragColor;
vec3 plasma(float t) {
  vec3 c0=vec3(0.05,0.03,0.53);
  vec3 c1=vec3(0.56,0.06,0.61);
  vec3 c2=vec3(0.87,0.29,0.41);
  vec3 c3=vec3(0.99,0.62,0.12);
  vec3 c4=vec3(0.94,0.98,0.13);
  if(t<0.25) return mix(c0,c1,t*4.0);
  if(t<0.50) return mix(c1,c2,(t-0.25)*4.0);
  if(t<0.75) return mix(c2,c3,(t-0.50)*4.0);
  return mix(c3,c4,(t-0.75)*4.0);
}
void main() {
  float a = v_intensity * 0.72;
  if(a<0.02) discard;
  fragColor = vec4(plasma(v_intensity), a);
}`