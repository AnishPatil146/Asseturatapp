export class RendererContext {
    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;
    
    // Core Shaders
    private candleProgram: WebGLProgram | null = null;
    private vao: WebGLVertexArrayObject | null = null;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true, // We might turn this off for performance later
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        if (!gl) {
            throw new Error('WebGL2 not supported. A WebGPU fallback should be implemented here in the future.');
        }

        this.gl = gl as WebGL2RenderingContext;
        this.init();
    }

    private init() {
        const gl = this.gl;
        
        // Basic configuration
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Assetura Obsidian Black
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Setup initial generic shader program for instanced candles
        this.setupCandleShaders();
    }

    private setupCandleShaders() {
        const gl = this.gl;

        const vsSource = `#version 300 es
        precision highp float;
        
        // Instanced data
        in vec4 a_ohlc; // x=open, y=high, z=low, w=close
        in float a_time; // X axis mapping
        in vec4 a_color; // Color (Bullish/Bearish)
        
        // Vertex data for drawing the quad
        in vec2 a_position; // Instance geometry (quad)
        
        // Uniforms for projection / coordinate mapping
        uniform mat3 u_matrix;
        uniform float u_candleWidth;

        out vec4 v_color;

        void main() {
            // Simplified transformation for candlestick body/wick
            // In a full implementation, a_position determines if this vertex
            // belongs to the body or the wick based on geometry ID
            
            vec2 pos = a_position;
            
            // X position is base time + width offset
            float x = a_time + pos.x * u_candleWidth;
            
            // Y position depends on if this is body or wick.
            // Simplified logic: pos.y = 0.0 to 1.0 mapping to low/high
            // We assume a_position.y gives us the mapped height
            float y = mix(a_ohlc.z, a_ohlc.y, pos.y); 

            vec3 transform = u_matrix * vec3(x, y, 1.0);
            gl_Position = vec4(transform.xy, 0.0, 1.0);
            
            v_color = a_color;
        }
        `;

        const fsSource = `#version 300 es
        precision highp float;
        
        in vec4 v_color;
        out vec4 outColor;
        
        void main() {
            outColor = v_color;
        }
        `;

        this.candleProgram = this.createProgram(vsSource, fsSource);
    }

    private createProgram(vsSource: string, fsSource: string): WebGLProgram {
        const gl = this.gl;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

        const program = gl.createProgram();
        if (!program) throw new Error("Failed to create program");

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            throw new Error("Failed to link shader program");
        }

        return program;
    }

    private compileShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            throw new Error("Failed to compile shader");
        }

        return shader;
    }

    public resize(width: number, height: number) {
        // Adjust for device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    public clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    // Example render method signature
    public renderCandles(ohlcBuffer: Float32Array, timeBuffer: Float32Array, colorBuffer: Float32Array, count: number, transformMatrix: Float32Array, candleWidth: number) {
        const gl = this.gl;
        if (!this.candleProgram) return;

        gl.useProgram(this.candleProgram);

        // Here we would bind VAOs and buffers, setup attributes with instanced divisor
        // gl.vertexAttribDivisor(loc, 1);
        
        // Setting uniforms
        const matrixLoc = gl.getUniformLocation(this.candleProgram, 'u_matrix');
        const widthLoc = gl.getUniformLocation(this.candleProgram, 'u_candleWidth');
        
        gl.uniformMatrix3fv(matrixLoc, false, transformMatrix);
        gl.uniform1f(widthLoc, candleWidth);

        // draw call
        // gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    }
}
