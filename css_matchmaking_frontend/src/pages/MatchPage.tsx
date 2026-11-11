import ContentCopy from '@mui/icons-material/ContentCopy';
import MapOutlined from '@mui/icons-material/MapOutlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Check from '@mui/icons-material/Check';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { fetchConnectCommand, fetchRoom, type RoomResponse } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import KeyValueList from '@/components/KeyValueList';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import PlayerAvatar from '@/components/PlayerAvatar';
import StatusBadge from '@/components/StatusBadge';
import { denseTableSx } from '@/components/tableSx';
import { match } from '@/data/mock';
import type { ChatMessage, MatchPlayer } from '@/types';
import { colors } from '@/theme';

const fmt = new Intl.NumberFormat('en-US');
const nowHHMM = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const roomId = id && !isNaN(Number(id)) ? Number(id) : null;
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [connectCmd, setConnectCmd] = useState<string>(`connect ${match.server.ip}`);
  const [loading, setLoading] = useState(Boolean(roomId));

  // Загрузка реальных данных комнаты с бэкенда
  useEffect(() => {
    if (!roomId) return;

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
        }
        if (connectData.status === 'fulfilled' && connectData.value.connect) {
          setConnectCmd(connectData.value.connect);
        }
      } catch (err) {
        console.error('Ошибка загрузки комнаты матча:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    // Опрашиваем состояние комнаты каждые 4 секунды, пока матч не завершится
    const interval = window.setInterval(loadData, 4000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [roomId]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied`);
    } catch {
      setToast('Could not copy to clipboard');
    }
  };

  const rawServerIp = connectCmd.replace(/^connect\s+/i, '').trim();
  const serverIp = rawServerIp || match.server.ip;

  // Динамические данные команды из бэкенда или fallback на мок
  const currentStatus = room ? room.status.toUpperCase() : match.status;
  const mapTitle = room ? room.map_name : match.map.title;
  const gameMode = room ? room.game_mode : '1v1';

  // Формируем команды на основе игроков из комнаты бэкенда
  const teams = room
    ? [
        {
          name: 'Team 1',
          avgElo: 1000,
          players: room.players.slice(0, Math.ceil(room.players.length / 2)).map(
            (p): MatchPlayer => ({
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
            }),
          ),
        },
        {
          name: 'Team 2',
          avgElo: 1000,
          players: room.players.slice(Math.ceil(room.players.length / 2)).map(
            (p): MatchPlayer => ({
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
            }),
          ),
        },
      ]
    : match.teams;

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Matches', `#${roomId ?? match.id}`]}
        title={`Counter-Strike: Source · ${gameMode}`}
        subtitle={room ? `Room #${room.id} · ${mapTitle}` : match.subtitle}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {loading && <CircularProgress size={16} sx={{ color: colors.primary }} />}
            <StatusBadge label={currentStatus} />
          </Box>
        }
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 296px' }, alignItems: 'start' }}>
        {/* Main column */}
        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <Panel title="Server ready" caption={`Join before ${match.joinBefore}`}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
                    Server IP · {match.server.location} · {match.server.ping} ms
                  </Typography>
                  <Typography sx={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 22, fontWeight: 500, letterSpacing: '0.04em', mt: 1 }}>
                    {serverIp}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<ContentCopy fontSize="small" />} onClick={() => copy(serverIp, 'Server IP')}>
                    Copy IP
                  </Button>
                  <Button variant="contained" startIcon={<OpenInNew fontSize="small" />} href={`steam://connect/${serverIp}`}>
                    Connect to server
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  px: 1.5,
                  height: 36,
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
                {connectCmd}
                <IconButton size="small" aria-label="Copy connect command" onClick={() => copy(connectCmd, 'Command')} sx={{ color: 'text.secondary' }}>
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5 }}>
                Open Counter-Strike: Source, then connect using the button or paste the command into your console.
              </Typography>
            </Box>
          </Panel>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            {teams.map((team) => {
              const connected = team.players.filter((p) => p.connected).length;
              return (
                <Panel key={team.name} title={team.name} caption={`Ø ${fmt.format(team.avgElo)} ELO`} sx={{ minWidth: 0 }}>
                  <Table size="small" sx={{ ...denseTableSx, '& .MuiTableCell-root': { px: 1.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>ELO</TableCell>
                        <TableCell>K/D</TableCell>
                        <TableCell>Win %</TableCell>
                        <TableCell align="center">
                          <GppGoodOutlined sx={{ fontSize: 14, verticalAlign: 'middle' }} titleAccess="Anti-cheat verified" />
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {team.players.map((p) => {
                        const isYou = p.isYou || p.player.name === user?.player.name;
                        return (
                          <TableRow key={p.player.name} sx={{ bgcolor: isYou ? colors.selected : undefined }}>
                            <TableCell>
                              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                                <PlayerAvatar initials={p.player.initials} size={28} />
                                <Box>
                                  <Link component={RouterLink} to={`/players/${p.player.name}`} color="inherit" underline="hover" sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, display: 'block' }}>
                                    {p.player.name}
                                    {isYou && ' (you)'}
                                  </Link>
                                  <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }}>
                                    {p.player.countryCode} · Level {p.player.level}
                                    {p.captain && ' · Captain'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>{fmt.format(p.player.elo)}</TableCell>
                            <TableCell>{p.kd.toFixed(2)}</TableCell>
                            <TableCell>{p.winRate}%</TableCell>
                            <TableCell align="center">
                              {p.connected && <Check sx={{ fontSize: 16, color: 'success.main' }} titleAccess="Connected" />}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <Typography variant="caption" sx={{ display: 'block', px: 1.75, py: 1.25, borderTop: 1, borderColor: 'divider' }}>
                    {connected} / {team.players.length} players connected · Anti-cheat verified
                  </Typography>
                </Panel>
              );
            })}
          </Box>

          <MatchChat initial={match.chat} author={user?.player.name ?? 'you'} />
        </Box>

        {/* Side column */}
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Panel title="Match details">
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <MapOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{mapTitle}</Typography>
                <Typography variant="caption">{room ? `${room.map_name}.bsp` : match.map.file}</Typography>
              </Box>
            </Box>
            <KeyValueList
              items={[
                { label: 'Game', value: 'Counter-Strike: Source' },
                { label: 'Mode', value: gameMode },
                { label: 'Status', value: <Box component="span" sx={{ color: 'primary.main' }}>{currentStatus}</Box> },
                { label: 'Map', value: mapTitle },
                { label: 'Bot quota', value: String(room?.bot_quota ?? 0) },
              ]}
            />
          </Panel>

          <Panel title="Map veto" caption="Completed">
            <Box>
              {match.veto.map((v) => {
                const selected = v.status === 'selected';
                return (
                  <Box
                    key={v.map}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      px: 2,
                      height: 34,
                      alignItems: 'center',
                      fontSize: 13,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-of-type': { borderBottom: 0 },
                      bgcolor: selected ? colors.selected : undefined,
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    <span>{v.map}</span>
                    <Box component="span" sx={{ fontSize: 12, fontWeight: 400, color: selected ? 'primary.main' : 'text.disabled' }}>
                      {selected ? 'Selected' : `Banned · ${v.by}`}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Panel>

          <Panel title="Need help?">
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                Connection issues? Check your console in CS:S before contacting support.
              </Typography>
              <Button component={RouterLink} to="/support" variant="outlined" fullWidth>
                Contact support
              </Button>
              <Link component={RouterLink} to="/report" sx={{ display: 'inline-block', mt: 1.5, fontSize: 12 }}>
                Report a player →
              </Link>
            </Box>
          </Panel>
        </Box>
      </Box>

      <Snackbar open={toast !== null} autoHideDuration={2000} onClose={() => setToast(null)} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </>
  );
}

function MatchChat({ initial, author }: { initial: ChatMessage[]; author: string }) {
  const [scope, setScope] = useState<'team' | 'all'>('team');
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: prev.length + 1, time: nowHHMM(), author, text: value }]);
    setText('');
  };

  const tab = (key: 'team' | 'all', label: string) => (
    <Box
      component="button"
      type="button"
      onClick={() => setScope(key)}
      sx={{ all: 'unset', cursor: 'pointer', color: scope === key ? 'text.primary' : 'text.disabled', fontSize: 12 }}
    >
      {label}
    </Box>
  );

  return (
    <Panel
      title="Match chat"
      caption={
        <Stack direction="row" spacing={1}>
          {tab('team', 'Team chat')}
          <span>/</span>
          {tab('all', 'All chat')}
        </Stack>
      }
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ minHeight: 64, maxHeight: 220, overflowY: 'auto', mb: 2, display: 'grid', rowGap: 1, alignContent: 'start' }} aria-live="polite">
          {messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', gap: 1.5, fontSize: 13 }}>
              <Box sx={{ color: 'text.disabled', width: 36, flexShrink: 0 }}>{msg.time}</Box>
              {msg.author && <Box sx={{ color: 'primary.main', fontWeight: 600 }}>{msg.author}</Box>}
              <Box sx={{ color: msg.author ? 'text.primary' : 'text.secondary' }}>{msg.text}</Box>
            </Box>
          ))}
          <div ref={endRef} />
        </Box>
        <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 1 }}>
          <OutlinedInput
            fullWidth
            size="small"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={scope === 'team' ? 'Message your team…' : 'Message everyone…'}
            inputProps={{ 'aria-label': 'Chat message' }}
          />
          <Button type="submit" variant="outlined" sx={{ minWidth: 72 }}>
            Send
          </Button>
        </Box>
      </Box>
    </Panel>
  );
}
