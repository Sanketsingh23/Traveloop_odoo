import { useEffect, useRef } from 'react';

const VERT = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(a_pos.x * 0.5 + 0.5, -a_pos.y * 0.5 + 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform float     u_time;
  varying vec2      v_uv;
  void main() {
    float skyLine = 0.62;

    float inSky = smoothstep(skyLine - 0.04, skyLine + 0.06, v_uv.y);
    vec2 skyCenter = vec2(0.5, 1.0);
    float creep = fract(u_time * 0.00060 / 0.05) * 0.05;
    float zoomFactor = 1.0 - (sin(u_time * 0.018) * 0.022 + creep) * inSky;
    vec2 zoomedSkyUV = skyCenter + (v_uv - skyCenter) * zoomFactor;
    vec2 skyUV = mix(v_uv, zoomedSkyUV, inSky);
    float cloudDx = inSky * (
        sin(u_time * 0.045 + v_uv.x * 1.5) * 0.009
      + sin(u_time * 0.070 + v_uv.x * 0.8) * 0.005
    );
    float cloudDy = (skyUV.y - v_uv.y);

    float inPlant = 1.0 - smoothstep(skyLine - 0.07, skyLine + 0.02, v_uv.y);
    float depth = clamp((skyLine - v_uv.y) / skyLine, 0.0, 1.0);

    float gust = sin(u_time * 0.38) * 0.50
               + sin(u_time * 0.61) * 0.30
               + sin(u_time * 0.97) * 0.20;

    float clusterPhase = v_uv.x * 8.0
                       + sin(v_uv.x * 3.5) * 2.0
                       + v_uv.y * 2.0;
    float clusterSway = sin(u_time * 1.10 + clusterPhase) * 0.65
                      + sin(u_time * 1.80 + clusterPhase * 0.8 + 1.8) * 0.35;

    float plantAmp = pow(depth, 0.55) * 0.0058 * inPlant;
    float plantDx = (gust * 0.58 + clusterSway * 0.42) * plantAmp;
    float plantDy = sin(u_time * 0.75 + clusterPhase * 0.5) * plantAmp * 0.3;

    vec2 finalUV = v_uv;
    finalUV.x += mix(cloudDx, plantDx, inPlant);
    finalUV.y += mix(cloudDy, plantDy, inPlant);
    finalUV = clamp(finalUV, 0.0, 1.0);

    gl_FragColor = texture2D(u_tex, finalUV);
  }
`;

export default function SwayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      canvas2DFallback(canvas);
      return;
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uTex = gl.getUniformLocation(prog, 'u_tex');
    gl.uniform1i(uTex, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const img = new Image();
    img.src = '/hero-bg.jpg';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };

    let raf: number;
    const start = performance.now();
    const render = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-glow"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}

function canvas2DFallback(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  img.src = '/hero-bg.jpg';
  img.onload = () => {
    const draw = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    };
    draw();
  };
}
