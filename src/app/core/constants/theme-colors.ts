import type { DropdownOption } from '../components/dropdown/dropdown.component';

export const THEME_COLORS: { value: string; label: string }[] = [
  { value: '#277C78', label: 'Green' },
  { value: '#82C9D7', label: 'Cyan' },
  { value: '#F2CDAC', label: 'Yellow' },
  { value: '#626070', label: 'Navy' },
  { value: '#C94736', label: 'Red' },
  { value: '#826CB0', label: 'Purple' },
  { value: '#AF81BA', label: 'Turquoise' },
  { value: '#597C7C', label: 'Teal' },
  { value: '#93674F', label: 'Brown' },
  { value: '#3F82B2', label: 'Blue' },
  { value: '#97A0AC', label: 'Silver' },
  { value: '#7F9161', label: 'Olive' },
  { value: '#CAB361', label: 'Gold' },
  { value: '#BE6C49', label: 'Copper' },
];

/**
 * Returns dropdown options for all theme colors, marking already-used ones as disabled.
 * @param usedThemes Set of color values currently in use
 * @param excludeId Optional id of the item being edited (its current theme is not marked used)
 */
export function buildThemeColorOptions(usedThemes: Set<string>): DropdownOption[] {
  return THEME_COLORS.map((c) => ({
    value: c.value,
    label: c.label,
    color: c.value,
    ...(usedThemes.has(c.value) ? { secondaryLabel: 'Already used', disabled: true } : {}),
  }));
}
