import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

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
  styleUrl: './donut-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  readonly centerLabel = input.required<string>();
  readonly centerSub = input.required<string>();
  /** Optional legend items. When omitted the legend is not rendered. */
  readonly legendItems = input<DonutLegendItem[]>([]);
  readonly legendTitle = input<string>('');
  /** 'list' (default) stacks a vertical divided list below the donut; 'grid' renders a 2-col grid alongside the donut. */
  readonly legendLayout = input<'list' | 'grid'>('list');

  readonly supportsHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  readonly hoveredId = signal<string | null>(null);

  protected readonly hoveredItem = computed(() => {
    const id = this.hoveredId();
    if (!id) return null;
    return this.legendItems().find((item) => item.id === id) ?? null;
  });

  protected readonly displayLabel = computed(
    () => this.hoveredItem()?.value ?? this.centerLabel(),
  );

  protected readonly displaySub = computed(
    () => this.hoveredItem()?.label ?? this.centerSub(),
  );

  readonly centerLabelFontSize = computed(() => {
    const maxPx = 28;
    const minPx = 14;
    const maxWidth = 240;
    const fitted = maxWidth / this.displayLabel().length;
    return Math.min(maxPx, Math.max(minPx, fitted)).toFixed(1) + 'px';
  });
}
