import type { UserProfileResponse } from '@/api';
import { getCountryName, isValidCountryCode } from '@/constants/countries';
import type { Player } from '@/types';

export const LEVEL_RANGES: Record<number, { min: number; max: number }> = {
  1: { min: 1, max: 800 },
  2: { min: 801, max: 950 },
  3: { min: 951, max: 1100 },
  4: { min: 1101, max: 1250 },
  5: { min: 1251, max: 1400 },
  6: { min: 1401, max: 1550 },
  7: { min: 1551, max: 1700 },
  8: { min: 1701, max: 1850 },
  9: { min: 1851, max: 2000 },
  10: { min: 2001, max: 3500 },
};

export function calculateLevel(elo: number): number {
  if (elo >= 2001) return 10;
  if (elo >= 1851) return 9;
  if (elo >= 1701) return 8;
  if (elo >= 1551) return 7;
  if (elo >= 1401) return 6;
  if (elo >= 1251) return 5;
  if (elo >= 1101) return 4;
  if (elo >= 951) return 3;
  if (elo >= 801) return 2;
  return 1;
}

export function getLevelProgress(elo: number, level: number) {
  const range = LEVEL_RANGES[level] ?? { min: 1, max: 2000 };
  if (level >= 10) {
    return {
      min: 2001,
      max: Math.max(elo, 3000),
      percent: 100,
      toNext: 0,
      isMax: true,
    };
  }
  const span = range.max - range.min;
  const currentInLevel = Math.max(0, elo - range.min);
  const percent = Math.min(100, Math.max(0, (currentInLevel / span) * 100));
  const toNext = Math.max(0, range.max + 1 - elo);
  return {
    min: range.min,
    max: range.max,
    percent,
    toNext,
    isMax: false,
  };
}

export function buildPlayerFromProfile(profile: UserProfileResponse): Player {
  const elo = profile.elo ?? 1000;
  const level = calculateLevel(elo);
  const name = profile.username || `Player #${profile.id}`;
  const rawCode = profile.country?.trim().toUpperCase();
  const countryCode = isValidCountryCode(rawCode) ? rawCode! : 'RU';
  return {
    name,
    initials: name.slice(0, 2).toUpperCase(),
    countryCode,
    country: getCountryName(countryCode),
    elo,
    level,
  };
}
