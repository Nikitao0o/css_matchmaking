import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Player } from '../types';

export interface AuthUser {
  email: string;
  player: Player;
}

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  description: string;
  player: Player;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 's1mple',
    email: 's1mple@faceit.gg',
    password: 'password123',
    description: 'Level 10 · FPL Pro',
    player: {
      name: 's1mple',
      initials: 'S1',
      countryCode: 'UA',
      country: 'Ukraine',
      elo: 3150,
      level: 10,
    },
  },
  {
    id: 'vex',
    email: 'vex@faceit.gg',
    password: 'password123',
    description: 'Level 8 · Challenger',
    player: {
      name: 'vex',
      initials: 'VE',
      countryCode: 'SE',
      country: 'Sweden',
      elo: 1842,
      level: 8,
    },
  },
  {
    id: 'miko',
    email: 'miko@faceit.gg',
    password: 'password123',
    description: 'Level 5 · Competitive',
    player: {
      name: 'miko',
      initials: 'MI',
      countryCode: 'FI',
      country: 'Finland',
      elo: 1350,
      level: 5,
    },
  },
  {
    id: 'rookie',
    email: 'rookie@faceit.gg',
    password: 'password123',
    description: 'Level 1 · Beginner',
    player: {
      name: 'rookie',
      initials: 'RO',
      countryCode: 'DE',
      country: 'Germany',
      elo: 820,
      level: 1,
    },
  },
];

interface StoredAccount {
  email: string;
  password: string;
  player: Player;
}

interface AuthContextValue {
  user: AuthUser | null;
  demoAccounts: DemoAccount[];
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  quickLogin: (account: DemoAccount) => Promise<void>;
  register: (playerName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'mm.user';
const ACCOUNTS_STORAGE_KEY = 'mm.registered_accounts';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser | null, remember: boolean) {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (user) (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable – keep in memory only */
  }
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveStoredAccount(account: StoredAccount) {
  try {
    const accounts = getStoredAccounts();
    accounts.push(account);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    /* storage unavailable */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback<AuthContextValue['login']>(async (email, password, remember) => {
    // Artificial small delay for realistic UX
    await new Promise((r) => setTimeout(r, 250));

    const normalizedEmail = email.trim().toLowerCase();
    const demo = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === normalizedEmail);
    const registered = getStoredAccounts().find((a) => a.email.toLowerCase() === normalizedEmail);

    const account = demo ?? registered;

    if (!account) {
      throw new Error('Пользователь с таким email не найден. Проверьте адрес или создайте аккаунт.');
    }

    if (account.password !== password) {
      throw new Error('Неверный пароль. Пожалуйста, попробуйте еще раз.');
    }

    const next: AuthUser = { email: account.email, player: account.player };
    storeUser(next, remember);
    setUser(next);
  }, []);

  const quickLogin = useCallback<AuthContextValue['quickLogin']>(async (account) => {
    await new Promise((r) => setTimeout(r, 150));
    const next: AuthUser = { email: account.email, player: account.player };
    storeUser(next, true);
    setUser(next);
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (playerName, email, password) => {
    await new Promise((r) => setTimeout(r, 300));

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = playerName.trim();

    // Check if email already taken
    const emailExists =
      DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === normalizedEmail) ||
      getStoredAccounts().some((a) => a.email.toLowerCase() === normalizedEmail);

    if (emailExists) {
      throw new Error('Пользователь с таким email уже зарегистрирован.');
    }

    // Check if playerName already taken
    const nameExists =
      DEMO_ACCOUNTS.some((a) => a.player.name.toLowerCase() === trimmedName.toLowerCase()) ||
      getStoredAccounts().some((a) => a.player.name.toLowerCase() === trimmedName.toLowerCase());

    if (nameExists) {
      throw new Error(`Никнейм "${trimmedName}" уже занят. Пожалуйста, выберите другой.`);
    }

    const newPlayer: Player = {
      name: trimmedName,
      initials: trimmedName.slice(0, 2).toUpperCase(),
      countryCode: 'EU',
      country: 'Europe',
      elo: 1000,
      level: 3,
    };

    saveStoredAccount({ email: normalizedEmail, password, player: newPlayer });

    const next: AuthUser = { email: normalizedEmail, player: newPlayer };
    storeUser(next, true);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    storeUser(null, false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, demoAccounts: DEMO_ACCOUNTS, login, quickLogin, register, logout }),
    [user, login, quickLogin, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
