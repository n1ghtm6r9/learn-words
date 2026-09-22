export function petalOffset(index: number, count: number, radius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
  return {
    x: Math.round(Math.cos(angle) * radius * 100) / 100,
    y: Math.round(Math.sin(angle) * radius * 100) / 100,
  };
}
