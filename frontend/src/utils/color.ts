/** Generates a random, reasonably vivid hex color suitable for category/tag swatches. */
export function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.random() * 20; // 65–85%
  const lightness = 50 + Math.random() * 10; // 50–60%
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}
