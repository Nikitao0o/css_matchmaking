import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Player } from '@/types';
import { devCreateUser, devLogin, fetchProfile, type UserProfileResponse } from '@/api';

export interface AuthUser {
  id: number;
  steam_id?: string;
  username: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  player: Player;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (usernameOrId: string | number) => Promise<void>;
  quickLogin: (username: string) => Promise<void>;
  register: (playerName: string, email?: string, password?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'mm.auth.user_id';

const AuthContext = createContext<AuthContextValue | null>(null);

function buildPlayer(profile: UserProfileResponse): Player {
  const elo = profile.elo ?? 1000;
  let level = 1;
  if (elo >= 2001) level = 10;
  else if (elo >= 1851) level = 9;
  else if (elo >= 1701) level = 8;
  else if (elo >= 1551) level = 7;
  else if (elo >= 1401) level = 6;
  else if (elo >= 1251) level = 5;
  else if (elo >= 1101) level = 4;
  else if (elo >= 951) level = 3;
  else if (elo >= 801) level = 2;

  const name = profile.username || `Player #${profile.id}`;
  return {
    name,
    initials: name.slice(0, 2).toUpperCase(),
    countryCode: 'RU',
    country: 'Russia',
    elo,
    level,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Обновление состояния игрока по свежим данным профиля с бэкенда
  const syncProfile = useCallback(async (userId: number, steamId?: string): Promise<AuthUser> => {
    const profile = await fetchProfile(userId);
    const nextUser: AuthUser = {
      id: profile.id,
      steam_id: steamId,
      username: profile.username,
      elo: profile.elo,
      matches_played: profile.matches_played,
      wins: profile.wins,
      losses: profile.losses,
      player: buildPlayer(profile),
    };
    localStorage.setItem(STORAGE_KEY, String(profile.id));
    setUser(nextUser);
    return nextUser;
  }, []);

  // При первом запуске проверяем, был ли сохранен ID пользователя и запрашиваем бэкенд
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId || isNaN(Number(savedId))) {
      setLoading(false);
      return;
    }

    const userId = Number(savedId);
    syncProfile(userId)
      .catch((err) => {
        console.warn('[AUTH INIT] Не удалось восстановить сессию с бэкенда:', err);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [syncProfile]);

  const login = useCallback<AuthContextValue['login']>(async (usernameOrId) => {
    let targetUserId: number;
    let steamId: string | undefined;

    const trimmed = String(usernameOrId).trim();
    if (!trimmed) {
      throw new Error('Введите имя игрока или ID');
    }

    // Если введен ID (число)
    if (!isNaN(Number(trimmed))) {
      const res = await devLogin(Number(trimmed));
      targetUserId = res.user_id;
      steamId = res.steam_id;
    } else {
      // Если введено имя пользователя
      const res = await devCreateUser(trimmed);
      targetUserId = res.user_id;
      steamId = res.steam_id;
    }

    await syncProfile(targetUserId, steamId);
  }, [syncProfile]);

  const quickLogin = useCallback<AuthContextValue['quickLogin']>(async (username) => {
    const res = await devCreateUser(username);
    await syncProfile(res.user_id, res.steam_id);
  }, [syncProfile]);

  const register = useCallback<AuthContextValue['register']>(async (playerName) => {
    const res = await devCreateUser(playerName);
    await syncProfile(res.user_id, res.steam_id);
  }, [syncProfile]);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    await syncProfile(user.id, user.steam_id);
  }, [user?.id, user?.steam_id, syncProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, quickLogin, register, refreshUser, logout }),
    [user, loading, login, quickLogin, register, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
