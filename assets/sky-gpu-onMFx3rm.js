import"./sky-D5W2TLf8.js";var e=new Float32Array([-1,-1,1,-1,-1,1,1,1]),t=new Uint16Array([0,1,2,2,1,3]);function n(e,t,n=0,r=1){let i=Math.floor((t.length-n)/8),a=Math.min(e.length,i);for(let i=0;i<a;i++){let a=e[i],o=n+i*8;t[o]=a.x,t[o+1]=a.y,t[o+2]=a.z,t[o+3]=a.r,t[o+4]=a.rgb[0]/255,t[o+5]=a.rgb[1]/255,t[o+6]=a.rgb[2]/255,t[o+7]=Math.min(1,a.a*r)}return a}function r(e,t){let r=n(e.stars,t,0,1);return r+n(e.field,t,r*8,.85)}var i=`fn placeDisk(wx: f32, wy: f32) -> vec2f {
  let c = cos(u.rot);
  let s = sin(u.rot);
  let rx = wx * c - wy * s;
  let ry = wx * s + wy * c;
  return vec2f(u.origin.x + rx * u.scale, u.origin.y + ry * u.scale);
}`,a=`
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  vis: f32,
  count: u32,
  time: f32,
  live: u32,
  pad2: u32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

${i}

struct VertOut {
  @builtin(position) clip: vec4f,
  @location(0) col: vec4f,
  @location(1) local: vec2f,
};

@vertex
fn vs(
  @location(0) corner: vec2f,
  @location(1) pos: vec4f,
  @location(2) col: vec4f,
) -> VertOut {
  let p = placeDisk(pos.x, pos.y);
  let size = max(pos.w, 0.45) * u.point;
  let q = corner * size;
  let phase = pos.x * 17.0 + pos.y * 13.0;
  let pulse = 0.62 + 0.24 * sin(u.time * 2.4 + phase) + 0.14 * sin(u.time * 0.7 + phase * 1.7);
  let tw = select(1.0, pulse, u.live == 1u);
  var out: VertOut;
  out.clip = vec4f(((p.x + q.x) / u.res.x) * 2.0 - 1.0, 1.0 - ((p.y + q.y) / u.res.y) * 2.0, 0.0, 1.0);
  out.col = vec4f(col.rgb, col.a * u.vis * tw);
  out.local = corner;
  return out;
}

@fragment
fn fs(v: VertOut) -> @location(0) vec4f {
  let d = dot(v.local, v.local);
  if (d > 1.0) { discard; }
  let w = 1.0 - d;
  let a = v.col.a * w;
  return vec4f(v.col.rgb * a, a);
}
`,o=`
struct Uniforms {
  origin: vec2f,
  res: vec2f,
  scale: f32,
  rot: f32,
  point: f32,
  vis: f32,
  count: u32,
  time: f32,
  live: u32,
  pad2: u32,
};
struct Star { pos: vec4f, col: vec4f }
struct Counter { n: atomic<u32> }

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> src: array<Star>;
@group(0) @binding(2) var<storage, read_write> dst: array<Star>;
@group(0) @binding(3) var<storage, read_write> counter: Counter;
@group(0) @binding(4) var<storage, read_write> indirect: array<u32>;

${i}

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= u.count) { return; }
  let star = src[i];
  if (star.col.a * u.vis < 0.012) { return; }
  let p = placeDisk(star.pos.x, star.pos.y);
  let size = max(star.pos.w, 0.45) * u.point;
  if (p.x + size < 0.0 || p.x - size > u.res.x || p.y + size < 0.0 || p.y - size > u.res.y) {
    return;
  }
  let slot = atomicAdd(&counter.n, 1u);
  dst[slot] = star;
}

@compute @workgroup_size(1)
fn fin() {
  indirect[0] = 6u;
  indirect[1] = atomicLoad(&counter.n);
  indirect[2] = 0u;
  indirect[3] = 0u;
  indirect[4] = 0u;
}
`;function s(e){let t=Math.max(e.dpr,1);return{ox:e.ox*t,oy:e.oy*t,w:e.w*t,h:e.h*t,scale:e.scale*t,rot:e.rot,point:t,vis:e.vis}}function c(e,t,n){return e.createBuffer({size:Math.max(256,t),usage:n})}async function l(n){let i=navigator;if(!i.gpu)return null;try{let l=await i.gpu.requestAdapter();if(!l)return null;let u=await l.requestDevice(),d=n.getContext(`webgpu`);if(!d)return null;let f=i.gpu.getPreferredCanvasFormat();d.configure({device:u,format:f,alphaMode:`premultiplied`});let p=u.createShaderModule({code:a}),m=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}}]}),h=u.createRenderPipeline({layout:u.createPipelineLayout({bindGroupLayouts:[m]}),vertex:{module:p,entryPoint:`vs`,buffers:[{arrayStride:8,stepMode:`vertex`,attributes:[{shaderLocation:0,offset:0,format:`float32x2`}]},{arrayStride:32,stepMode:`instance`,attributes:[{shaderLocation:1,offset:0,format:`float32x4`},{shaderLocation:2,offset:16,format:`float32x4`}]}]},fragment:{module:p,entryPoint:`fs`,targets:[{format:f,blend:{color:{srcFactor:`one`,dstFactor:`one`},alpha:{srcFactor:`one`,dstFactor:`one`}}}]},primitive:{topology:`triangle-list`}}),g=c(u,256,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),_=c(u,e.byteLength,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),v=c(u,t.byteLength,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST);u.queue.writeBuffer(_,0,e),u.queue.writeBuffer(v,0,t);let y=GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE,b=c(u,131072,y),x=c(u,131072,y),S=c(u,256,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),C=c(u,256,GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),w=u.createBindGroup({layout:m,entries:[{binding:0,resource:{buffer:g}}]}),T=null,E=null,D=null;try{let e=u.createShaderModule({code:o});D=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}}]});let t=u.createPipelineLayout({bindGroupLayouts:[D]});T=u.createComputePipeline({layout:t,compute:{module:e,entryPoint:`cull`}}),E=u.createComputePipeline({layout:t,compute:{module:e,entryPoint:`fin`}})}catch{T=null,E=null,D=null}let O={device:u,context:d,pipeline:h,uniform:g,stars:b,quad:_,index:v,bind:w,cap:4096},k=new Float32Array(32768),A=null,j=0,M=new ArrayBuffer(256),N=new Float32Array(M),P=new Uint32Array(M),F=new Uint32Array([0]),I=()=>D?u.createBindGroup({layout:D,entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:{buffer:b}},{binding:2,resource:{buffer:x}},{binding:3,resource:{buffer:S}},{binding:4,resource:{buffer:C}}]}):null,L=I();return{draw(e,t){let n=e.stars.length+e.field.length;e!==A&&(n*8>k.length&&(k=new Float32Array(n*8)),n>O.cap&&(O.cap=n,b.destroy(),x.destroy(),b=c(u,n*8*4,y),x=c(u,n*8*4,y),O.stars=b,L=I()),j=r(e,k),u.queue.writeBuffer(b,0,k.subarray(0,j*8)),A=e);let i=s(t);N[0]=i.ox,N[1]=i.oy,N[2]=i.w,N[3]=i.h,N[4]=i.scale,N[5]=i.rot,N[6]=i.point,N[7]=i.vis,P[8]=j,N[9]=t.still?0:t.time??0,P[10]=+!t.still,u.queue.writeBuffer(g,0,M);let a=u.createCommandEncoder(),o=!!(T&&E&&L&&j>0);if(o){u.queue.writeBuffer(S,0,F);let e=a.beginComputePass();e.setPipeline(T),e.setBindGroup(0,L),e.dispatchWorkgroups(Math.ceil(j/64)),e.setPipeline(E),e.setBindGroup(0,L),e.dispatchWorkgroups(1),e.end()}let l=a.beginRenderPass({colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:`clear`,storeOp:`store`}]});j>0&&(l.setPipeline(h),l.setBindGroup(0,O.bind),l.setVertexBuffer(0,O.quad),l.setVertexBuffer(1,o?x:b),l.setIndexBuffer(O.index,`uint16`),o?l.drawIndexedIndirect(C,0):l.drawIndexed(6,j)),l.end(),u.queue.submit([a.finish()])},clear(){A=null,j=0;let e=u.createCommandEncoder();e.beginRenderPass({colorAttachments:[{view:d.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:`clear`,storeOp:`store`}]}).end(),u.queue.submit([e.finish()])},destroy(){O.stars.destroy(),x.destroy(),S.destroy(),C.destroy(),O.quad.destroy(),O.index.destroy(),O.uniform.destroy(),u.destroy()}}}catch{return null}}export{l as createSkyGpu};