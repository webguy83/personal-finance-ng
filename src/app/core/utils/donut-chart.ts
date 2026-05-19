import { DonutSegment } from '../components/donut-chart/donut-chart.component';

const DONUT_RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Computes SVG dash-array/offset values for a donut chart.
 * @param items Array of items with an `id`, `theme`, and numeric `maximum` (or `value`).
 */
export function computeDonutSegments(
  items: Array<{ id: string; theme: string; maximum: number }>,
): DonutSegment[] {
  const total = items.reduce((sum, b) => sum + b.maximum, 0);
  if (total === 0) return [];
  let offset = 0;
  return items.map((item) => {
    const fullLen = (item.maximum / total) * CIRCUMFERENCE;
    const seg: DonutSegment = {
      id: item.id,
      theme: item.theme,
      dashArray: `${Math.max(0, fullLen)} ${CIRCUMFERENCE}`,
      dashOffset: -offset,
    };
    offset += fullLen;
    return seg;
  });
}
