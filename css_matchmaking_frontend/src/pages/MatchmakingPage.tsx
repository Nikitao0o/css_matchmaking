import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import MapOutlined from '@mui/icons-material/MapOutlined';
import PersonAddAlt from '@mui/icons-material/PersonAddAltOutlined';
import Search from '@mui/icons-material/Search';
import Verified from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Field from '../components/Field';
import PlayerAvatar from '../components/PlayerAvatar';
import { currentPlayer } from '../data/mock';
import { paths } from '../router/paths';
import { colors } from '../theme';
import type { Player } from '../types';

const fmt = new Intl.NumberFormat('en-US');
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const LEVEL_RANGES: Record<number, { min: number; max: number }> = {
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

function getLevelProgress(elo: number, level: number) {
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

interface MapItem {
  id: string;
  name: string;
  code: string;
  tag: string;
  badge: string;
  accent: string;
}

const MAP_POOL: MapItem[] = [
  { id: 'mirage', name: 'Mirage', code: 'de_mirage', tag: 'Город', badge: 'MRG', accent: '#E67E22' },
  { id: 'dust2', name: 'Dust II', code: 'de_dust2', tag: 'Пустыня', badge: 'D2', accent: '#F39C12' },
  { id: 'inferno', name: 'Inferno', code: 'de_inferno', tag: 'Деревня', badge: 'INF', accent: '#E74C3C' },
  { id: 'nuke', name: 'Nuke', code: 'de_nuke', tag: 'АЭС', badge: 'NUK', accent: '#3498DB' },
  { id: 'train', name: 'Train', code: 'de_train', tag: 'Депо', badge: 'TRN', accent: '#95A5A6' },
  { id: 'cache', name: 'Cache', code: 'de_cache', tag: 'ЧАЭС', badge: 'CCH', accent: '#2ECC71' },
  { id: 'tuscan', name: 'Tuscan', code: 'de_tuscan', tag: 'Побережье', badge: 'TSC', accent: '#16A085' },
  { id: 'cbble', name: 'Cobblestone', code: 'de_cbble', tag: 'Замок', badge: 'CBL', accent: '#9B59B6' },
];

type MatchFormat = '5х5' | '2х2' | '1х1';

interface TeammateSlot {
  player?: Player;
  ready?: boolean;
}

const DEMO_TEAMMATES: Player[] = [
  { name: 'miko', initials: 'MI', countryCode: 'FI', country: 'Finland', elo: 1796, level: 8 },
  { name: 'recoil', initials: 'RE', countryCode: 'DE', country: 'Germany', elo: 1905, level: 9 },
  { name: 'n0va', initials: 'NO', countryCode: 'DK', country: 'Denmark', elo: 1731, level: 8 },
  { name: 'kaze', initials: 'KA', countryCode: 'NL', country: 'Netherlands', elo: 1866, level: 8 },
  { name: 'blaze', initials: 'BL', countryCode: 'SE', country: 'Sweden', elo: 2150, level: 10 },
  { name: 'frosty', initials: 'FR', countryCode: 'NO', country: 'Norway', elo: 1640, level: 7 },
];

export default function MatchmakingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const me = user?.player ?? currentPlayer;

  const [format, setFormat] = useState<MatchFormat>('5х5');

  // Slots around user (index 0, 1 on left, index 3, 4 on right)
  const [teammateSlots, setTeammateSlots] = useState<{ [index: number]: TeammateSlot }>({
    0: { player: DEMO_TEAMMATES[0], ready: true },
    1: { player: DEMO_TEAMMATES[1], ready: true },
    3: { player: DEMO_TEAMMATES[2], ready: true },
    4: {},
  });

  const [selectedMaps, setSelectedMaps] = useState<string[]>(MAP_POOL.map((m) => m.id));
  const [searching, setSearching] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [inviteSlot, setInviteSlot] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!searching) return;
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [searching]);

  const levelProgress = useMemo(() => getLevelProgress(me.elo, me.level), [me.elo, me.level]);

  // Active slots for the current match format
  const activeSlotIndexes = useMemo(() => {
    if (format === '1х1') return [];
    if (format === '2х2') return [3];
    return [0, 1, 3, 4];
  }, [format]);

  // Names of all players currently present in lobby (current user + active teammates in slots)
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

  const isCustomAlreadyInLobby = useMemo(() => {
    const trimmed = customName.trim().toLowerCase();
    if (!trimmed) return false;
    return lobbyPlayerNames.has(trimmed);
  }, [customName, lobbyPlayerNames]);

  const handleSearchToggle = () => {
    if (!user) {
      navigate(paths.login);
      return;
    }
    if (selectedMaps.length === 0) {
      setToast('Выберите хотя бы одну карту для поиска матча!');
      return;
    }
    setSearching((s) => {
      if (!s) setElapsed(0);
      return !s;
    });
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

  const addTeammate = (slotIndex: number, player: Player) => {
    const normalizedName = player.name.trim().toLowerCase();
    if (lobbyPlayerNames.has(normalizedName)) {
      setToast(`Игрок ${player.name} уже находится в лобби!`);
      return;
    }
    setTeammateSlots((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const k = Number(key);
        if (next[k]?.player?.name.trim().toLowerCase() === normalizedName) {
          next[k] = {};
        }
      });
      next[slotIndex] = { player, ready: true };
      return next;
    });
    setInviteSlot(null);
    setCustomName('');
    setToast(`Игрок ${player.name} добавлен в пати`);
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
            return (
              <Button
                key={fmtOption}
                onClick={() => setFormat(fmtOption)}
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
        {/* Large level badge */}
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

        {/* ELO Progress info */}
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
            {/* Card 0: Left slot 1 */}
            <TeammateCard
              slotIndex={0}
              slot={teammateSlots[0]}
              onInvite={() => setInviteSlot(0)}
              onRemove={() => removeTeammate(0)}
            />

            {/* Card 1: Left slot 2 */}
            <TeammateCard
              slotIndex={1}
              slot={teammateSlots[1]}
              onInvite={() => setInviteSlot(1)}
              onRemove={() => removeTeammate(1)}
            />

            {/* Card 2: CENTER (ALWAYS USER) */}
            {userCard}

            {/* Card 3: Right slot 1 */}
            <TeammateCard
              slotIndex={3}
              slot={teammateSlots[3]}
              onInvite={() => setInviteSlot(3)}
              onRemove={() => removeTeammate(3)}
            />

            {/* Card 4: Right slot 2 */}
            <TeammateCard
              slotIndex={4}
              slot={teammateSlots[4]}
              onInvite={() => setInviteSlot(4)}
              onRemove={() => removeTeammate(4)}
            />
          </Box>
        )}
      </Box>

      {/* 4. Matchmaking Search Button */}
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Search sx={{ fontSize: 26 }} />}
          onClick={handleSearchToggle}
          sx={{
            minWidth: { xs: '100%', sm: 340 },
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
          {searching ? `ПОИСК МАТЧА… ${mmss(elapsed)} · ОТМЕНА` : 'НАЙТИ МАТЧ'}
        </Button>

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
                {/* Active checkmark badge */}
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

                {/* Map Badge Icon */}
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
        onClose={() => {
          setInviteSlot(null);
          setCustomName('');
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18 }}>Пригласить игрока в пати</DialogTitle>
        <DialogContent
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customName.trim() && !isCustomAlreadyInLobby && inviteSlot !== null) {
              e.preventDefault();
              const trimmed = customName.trim();
              const customPlayer: Player = {
                name: trimmed,
                initials: trimmed.slice(0, 2).toUpperCase(),
                countryCode: 'EU',
                country: 'Europe',
                elo: 1600,
                level: 7,
              };
              addTeammate(inviteSlot, customPlayer);
            }
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Выберите тестового игрока или введите никнейм:
          </Typography>

          <Stack spacing={1} sx={{ mb: 2.5 }}>
            {DEMO_TEAMMATES.map((teammate) => {
              const inLobby = lobbyPlayerNames.has(teammate.name.trim().toLowerCase());
              return (
                <Box
                  key={teammate.name}
                  onClick={() => {
                    if (!inLobby && inviteSlot !== null) {
                      addTeammate(inviteSlot, teammate);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.25,
                    borderRadius: 1,
                    border: 1,
                    borderColor: inLobby ? '#27272A' : colors.border,
                    bgcolor: inLobby ? 'rgba(255, 255, 255, 0.02)' : colors.surfaceRaised,
                    cursor: inLobby ? 'not-allowed' : 'pointer',
                    opacity: inLobby ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': inLobby
                      ? undefined
                      : {
                          borderColor: colors.primary,
                          bgcolor: 'rgba(255, 85, 0, 0.08)',
                        },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <PlayerAvatar initials={teammate.initials} size={30} />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: inLobby ? colors.textSecondary : '#FFFFFF' }}>
                        {teammate.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                        {teammate.elo} ELO · {teammate.country}
                      </Typography>
                    </Box>
                  </Box>
                  {inLobby ? (
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.35,
                        borderRadius: '4px',
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: colors.textSecondary,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      В лобби
                    </Box>
                  ) : (
                    <Button size="small" variant="contained" sx={{ minHeight: 26, py: 0.25, fontSize: 11 }}>
                      Позвать
                    </Button>
                  )}
                </Box>
              );
            })}
          </Stack>

          <Field
            label="Или введите имя игрока"
            value={customName}
            onChange={setCustomName}
            placeholder="Никнейм игрока"
            error={isCustomAlreadyInLobby ? 'Этот игрок уже находится в лобби' : undefined}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setInviteSlot(null);
              setCustomName('');
            }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            disabled={!customName.trim() || isCustomAlreadyInLobby}
            onClick={() => {
              if (inviteSlot !== null && customName.trim() && !isCustomAlreadyInLobby) {
                const trimmed = customName.trim();
                const customPlayer: Player = {
                  name: trimmed,
                  initials: trimmed.slice(0, 2).toUpperCase(),
                  countryCode: 'EU',
                  country: 'Europe',
                  elo: 1600,
                  level: 7,
                };
                addTeammate(inviteSlot, customPlayer);
              }
            }}
          >
            Пригласить
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

interface TeammateCardProps {
  slotIndex: number;
  slot: TeammateSlot;
  onInvite: () => void;
  onRemove: () => void;
  label?: string;
}

function TeammateCard({ slotIndex: _idx, slot, onInvite, onRemove, label }: TeammateCardProps) {
  if (slot.player) {
    const { player, ready } = slot;
    return (
      <Box
        sx={{
          position: 'relative',
          bgcolor: colors.panel,
          border: 1,
          borderColor: colors.border,
          borderRadius: 2,
          p: 2.5,
          minHeight: 270,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: '#3F3F46',
          },
        }}
      >
        {label && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 12,
              px: 1,
              py: 0.2,
              borderRadius: '4px',
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              fontSize: 10,
              fontWeight: 800,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </Box>
        )}
        <Tooltip title="Исключить из пати" arrow>
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: colors.textSecondary,
              '&:hover': { color: colors.danger },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1.5 }}>
          <PlayerAvatar
            initials={player.initials}
            size={64}
            sx={{
              border: `2px solid ${player.level === 10 ? '#EF4444' : colors.primary}`,
              borderRadius: '50%',
              fontSize: 20,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 0.7,
              py: 0.1,
              bgcolor: player.level === 10 ? '#EF4444' : colors.primary,
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 900,
              borderRadius: '999px',
              border: '2px solid #18181B',
              lineHeight: 1.1,
            }}
          >
            LVL {player.level}
          </Box>
        </Box>

        <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', mb: 0.5, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </Typography>
        <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1.5, fontSize: 11 }}>
          {player.countryCode} · {player.country}
        </Typography>

        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            px: 1.25,
            py: 0.3,
            borderRadius: '4px',
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>
            {fmt.format(player.elo)} ELO
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: ready ? colors.success : colors.muted, fontSize: 12, fontWeight: 600 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ready ? colors.success : colors.muted }} />
          <span>{ready ? 'Готов' : 'Не готов'}</span>
        </Stack>
      </Box>
    );
  }

  // Empty slot
  return (
    <Box
      onClick={onInvite}
      sx={{
        bgcolor: '#131317',
        border: '1.5px dashed #2A2A33',
        borderRadius: 2,
        p: 2.5,
        minHeight: 270,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: colors.primary,
          bgcolor: 'rgba(255, 85, 0, 0.04)',
          transform: 'translateY(-2px)',
          '& .plus-circle': {
            bgcolor: colors.primary,
            color: '#FFFFFF',
            transform: 'scale(1.08)',
          },
        },
      }}
    >
      <Box
        className="plus-circle"
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: '#1C1C22',
          border: '1px solid #32323D',
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          transition: 'all 0.15s ease',
        }}
      >
        <PersonAddAlt sx={{ fontSize: 24 }} />
      </Box>

      <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, mb: 0.5 }}>
        {label ? 'Слот напарника' : 'Свободный слот'}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.muted, fontSize: 11 }}>
        Нажмите, чтобы позвать
      </Typography>
    </Box>
  );
}
