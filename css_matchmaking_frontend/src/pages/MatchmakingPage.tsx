import Check from '@mui/icons-material/Check';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import MapOutlined from '@mui/icons-material/MapOutlined';
import Search from '@mui/icons-material/Search';
import Verified from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createRoom,
  fetchProfile,
  fetchProfileByName,
  getQueueStatus,
  joinQueue,
  leaveQueue,
  type UserProfileResponse,
} from '@/api';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import Field from '@/components/Field';
import PlayerAvatar from '@/components/PlayerAvatar';
import TeammateCard, { type TeammateSlot } from '@/components/TeammateCard';
import { MAP_POOL } from '@/constants/maps';
import { paths } from '@/router/paths';
import { colors } from '@/theme';
import type { Player } from '@/types';
import { buildPlayerFromProfile, getLevelProgress } from '@/utils/elo';
import { fmt, mmss } from '@/utils/format';

type MatchFormat = '5х5' | '2х2' | '1х1';

const GAME_MODE_TO_FORMAT: Record<string, MatchFormat> = {
  '5v5': '5х5',
  '2v2': '2х2',
  wingman: '2х2',
  '1v1': '1х1',
};

const FORMAT_TO_GAME_MODE: Record<MatchFormat, string> = {
  '5х5': '5v5',
  '2х2': '2v2',
  '1х1': '1v1',
};

const ALL_GAME_MODES = ['1v1', '2v2', '5v5'] as const;

export default function MatchmakingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const me: Player = user?.player ?? {
    name: 'Гость (не авторизован)',
    initials: '??',
    countryCode: 'RU',
    country: 'Россия',
    elo: 1000,
    level: 1,
  };

  const [format, setFormat] = useState<MatchFormat>('1х1');

  const [teammateSlots, setTeammateSlots] = useState<{ [index: number]: TeammateSlot }>({
    0: {},
    1: {},
    3: {},
    4: {},
  });

  const [selectedMaps, setSelectedMaps] = useState<string[]>(MAP_POOL.map((m) => m.id));
  const [searching, setSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [activeGameMode, setActiveGameMode] = useState<string | null>(null);
  const [queueRequestPending, setQueueRequestPending] = useState(false);
  const [inviteSlot, setInviteSlot] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const queueRequestInFlight = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const restoreQueueState = async () => {
      try {
        const [profile, ...statuses] = await Promise.all([
          fetchProfile(user.id),
          ...ALL_GAME_MODES.map((mode) => getQueueStatus(mode)),
        ]);
        if (!active) return;

        if ((profile.current_room_id ?? null) !== user.current_room_id) {
          void refreshUser();
        }

        for (const status of statuses) {
          const entry = status.players.find((p) => p.user_id === user.id);
          if (entry) {
            const matchedFormat = GAME_MODE_TO_FORMAT[status.game_mode];
            if (matchedFormat) setFormat(matchedFormat);
            setActiveGameMode(status.game_mode);
            setQueueSize(status.count);
            setElapsed(entry.waiting_s ?? 0);
            setSearching(true);
            return;
          }
        }
      } catch (err: unknown) {
        console.warn('[MATCHMAKING INIT] Не удалось восстановить состояние очереди:', err);
      }
    };

    void restoreQueueState();

    return () => {
      active = false;
    };
  }, [user?.id, user?.current_room_id, refreshUser]);

  useEffect(() => {
    if (!searching) return;
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [searching]);

  useEffect(() => {
    if (!searching || !activeGameMode || !user?.id) return;

    let active = true;
    let requestInFlight = false;
    let hasShownStatusError = false;
    const updateQueueStatus = async () => {
      if (!active || requestInFlight) return;
      requestInFlight = true;

      try {
        const [status, profile] = await Promise.all([
          getQueueStatus(activeGameMode),
          fetchProfile(user.id),
        ]);
        if (!active) return;

        if (profile.current_room_id) {
          setSearching(false);
          setActiveGameMode(null);
          await refreshUser();
          navigate(paths.match(profile.current_room_id));
          return;
        }

        setQueueSize(status.count);
        hasShownStatusError = false;
      } catch (err: unknown) {
        if (active && !hasShownStatusError) {
          setToast(
            err instanceof Error
              ? err.message
              : 'Ошибка получения состояния очереди',
          );
          hasShownStatusError = true;
        }
      } finally {
        requestInFlight = false;
      }
    };

    void updateQueueStatus();
    const intervalId = window.setInterval(() => {
      void updateQueueStatus();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [searching, activeGameMode, user?.id, refreshUser, navigate]);

  const levelProgress = useMemo(() => getLevelProgress(me.elo, me.level), [me.elo, me.level]);

  const activeSlotIndexes = useMemo(() => {
    if (format === '1х1') return [];
    if (format === '2х2') return [3];
    return [0, 1, 3, 4];
  }, [format]);

  const lobbyPlayerNames = useMemo(() => {
    const names = new Set<string>();
    if (me.name) names.add(me.name.trim().toLowerCase());
    activeSlotIndexes.forEach((slotIdx) => {
      const slot = teammateSlots[slotIdx];
      if (slot?.player?.name) {
        names.add(slot.player.name.trim().toLowerCase());
      }
    });
    return names;
  }, [me.name, teammateSlots, activeSlotIndexes]);

  const lobbyPlayerIds = useMemo(() => {
    const ids = new Set<number>();
    if (user?.id) ids.add(user.id);
    activeSlotIndexes.forEach((slotIdx) => {
      const slot = teammateSlots[slotIdx];
      if (slot?.userId) ids.add(slot.userId);
    });
    return ids;
  }, [user, teammateSlots, activeSlotIndexes]);

  const isCustomAlreadyInLobby = useMemo(() => {
    const trimmed = customName.trim().toLowerCase();
    if (!trimmed) return false;
    if (lobbyPlayerNames.has(trimmed)) return true;
    if (/^\d+$/.test(trimmed) && lobbyPlayerIds.has(Number(trimmed))) return true;
    return false;
  }, [customName, lobbyPlayerNames, lobbyPlayerIds]);

  const handleCreateRoom = async () => {
    if (!user) {
      navigate(paths.login);
      return;
    }
    const mapCode = MAP_POOL.find((m) => m.id === selectedMaps[0])?.code ?? 'de_dust2';
    const mode = FORMAT_TO_GAME_MODE[format];
    try {
      setToast('Создание комнаты…');
      const res = await createRoom(user.id, mode, mapCode);
      await refreshUser();
      navigate(paths.match(res.room_id));
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400 && err.message.toLowerCase().includes('already in a room')) {
        await refreshUser();
        setToast('Вы уже находитесь в активной комнате');
        return;
      }
      setToast(err instanceof Error ? err.message : 'Ошибка создания комнаты');
    }
  };

  const syncExistingQueueEntry = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const statuses = await Promise.all(ALL_GAME_MODES.map((mode) => getQueueStatus(mode)));
    for (const status of statuses) {
      const entry = status.players.find((p) => p.user_id === user.id);
      if (entry) {
        const matchedFormat = GAME_MODE_TO_FORMAT[status.game_mode];
        if (matchedFormat) setFormat(matchedFormat);
        setActiveGameMode(status.game_mode);
        setQueueSize(status.count);
        setElapsed(entry.waiting_s ?? 0);
        setSearching(true);
        return true;
      }
    }
    return false;
  };

  const handleSearchToggle = async () => {
    if (queueRequestInFlight.current) {
      return;
    }
    queueRequestInFlight.current = true;
    setQueueRequestPending(true);

    try {
      if (!user) {
        navigate(paths.login);
        return;
      }

      if (searching) {
        try {
          const response = await leaveQueue(user.id);
          if (!response.left) {
            throw new Error('Не удалось выйти из очереди');
          }
        } catch (err: unknown) {
          // Если на бэкенде записи в очереди уже нет (например, матч уже сформирован), сбрасываем локальное состояние
          if (!(err instanceof ApiError && err.status === 404)) {
            throw err;
          }
        }

        setSearching(false);
        setActiveGameMode(null);
        setQueueSize(0);
        setElapsed(0);
        await refreshUser();
        setToast('Вы вышли из очереди');
        return;
      }

      if (selectedMaps.length === 0) {
        setToast('Выберите хотя бы одну карту для поиска матча!');
        return;
      }

      // Проверяем актуальное состояние пользователя перед входом в очередь
      const freshProfile = await fetchProfile(user.id);
      if (freshProfile.current_room_id != null) {
        await refreshUser();
        setToast(`Вы уже находитесь в активной комнате #${freshProfile.current_room_id}`);
        return;
      }

      const gameMode = FORMAT_TO_GAME_MODE[format];

      const preferredMaps = MAP_POOL
        .filter((map) => selectedMaps.includes(map.id))
        .map((map) => map.code)
        .join(',');

      setToast('Подключение к очереди...');

      const response = await joinQueue({
        user_id: user.id,
        game_mode: gameMode,
        map_group: 'default',
        preferred_maps: preferredMaps,
        latency_ms: null,
      });

      if (!response.queued) {
        throw new Error('Не удалось подключиться к очереди');
      }

      setQueueSize(response.queue_size);
      setActiveGameMode(gameMode);
      setElapsed(0);
      setSearching(true);

      setToast(`Вы добавлены в очередь. Игроков: ${response.queue_size}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const msg = err.message.toLowerCase();
        if (msg.includes('already in queue')) {
          const restored = await syncExistingQueueEntry();
          if (restored) {
            setToast('Вы уже находитесь в очереди — поиск восстановлен');
            return;
          }
        }
        if (msg.includes('already in a room')) {
          await refreshUser();
          setToast('Вы уже находитесь в активной комнате');
          return;
        }
      }

      setToast(
        err instanceof Error
          ? err.message
          : searching
            ? 'Ошибка выхода из очереди'
            : 'Ошибка подключения к очереди',
      );
    } finally {
      queueRequestInFlight.current = false;
      setQueueRequestPending(false);
    }
  };

  const toggleMap = (mapId: string) => {
    setSelectedMaps((prev) => {
      if (prev.includes(mapId)) {
        if (prev.length <= 1) {
          setToast('Должна быть выбрана как минимум 1 карта!');
          return prev;
        }
        return prev.filter((id) => id !== mapId);
      }
      return [...prev, mapId];
    });
  };

  const selectAllMaps = () => setSelectedMaps(MAP_POOL.map((m) => m.id));
  const resetMaps = () => setSelectedMaps([MAP_POOL[0].id]);

  const closeInviteDialog = () => {
    setInviteSlot(null);
    setCustomName('');
    setInviteError(null);
    setInviteLoading(false);
  };

  const addTeammate = (slotIndex: number, player: Player, userId: number) => {
    const normalizedName = player.name.trim().toLowerCase();
    if (lobbyPlayerIds.has(userId) || lobbyPlayerNames.has(normalizedName)) {
      setInviteError(`Игрок ${player.name} уже находится в лобби`);
      return;
    }
    setTeammateSlots((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const k = Number(key);
        if (
          next[k]?.userId === userId ||
          next[k]?.player?.name.trim().toLowerCase() === normalizedName
        ) {
          next[k] = {};
        }
      });
      next[slotIndex] = { userId, player, ready: true };
      return next;
    });
    closeInviteDialog();
    setToast(`Игрок ${player.name} добавлен в пати`);
  };

  const handleInviteSubmit = async () => {
    const trimmed = customName.trim();
    if (inviteSlot === null || !trimmed || isCustomAlreadyInLobby || inviteLoading) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      let profile: UserProfileResponse | null = null;

      if (/^\d+$/.test(trimmed)) {
        profile = await fetchProfile(Number(trimmed));
      } else {
        profile = await fetchProfileByName(trimmed);
      }

      if (!profile) {
        setInviteError('Аккаунт игрока не найден');
        return;
      }

      if (profile.current_room_id != null) {
        setInviteError('Этот игрок сейчас находится в другом матче');
        return;
      }

      const realPlayer = buildPlayerFromProfile(profile);
      addTeammate(inviteSlot, realPlayer, profile.id);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setInviteError('Аккаунт игрока не найден');
      } else {
        setInviteError(err instanceof Error ? err.message : 'Не удалось проверить аккаунт игрока');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const removeTeammate = (slotIndex: number) => {
    setTeammateSlots((prev) => ({
      ...prev,
      [slotIndex]: {},
    }));
  };

  const userCard = (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#19191E',
        border: `2px solid ${colors.primary}`,
        borderRadius: 2,
        p: 2.5,
        minHeight: 270,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(255, 85, 0, 0.22), 0 0 1px #FF5500',
        transform: format === '5х5' ? { md: 'scale(1.02)' } : undefined,
        zIndex: 2,
      }}
    >
      {/* Captain / Solo Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          bgcolor: '#141416',
          border: `2px solid ${colors.primary}`,
          borderRadius: '999px',
          px: 1.5,
          py: 0.3,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          boxShadow: '0 0 12px rgba(255, 85, 0, 0.4)',
        }}
      >
        <EmojiEvents sx={{ fontSize: 15, color: '#F59E0B' }} />
        <Typography sx={{ fontSize: 10, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.06em' }}>
          {format === '1х1' ? 'ВЫ' : 'КАПИТАН (ВЫ)'}
        </Typography>
      </Box>

      {/* Avatar with level badge */}
      <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1.5, mb: 1.5 }}>
        <PlayerAvatar
          initials={me.initials}
          size={70}
          sx={{
            border: `2.5px solid ${me.level === 10 ? '#EF4444' : colors.primary}`,
            borderRadius: '50%',
            fontSize: 22,
            boxShadow: me.level === 10 ? '0 0 16px rgba(239, 68, 68, 0.5)' : '0 0 14px rgba(255, 85, 0, 0.4)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 0.8,
            py: 0.15,
            bgcolor: me.level === 10 ? '#EF4444' : colors.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 900,
            borderRadius: '999px',
            border: '2px solid #19191E',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.6)',
            lineHeight: 1.1,
          }}
        >
          LVL {me.level}
        </Box>
      </Box>

      {/* Nickname & Country */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {me.name}
        </Typography>
        <Verified sx={{ fontSize: 15, color: colors.primary }} />
      </Box>

      <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1.5, fontSize: 11 }}>
        {me.countryCode} · {me.country}
      </Typography>

      {/* ELO badge */}
      <Box
        sx={{
          bgcolor: 'rgba(255, 85, 0, 0.14)',
          border: '1px solid rgba(255, 85, 0, 0.35)',
          px: 1.5,
          py: 0.4,
          borderRadius: '4px',
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF' }}>
          {fmt.format(me.elo)} <span style={{ color: colors.primary }}>ELO</span>
        </Typography>
      </Box>

      {/* Status */}
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: colors.success, fontSize: 12, fontWeight: 700 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: colors.success, boxShadow: '0 0 8px #22C55E' }} />
        <span>Готов к матчу</span>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1140, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5, pb: 4 }}>
      {/* 1. Format Selector (5x5, 2x2, 1x1) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tooltip
          title={searching ? 'Нельзя сменить режим во время поиска матча' : ''}
          disableHoverListener={!searching}
          arrow
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: colors.panel,
              p: 0.5,
              borderRadius: '6px',
              border: 1,
              borderColor: colors.border,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            {(['5х5', '2х2', '1х1'] as MatchFormat[]).map((fmtOption) => {
              const active = format === fmtOption;
              const formatLocked = searching || queueRequestPending;
              return (
                <Button
                  key={fmtOption}
                  disabled={formatLocked}
                  onClick={() => {
                    if (!formatLocked) setFormat(fmtOption);
                  }}
                  sx={{
                    px: 3.5,
                    py: 1,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: '4px',
                    bgcolor: active ? colors.primary : 'transparent',
                    color: active ? '#FFFFFF' : colors.textSecondary,
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: active ? '0 2px 10px rgba(255, 85, 0, 0.4)' : 'none',
                    '&:hover': {
                      bgcolor: active ? colors.primaryHover : 'rgba(255, 85, 0, 0.08)',
                      color: '#FFFFFF',
                    },
                    '&.Mui-disabled': {
                      bgcolor: active ? colors.primary : 'transparent',
                      color: active ? '#FFFFFF' : colors.muted,
                      opacity: active ? 0.85 : 0.45,
                      cursor: 'not-allowed',
                    },
                  }}
                >
                  {fmtOption}
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: active ? 0.9 : 0.6,
                    }}
                  >
                    {fmtOption === '5х5' ? 'Соревновательный' : fmtOption === '2х2' ? 'Напарники' : 'Дуэль'}
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Tooltip>
      </Box>

      {/* 2. Level and ELO Progress Banner */}
      <Box
        sx={{
          bgcolor: colors.panel,
          border: 1,
          borderColor: colors.border,
          borderRadius: 2,
          p: { xs: 2, sm: 2.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 2, md: 3.5 },
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        <Box
          sx={{
            width: { xs: 60, sm: 72 },
            height: { xs: 60, sm: 72 },
            borderRadius: '50%',
            bgcolor: '#141417',
            border: `3px solid ${me.level === 10 ? '#EF4444' : colors.primary}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: me.level === 10 ? '0 0 16px rgba(239, 68, 68, 0.5)' : '0 0 14px rgba(255, 85, 0, 0.4)',
          }}
        >
          <Typography sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
            {me.level}
          </Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>
            LVL
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
              <Typography sx={{ fontSize: { xs: 26, sm: 30 }, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {fmt.format(me.elo)}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ELO
              </Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 1, display: { xs: 'none', sm: 'inline' } }}>
                Сезон 1 · Counter-Strike:Source
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: levelProgress.isMax ? '#EF4444' : colors.primary }}>
              {levelProgress.isMax
                ? 'Максимальный уровень'
                : `+${levelProgress.toNext} ELO до уровня ${me.level + 1}`}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={levelProgress.percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: me.level === 10 ? '#EF4444' : colors.primary,
                boxShadow: me.level === 10 ? '0 0 10px #EF4444' : '0 0 10px #FF5500',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
            <Typography variant="caption" sx={{ color: colors.muted, fontSize: 11, fontWeight: 600 }}>
              {levelProgress.min} ELO
            </Typography>
            <Typography variant="caption" sx={{ color: colors.muted, fontSize: 11, fontWeight: 600 }}>
              {levelProgress.isMax ? '3000+ ELO' : `${levelProgress.max} ELO`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 3. Party Cards */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textSecondary }}>
            {format === '1х1' ? 'Игрок' : format === '2х2' ? 'Состав команды (2х2)' : 'Лобби команды (5х5)'}
          </Typography>
        </Box>

        {format === '1х1' && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 224 }}>
              {userCard}
            </Box>
          </Box>
        )}

        {format === '2х2' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Box sx={{ width: '100%', maxWidth: 224 }}>
              {userCard}
            </Box>
            <Box sx={{ width: '100%', maxWidth: 224 }}>
              <TeammateCard
                slotIndex={3}
                slot={teammateSlots[3]}
                onInvite={() => setInviteSlot(3)}
                onRemove={() => removeTeammate(3)}
                label="Напарник"
              />
            </Box>
          </Box>
        )}

        {format === '5х5' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            <TeammateCard
              slotIndex={0}
              slot={teammateSlots[0]}
              onInvite={() => setInviteSlot(0)}
              onRemove={() => removeTeammate(0)}
            />
            <TeammateCard
              slotIndex={1}
              slot={teammateSlots[1]}
              onInvite={() => setInviteSlot(1)}
              onRemove={() => removeTeammate(1)}
            />
            {userCard}
            <TeammateCard
              slotIndex={3}
              slot={teammateSlots[3]}
              onInvite={() => setInviteSlot(3)}
              onRemove={() => removeTeammate(3)}
            />
            <TeammateCard
              slotIndex={4}
              slot={teammateSlots[4]}
              onInvite={() => setInviteSlot(4)}
              onRemove={() => removeTeammate(4)}
            />
          </Box>
        )}
      </Box>

      {/* 4. Matchmaking Search & Create Room Buttons */}
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Search sx={{ fontSize: 26 }} />}
            onClick={handleSearchToggle}
            disabled={queueRequestPending}
            sx={{
              minWidth: { xs: '100%', sm: 300 },
              minHeight: 54,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              bgcolor: searching ? '#EF4444' : colors.primary,
              borderRadius: '6px',
              boxShadow: searching ? '0 6px 24px rgba(239, 68, 68, 0.5)' : '0 6px 24px rgba(255, 85, 0, 0.45)',
              '&:hover': {
                bgcolor: searching ? '#DC2626' : colors.primaryHover,
                boxShadow: searching ? '0 8px 28px rgba(239, 68, 68, 0.6)' : '0 8px 28px rgba(255, 85, 0, 0.55)',
              },
            }}
          >
            {queueRequestPending
              ? searching
                ? 'ВЫХОД ИЗ ОЧЕРЕДИ…'
                : 'ПОДКЛЮЧЕНИЕ К ОЧЕРЕДИ…'
              : searching
                ? `Игроков в очереди: ${queueSize} · ${mmss(elapsed)} · ОТМЕНА`
                : 'НАЙТИ МАТЧ'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleCreateRoom}
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              minHeight: 54,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderRadius: '6px',
            }}
          >
            Создать комнату
          </Button>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: colors.textSecondary, fontSize: 12 }}>
          Формат: <span style={{ color: '#fff', fontWeight: 700 }}>{format}</span> · Карт в подборе:{' '}
          <span style={{ color: '#fff', fontWeight: 700 }}>{selectedMaps.length} из {MAP_POOL.length}</span>
        </Typography>
      </Box>

      {/* 5. Map Selection Pool as Horizontal Cards */}
      <Box sx={{ bgcolor: colors.panel, border: 1, borderColor: colors.border, borderRadius: 2, p: 3, boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <MapOutlined sx={{ color: colors.primary, fontSize: 22 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Выбор карт для подбора
            </Typography>
            <Box
              sx={{
                ml: 1,
                px: 1,
                py: 0.2,
                bgcolor: 'rgba(255, 85, 0, 0.15)',
                color: colors.primary,
                fontSize: 11,
                fontWeight: 800,
                borderRadius: '4px',
              }}
            >
              {selectedMaps.length} / {MAP_POOL.length}
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={selectAllMaps} sx={{ fontSize: 11, py: 0.3, px: 1.25 }}>
              Выбрать все
            </Button>
            <Button size="small" variant="outlined" onClick={resetMaps} sx={{ fontSize: 11, py: 0.3, px: 1.25 }}>
              Сбросить
            </Button>
          </Stack>
        </Box>

        {/* Horizontal Map Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(8, 1fr)' },
            gap: 1.5,
          }}
        >
          {MAP_POOL.map((map) => {
            const isSelected = selectedMaps.includes(map.id);
            return (
              <Box
                key={map.id}
                onClick={() => toggleMap(map.id)}
                sx={{
                  position: 'relative',
                  p: 1.5,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: isSelected ? 'rgba(255, 85, 0, 0.08)' : '#121215',
                  border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  boxShadow: isSelected ? '0 4px 14px rgba(255, 85, 0, 0.25)' : 'none',
                  opacity: isSelected ? 1 : 0.5,
                  '&:hover': {
                    borderColor: colors.primary,
                    opacity: 1,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: colors.primary,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(255, 85, 0, 0.6)',
                    }}
                  >
                    <Check sx={{ fontSize: 12, fontWeight: 900 }} />
                  </Box>
                )}

                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '8px',
                    bgcolor: map.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 14,
                    color: '#FFFFFF',
                    mb: 1.25,
                    boxShadow: isSelected ? `0 0 12px ${map.accent}66` : 'none',
                  }}
                >
                  {map.badge}
                </Box>

                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {map.name}
                </Typography>
                <Typography sx={{ fontSize: 10, color: colors.textSecondary, mt: 0.25 }}>
                  {map.code}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Invite teammate modal */}
      <Dialog
        open={inviteSlot !== null}
        onClose={closeInviteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18 }}>Пригласить игрока в пати</DialogTitle>
        <DialogContent
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleInviteSubmit();
            }
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Введите ID или никнейм зарегистрированного игрока:
          </Typography>

          <Field
            label="ID или никнейм игрока"
            value={customName}
            onChange={(val) => {
              setCustomName(val);
              if (inviteError) setInviteError(null);
            }}
            placeholder="Например: 2 или Player_2"
            error={
              isCustomAlreadyInLobby
                ? 'Этот игрок уже находится в лобби'
                : inviteError ?? undefined
            }
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={closeInviteDialog} disabled={inviteLoading}>
            Отмена
          </Button>
          <Button
            variant="contained"
            disabled={!customName.trim() || isCustomAlreadyInLobby || inviteLoading}
            onClick={() => void handleInviteSubmit()}
          >
            {inviteLoading ? 'Проверка…' : 'Пригласить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
