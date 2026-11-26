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

export interface MatchPlayer {
  player: Player;
  kd: number;
  winRate: number;
  connected: boolean;
  captain?: boolean;
  isYou?: boolean;
}

export interface ChatMessage {
  id: number;
  time: string;
  author?: string;
  text: string;
}
