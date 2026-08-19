export function cssColorToHex(color: string, fallback: string): string {
  const trimmed = color.trim();
  if (trimmed === '') return fallback;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) return fallback;

    context.fillStyle = '#000000';
    context.fillStyle = trimmed;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return fallback;
  }
}
