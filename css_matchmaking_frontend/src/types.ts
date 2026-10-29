export interface Player {
  name: string;
  initials: string;
  countryCode: string;
  country: string;
  elo: number;
  level: number;
}

export type PartySlot =
  | { kind: 'player'; player: Player; ready: boolean; leader?: boolean }
  | { kind: 'pending' }
  | { kind: 'empty' };

export interface MatchHistoryRow {
  id: string;
  date: string;
  map: string;
  result: 'W' | 'L';
  score: string;
  kda: string;
  eloDelta: number;
}

export interface MapStat {
  map: string;
  played: number;
  winRate: number;
}

export interface MatchPlayer {
  player: Player;
  kd: number;
  winRate: number;
  connected: boolean;
  captain?: boolean;
  isYou?: boolean;
}

export interface VetoStep {
  map: string;
  status: 'banned' | 'selected';
  by?: string;
}

export interface ChatMessage {
  id: number;
  time: string;
  author?: string;
  text: string;
}

export interface MatchInfo {
  id: string;
  title: string;
  subtitle: string;
  status: 'WARMUP' | 'LIVE' | 'FINISHED';
  joinBefore: string;
  server: { location: string; ping: number; ip: string };
  teams: { name: string; avgElo: number; players: MatchPlayer[] }[];
  map: { title: string; file: string };
  details: { label: string; value: string; accent?: boolean }[];
  veto: VetoStep[];
  chat: ChatMessage[];
}
