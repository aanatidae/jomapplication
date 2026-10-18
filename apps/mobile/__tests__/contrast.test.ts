import { theme } from '../src/theme/tokens';

function rgb(hex: string) { return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255); }
function luminance(values: number[]) { return values.reduce((sum, value, index) => sum + [0.2126, 0.7152, 0.0722][index] * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4), 0); }
function contrast(a: number[], b: number[]) { const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (light + 0.05) / (dark + 0.05); }
it('keeps essential text and the least-emphasized route legible on every schematic surface', () => {
  const c = theme.color;
  for (const [foreground, background] of [[c.ink, c.background], [c.muted, c.background], [c.muted, c.surface], [c.onAccent, c.accent], [c.warning, c.surface], [c.error, c.surface], [c.onDisabled, c.disabled]]) {
    expect(contrast(rgb(foreground), rgb(background))).toBeGreaterThanOrEqual(4.5);
  }
  for (const background of [c.map, c.park, c.block, c.water, c.road]) {
    const bg = rgb(background);
    const blended = rgb(c.alternateRoute).map((value, index) => value * 0.9 + bg[index] * 0.1);
    expect(contrast(blended, bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(rgb(c.accent), bg)).toBeGreaterThanOrEqual(3);
  }
});
