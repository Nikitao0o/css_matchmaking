/** Single source of truth for URLs – use these instead of string literals. */
export const paths = {
  root: '/',
  home: '/home',
  matchmaking: '/matchmaking',
  login: '/login',
  register: '/register',
  play: '/matchmaking',
  matches: '/matches',
  match: (id: string | number = ':id') => `/matches/${id}`,
  rankings: '/rankings',
  players: '/players',
  player: (name: string = ':name') => `/players/${name}`,
  settings: '/settings',
} as const;
