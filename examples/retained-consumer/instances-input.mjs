// 独立消费者的静态宿主数据输入；实例声明和绘制语义由 Calcit 公共 API 决定。
export function createInstancePositions(count) {
  const positions = new Float32Array(count * 2);
  for (let index = 0; index < count; index++) {
    positions[index * 2] = 8 + (index % 125) * 2;
    positions[index * 2 + 1] = 10 + Math.floor(index / 125) * 2;
  }
  return positions;
}
