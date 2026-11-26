import Check from '@mui/icons-material/Check';
import ContentCopy from '@mui/icons-material/ContentCopy';
import MapOutlined from '@mui/icons-material/MapOutlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { endMatch, fetchConnectCommand, fetchRoom, joinRoom, leaveRoom, startMatch, type RoomResponse } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import KeyValueList from '@/components/KeyValueList';
import MatchChat from '@/components/MatchChat';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import PlayerAvatar from '@/components/PlayerAvatar';
import StatusBadge from '@/components/StatusBadge';
import { denseTableSx } from '@/components/tableSx';
import { paths } from '@/router/paths';
import { colors } from '@/theme';
import type { MatchPlayer } from '@/types';
import { fmt } from '@/utils/format';

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const roomId = id && !isNaN(Number(id)) ? Number(id) : null;
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [connectCmd, setConnectCmd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(Boolean(roomId));
  const [error, setError] = useState<string | null>(roomId ? null : 'Не указан корректный ID комнаты матча.');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [roomData, connectData] = await Promise.allSettled([
          fetchRoom(roomId),
          fetchConnectCommand(roomId),
        ]);

        if (!isMounted) return;

        if (roomData.status === 'fulfilled') {
          setRoom(roomData.value);
          setError(null);
        } else {
          setError(`Комната #${roomId} не найдена.`);
        }

        if (connectData.status === 'fulfilled' && connectData.value?.connect) {
          setConnectCmd(connectData.value.connect);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(`Ошибка связи с сервером: ${msg}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    // Опрос состояния комнаты каждые 3 секунды
    const interval = window.setInterval(loadData, 3000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [roomId]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} скопирован в буфер обмена`);
    } catch {
      setToast('Не удалось скопировать');
    }
  };

  const handleStartMatch = async () => {
    if (!roomId || !room) return;
    setActionLoading(true);
    try {
      await startMatch(roomId, room.map_name, room.game_mode, room.bot_quota);
      setToast('Матч запущен!');
      const updated = await fetchRoom(roomId);
      setRoom(updated);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : 'Ошибка запуска матча');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndMatch = async () => {
    if (!roomId) return;
    setActionLoading(true);
    try {
      await endMatch(roomId);
      await refreshUser();
      setToast('Матч завершен!');
      navigate(paths.matchmaking);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : 'Ошибка завершения матча');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId || !user) return;
    setActionLoading(true);
    try {
      await joinRoom(roomId, user.id);
      const [updated] = await Promise.all([fetchRoom(roomId), refreshUser()]);
      setRoom(updated);
      setToast('Вы присоединились к комнате');
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : 'Не удалось присоединиться к комнате');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !user) return;
    setActionLoading(true);
    try {
      await leaveRoom(roomId, user.id);
      await refreshUser();
      setToast('Вы покинули комнату');
      navigate(paths.matchmaking);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : 'Не удалось покинуть комнату');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
          Подключение к комнате матча #{roomId}…
        </Typography>
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Box sx={{ py: 6, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error ?? 'Матч не найден на сервере.'}
        </Alert>
        <Button variant="contained" component={RouterLink} to={paths.matchmaking}>
          Вернуться в лобби матчмейкинга
        </Button>
      </Box>
    );
  }

  const rawServerIp = connectCmd.replace(/^connect\s+/i, '').trim();
  const serverIp = rawServerIp || '127.0.0.1:27015';
  const currentStatus = room.status.toUpperCase();
  const mapTitle = room.map_name;
  const gameMode = room.game_mode;

  // Распределяем реальных игроков по командам
  const team1Players: MatchPlayer[] = room.players
    .slice(0, Math.ceil(room.players.length / 2))
    .map((p) => ({
      player: {
        name: p.username,
        initials: p.username.slice(0, 2).toUpperCase(),
        countryCode: 'RU',
        country: 'Russia',
        elo: 1000,
        level: 1,
      },
      kd: 1.0,
      winRate: 50,
      connected: true,
      isYou: p.id === user?.id,
    }));

  const team2Players: MatchPlayer[] = room.players
    .slice(Math.ceil(room.players.length / 2))
    .map((p) => ({
      player: {
        name: p.username,
        initials: p.username.slice(0, 2).toUpperCase(),
        countryCode: 'RU',
        country: 'Russia',
        elo: 1000,
        level: 1,
      },
      kd: 1.0,
      winRate: 50,
      connected: true,
      isYou: p.id === user?.id,
    }));

  const teams = [
    { name: 'Команда 1', avgElo: 1000, players: team1Players },
    { name: 'Команда 2', avgElo: 1000, players: team2Players },
  ];

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Matches', `#${room.id}`]}
        title={`Counter-Strike: Source · ${gameMode}`}
        subtitle={`Комната #${room.id} · Карта: ${mapTitle}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StatusBadge label={currentStatus} />
          </Box>
        }
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 296px' }, alignItems: 'start' }}>
        {/* Main column */}
        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <Panel title="Игровой сервер" caption="CS:S Dedicated Server">
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
                    Адрес игрового сервера CS:S
                  </Typography>
                  <Typography sx={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 22, fontWeight: 500, letterSpacing: '0.04em', mt: 1 }}>
                    {serverIp}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<ContentCopy fontSize="small" />} onClick={() => copy(serverIp, 'IP сервера')}>
                    Скопировать IP
                  </Button>
                  <Button variant="contained" startIcon={<OpenInNew fontSize="small" />} href={`steam://connect/${serverIp}`}>
                    Подключиться
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  px: 1.5,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: colors.page,
                  border: 1,
                  borderColor: 'divider',
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                  fontSize: 12,
                }}
              >
                {connectCmd || `connect ${serverIp}`}
                <IconButton size="small" aria-label="Copy connect command" onClick={() => copy(connectCmd || `connect ${serverIp}`, 'Команда')} sx={{ color: 'text.secondary' }}>
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
                Откройте консоль Counter-Strike: Source (клавиша ~) и вставьте команду для подключения.
              </Typography>
            </Box>
          </Panel>

          {/* Teams and Players */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            {teams.map((team) => (
              <Panel key={team.name} title={team.name} caption={`${team.players.length} игрока`} sx={{ minWidth: 0 }}>
                <Table size="small" sx={{ ...denseTableSx, '& .MuiTableCell-root': { px: 1.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Игрок</TableCell>
                      <TableCell>Рейтинг</TableCell>
                      <TableCell align="center">Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {team.players.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ py: 2, textAlign: 'center', color: 'text.disabled' }}>
                          Ожидание подключения игрока…
                        </TableCell>
                      </TableRow>
                    ) : (
                      team.players.map((p) => {
                        const isYou = p.isYou || p.player.name === user?.username;
                        return (
                          <TableRow key={p.player.name} sx={{ bgcolor: isYou ? colors.selected : undefined }}>
                            <TableCell>
                              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                                <PlayerAvatar initials={p.player.initials} size={28} />
                                <Box>
                                  <Link component={RouterLink} to={paths.player(p.player.name)} color="inherit" underline="hover" sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, display: 'block' }}>
                                    {p.player.name}
                                    {isYou && ' (вы)'}
                                  </Link>
                                  <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }}>
                                    Игрок комнаты
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>{fmt.format(p.player.elo)} ELO</TableCell>
                            <TableCell align="center">
                              <Check sx={{ fontSize: 16, color: 'success.main' }} titleAccess="Готов" />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Panel>
            ))}
          </Box>

          <MatchChat author={user?.username ?? 'Игрок'} />
        </Box>

        {/* Side column */}
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Panel title="Параметры комнаты">
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <MapOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{mapTitle}</Typography>
                <Typography variant="caption">{mapTitle}.bsp</Typography>
              </Box>
            </Box>
            <KeyValueList
              items={[
                { label: 'Игра', value: 'Counter-Strike: Source' },
                { label: 'Режим', value: gameMode },
                { label: 'Статус', value: <Box component="span" sx={{ color: 'primary.main' }}>{currentStatus}</Box> },
                { label: 'Карта', value: mapTitle },
                { label: 'Игроков в комнате', value: `${room.players.length} из ${gameMode === '1v1' ? 2 : 10}` },
                { label: 'Боты (bot_quota)', value: String(room.bot_quota) },
              ]}
            />
          </Panel>

          {/* Room Controls */}
          <Panel title="Управление матчем">
            <Box sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                {user && !room.players.some((p) => p.id === user.id) && room.status === 'waiting' && (
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={actionLoading}
                    onClick={handleJoinRoom}
                    fullWidth
                  >
                    Присоединиться к комнате
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  disabled={actionLoading}
                  onClick={handleStartMatch}
                  fullWidth
                >
                  Начать матч
                </Button>
                {user && room.players.some((p) => p.id === user.id) && (
                  <Button
                    variant="outlined"
                    disabled={actionLoading}
                    onClick={handleLeaveRoom}
                    fullWidth
                  >
                    Покинуть комнату
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  disabled={actionLoading}
                  onClick={handleEndMatch}
                  fullWidth
                >
                  Завершить матч
                </Button>
              </Stack>
            </Box>
          </Panel>
        </Box>
      </Box>

      <Snackbar open={toast !== null} autoHideDuration={3000} onClose={() => setToast(null)} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </>
  );
}
