export const fmt = new Intl.NumberFormat('en-US');

export const mmss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
