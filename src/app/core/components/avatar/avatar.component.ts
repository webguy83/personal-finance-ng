import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <img
      [src]="avatarUrl()"
      [alt]="name()"
      class="rounded-full object-cover"
      width="40"
      height="40"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  name = input('');

  avatarUrl = computed(() => {
    const url = new URL('https://api.dicebear.com/9.x/initials/svg');
    url.searchParams.set('seed', this.name().trim());
    url.searchParams.set('backgroundType', 'solid');
    url.searchParams.set(
      'backgroundColor',
      '277C78,626070,82C9D7,826CB0,C94736,93674F,3F82B2,7F9161',
    );
    url.searchParams.set('fontFamily', 'Arial');
    url.searchParams.set('fontSize', '40');
    url.searchParams.set('fontWeight', '700');
    return url.href;
  });
}
