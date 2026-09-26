// 测试专用独立 oracle：复写历史 translate → scale → rotate 矩阵组合，
// 不调用 Calcit 生成器，也不使用被测的角度累加实现。
export function originalTree(time, depth = 5) {
  const result = [];
  const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  const point = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
  function walk(level, m, id) {
    const [x0,y0] = point(m,0,0), width = 4 * Math.hypot(m[0], m[1]);
    for (const [dx,dy,suffix] of [[80,-220,"L"],[-140,-100,"R"]]) {
      const [x1,y1] = point(m,dx,dy);
      result.push({ id:id+suffix, x0,y0,x1,y1,width });
    }
    if (!level) return;
    const a = (0.02+0.001*0.6)*Math.sin(time*10/(8+0.9*11));
    const b = (0.031+0.001*0.5)*Math.sin(time*10/(13+6*0.6));
    for (const [x,y,scale,degrees,suffix] of [[80,-220,0.6+1.3*a,30*a+10,"L"],[-140,-100,0.73+2*b,20*b+10,"R"]]) {
      const r = degrees*Math.PI/180;
      const local = mul([scale,0,0,scale,x,y], [Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);
      walk(level-1,mul(m,local),id+suffix);
    }
  }
  walk(depth,[1,0,0,1,0,240],"root");
  return result;
}
