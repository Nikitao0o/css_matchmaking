import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { devCreateUser, fetchProfile } from '@/api';
import type { Player } from '@/types';
import { buildPlayerFromProfile } from '@/utils/elo';

export interface AuthUser {
  id: number;
  steam_id?: string;
  username: string;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  current_room_id: number | null;
  player: Player;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  quickLogin: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'mm.auth.user_id';

const AuthContext = createContext<AuthContextValue | null>(null);

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
      current_room_id: profile.current_room_id ?? null,
      player: buildPlayerFromProfile(profile),
    };
    localStorage.setItem(STORAGE_KEY, String(profile.id));
    setUser(nextUser);
    return nextUser;
  }, []);

  // При первом запуске проверяем параметры Steam-коллбэка или сохраненный ID пользователя
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackUserId = params.get('user_id');
    const callbackSteamId = params.get('steam_id') ?? undefined;

    if (callbackUserId && !isNaN(Number(callbackUserId))) {
      const userId = Number(callbackUserId);
      localStorage.setItem(STORAGE_KEY, String(userId));
      params.delete('user_id');
      params.delete('steam_id');
      const remainingQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);

      syncProfile(userId, callbackSteamId)
        .catch((err) => {
          console.warn('[STEAM AUTH] Не удалось загрузить профиль после входа через Steam:', err);
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId || isNaN(Number(savedId))) {
      setLoading(false);
      return;
    }

    const userId = Number(savedId);
    syncProfile(userId, callbackSteamId)
      .catch((err) => {
        console.warn('[AUTH INIT] Не удалось восстановить сессию с бэкенда:', err);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [syncProfile]);

  const quickLogin = useCallback<AuthContextValue['quickLogin']>(async (username) => {
    const res = await devCreateUser(username);
    await syncProfile(res.user_id, res.steam_id);
  }, [syncProfile]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    await syncProfile(user.id, user.steam_id);
  }, [user, syncProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, quickLogin, refreshUser, logout }),
    [user, loading, quickLogin, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
