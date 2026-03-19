export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function isFull(booked: number, max: number): boolean {
  return booked >= max;
}

export function fillPercent(booked: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((booked / max) * 100);
}

export function fillColor(percent: number): string {
  if (percent >= 100) return '#FF3B30';
  if (percent >= 70)  return '#FF9500';
  return '#34C759';
}
