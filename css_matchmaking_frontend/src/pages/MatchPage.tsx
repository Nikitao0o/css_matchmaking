import ContentCopy from '@mui/icons-material/ContentCopy';
import MapOutlined from '@mui/icons-material/MapOutlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Check from '@mui/icons-material/Check';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import KeyValueList from '../components/KeyValueList';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import PlayerAvatar from '../components/PlayerAvatar';
import StatusBadge from '../components/StatusBadge';
import { denseTableSx } from '../components/tableSx';
import { match } from '../data/mock';
import type { ChatMessage, MatchInfo } from '../types';
import { colors } from '../theme';

const fmt = new Intl.NumberFormat('en-US');
const nowHHMM = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function MatchPage() {
  // TODO: load by `useParams().id`; the mock only has one match.
  const m: MatchInfo = match;
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied`);
    } catch {
      setToast('Could not copy to clipboard');
    }
  };

  const connectCmd = `connect ${m.server.ip}`;

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Matches', `#${m.id}`]}
        title={m.title}
        subtitle={m.subtitle}
        action={<StatusBadge label={m.status} />}
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 296px' }, alignItems: 'start' }}>
        {/* Main column */}
        <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <Panel title="Server ready" caption={`Join before ${m.joinBefore}`}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
                    Server IP · {m.server.location} · {m.server.ping} ms
                  </Typography>
                  <Typography sx={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 22, fontWeight: 500, letterSpacing: '0.04em', mt: 1 }}>
                    {m.server.ip}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<ContentCopy fontSize="small" />} onClick={() => copy(m.server.ip, 'Server IP')}>
                    Copy IP
                  </Button>
                  <Button variant="contained" startIcon={<OpenInNew fontSize="small" />} href={`steam://connect/${m.server.ip}`}>
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
                Open CS2, then connect using the button or paste the command into your console.
              </Typography>
            </Box>
          </Panel>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            {m.teams.map((team) => {
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

          <MatchChat initial={m.chat} author={user?.player.name ?? 'you'} />
        </Box>

        {/* Side column */}
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Panel title="Match details">
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <MapOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{m.map.title}</Typography>
                <Typography variant="caption">{m.map.file}</Typography>
              </Box>
            </Box>
            <KeyValueList
              items={m.details.map((d) => ({
                label: d.label,
                value: d.accent ? <Box component="span" sx={{ color: 'primary.main' }}>{d.value}</Box> : d.value,
              }))}
            />
          </Panel>

          <Panel title="Map veto" caption="Completed">
            <Box>
              {m.veto.map((v) => {
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
                Connection issues? Check your anti-cheat and restart CS2 before contacting support.
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
