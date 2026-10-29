import type { ChatMessage, MapStat, MatchHistoryRow, MatchInfo, PartySlot, Player } from '../types';

const p = (name: string, countryCode: string, country: string, elo: number, level: number): Player => ({
  name,
  initials: name.slice(0, 2).toUpperCase(),
  countryCode,
  country,
  elo,
  level,
});

export const currentPlayer: Player = p('vex', 'SE', 'Sweden', 1842, 8);

export const playerSummary = {
  realName: 'Alex Lindberg',
  memberSince: 'March 2023',
  rank: 1284,
  region: 'Europe',
  matches: 348,
  winRate: 56,
  avgKd: 1.24,
  avgKills: 21.4,
  last5: ['W', 'W', 'L', 'W', 'L'] as const,
  joined: '14 Mar 2023',
  lastPlayed: '12 Oct 2026',
  steamName: 'vex',
  steamUrl: 'https://steamcommunity.com/',
  status: 'Verified',
  online: true,
  eloThisMonth: 142,
};

export const ratingHistory = {
  labels: ['14 Sep', '21 Sep', '28 Sep', '05 Oct', '13 Oct'],
  values: [
    1700, 1722, 1708, 1752, 1741, 1782, 1767, 1809, 1790, 1812, 1765, 1800, 1830, 1810, 1850, 1825,
    1812, 1855, 1838, 1872, 1845, 1862, 1850, 1878, 1862, 1840, 1818, 1850, 1880, 1858,
  ],
};

export const matchHistory: MatchHistoryRow[] = [
  { id: '482193', date: '12 Oct, 21:34', map: 'Mirage', result: 'W', score: '13 : 9', kda: '24 / 15 / 6', eloDelta: 25 },
  { id: '482150', date: '12 Oct, 20:42', map: 'Ancient', result: 'W', score: '13 : 7', kda: '21 / 12 / 4', eloDelta: 24 },
  { id: '481977', date: '11 Oct, 22:18', map: 'Inferno', result: 'L', score: '10 : 13', kda: '18 / 20 / 7', eloDelta: -25 },
  { id: '481902', date: '11 Oct, 21:06', map: 'Dust II', result: 'W', score: '13 : 11', kda: '26 / 19 / 3', eloDelta: 26 },
  { id: '481730', date: '10 Oct, 19:52', map: 'Nuke', result: 'L', score: '8 : 13', kda: '14 / 18 / 5', eloDelta: -24 },
];

export const mapStats: MapStat[] = [
  { map: 'Mirage', played: 16, winRate: 63 },
  { map: 'Inferno', played: 12, winRate: 58 },
  { map: 'Ancient', played: 10, winRate: 60 },
  { map: 'Dust II', played: 7, winRate: 43 },
  { map: 'Nuke', played: 5, winRate: 40 },
];

export const initialParty: PartySlot[] = [
  { kind: 'player', player: currentPlayer, ready: true, leader: true },
  { kind: 'player', player: p('miko', 'FI', 'Finland', 1796, 8), ready: true },
  { kind: 'player', player: p('recoil', 'DE', 'Germany', 1905, 9), ready: true },
  { kind: 'pending' },
  { kind: 'empty' },
];

export const queueInfo = { online: 3248, inQueue: 186 };

export const gameModes = ['5v5 Ranked', '5v5 Unranked', '2v2 Wingman'];

const chat: ChatMessage[] = [
  { id: 1, time: '20:14', text: 'Server is ready. All players must connect within 5 minutes.' },
  { id: 2, time: '20:15', author: 'miko', text: 'gl hf everyone' },
];

export const match: MatchInfo = {
  id: '482193',
  title: 'Team vex vs Team s1lent',
  subtitle: 'Match #482193 · 5v5 Ranked · Europe · 13 Oct 2026, 20:14',
  status: 'WARMUP',
  joinBefore: '20:19',
  server: { location: 'Frankfurt, DE', ping: 24, ip: '185.225.74.32:27015' },
  teams: [
    {
      name: 'Team vex',
      avgElo: 1828,
      players: [
        { player: currentPlayer, kd: 1.24, winRate: 56, connected: true, captain: true, isYou: true },
        { player: p('miko', 'FI', 'Finland', 1796, 8), kd: 1.18, winRate: 54, connected: true },
        { player: p('recoil', 'DE', 'Germany', 1905, 9), kd: 1.31, winRate: 58, connected: true },
        { player: p('n0va', 'DK', 'Denmark', 1731, 8), kd: 1.09, winRate: 52, connected: true },
        { player: p('kaze', 'NL', 'Netherlands', 1866, 8), kd: 1.21, winRate: 55, connected: true },
      ],
    },
    {
      name: 'Team s1lent',
      avgElo: 1828,
      players: [
        { player: p('s1lent', 'PL', 'Poland', 1889, 8), kd: 1.26, winRate: 57, connected: true, captain: true },
        { player: p('flint', 'GB', 'United Kingdom', 1812, 8), kd: 1.16, winRate: 54, connected: true },
        { player: p('dusk', 'DE', 'Germany', 1754, 8), kd: 1.12, winRate: 53, connected: true },
        { player: p('frost', 'SE', 'Sweden', 1923, 9), kd: 1.29, winRate: 58, connected: true },
        { player: p('ryze', 'FI', 'Finland', 1762, 8), kd: 1.14, winRate: 52, connected: true },
      ],
    },
  ],
  map: { title: 'Inferno', file: 'de_inferno · Best of 1' },
  details: [
    { label: 'Format', value: 'MR12 · Overtime enabled' },
    { label: 'Server', value: 'Frankfurt, Germany' },
    { label: 'Team balance', value: '1,828 / 1,828 ELO' },
    { label: 'Rating at stake', value: '±25 ELO' },
    { label: 'Players connected', value: '10 / 10', accent: true },
  ],
  veto: [
    { map: 'Mirage', status: 'banned', by: 'vex' },
    { map: 'Nuke', status: 'banned', by: 's1lent' },
    { map: 'Dust II', status: 'banned', by: 'vex' },
    { map: 'Ancient', status: 'banned', by: 's1lent' },
    { map: 'Anubis', status: 'banned', by: 'vex' },
    { map: 'Train', status: 'banned', by: 's1lent' },
    { map: 'Inferno', status: 'selected' },
  ],
  chat,
};
