/** Single source of truth for URLs – use these instead of string literals. */
export const paths = {
  root: '/',
  home: '/home',
  matchmaking: '/matchmaking',
  login: '/login',
  register: '/register',
  matches: '/matches',
  match: (id: string | number = ':id') => `/matches/${id}`,
  rankings: '/rankings',
  players: '/players',
  player: (name: string = ':name') => `/players/${name}`,
  settings: '/settings',
  rules: '/rules',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
} as const;
