import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutSegment {
  id: string;
  theme: string;
  dashArray: string;
  dashOffset: number;
}

export interface DonutLegendItem {
  id: string;
  theme: string;
  label: string;
  value: string;
  sub: string;
}

@Component({
  selector: 'app-donut-chart',
  templateUrl: './donut-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  readonly centerLabel = input.required<string>();
  readonly centerSub = input.required<string>();
  /** Optional legend items. When omitted the legend is not rendered. */
  readonly legendItems = input<DonutLegendItem[]>([]);
  readonly legendTitle = input<string>('');

  readonly centerLabelFontSize = computed(() => {
    console.log('Calculating length of center label:', this.centerLabel().length);
    const maxPx = 28;
    const minPx = 14;
    const maxWidth = 240;
    const fitted = maxWidth / this.centerLabel().length;
    return Math.min(maxPx, Math.max(minPx, fitted)).toFixed(1) + 'px';
  });
}
