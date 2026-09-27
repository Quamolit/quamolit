// 独立消费者的静态宿主数据输入；实例声明和绘制语义由 Calcit 公共 API 决定。
export function createInstancePositions(count) {
  const positions = new Float32Array(count * 2);
  for (let index = 0; index < count; index++) {
    positions[index * 2] = 5 + (index % 100) * 3.1;
    positions[index * 2 + 1] = 5 + Math.floor(index / 100) * 1.7;
  }
  return positions;
}
