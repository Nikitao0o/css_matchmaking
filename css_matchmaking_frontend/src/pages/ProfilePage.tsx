import OpenInNew from '@mui/icons-material/OpenInNew';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import KeyValueList from '../components/KeyValueList';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import PlayerAvatar from '../components/PlayerAvatar';
import RatingChart from '../components/RatingChart';
import StatusBadge from '../components/StatusBadge';
import { denseTableSx } from '../components/tableSx';
import { currentPlayer, initialParty, mapStats, matchHistory, playerSummary, ratingHistory } from '../data/mock';
import { colors } from '../theme';

const fmt = new Intl.NumberFormat('en-US');
const TABS = ['Overview', 'Matches', 'Statistics', 'Teammates'] as const;

export default function ProfilePage() {
  const { user } = useAuth();
  const { name = user?.player.name ?? currentPlayer.name } = useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');

  // Load player info from active user or fallback mock
  const player = user && user.player.name.toLowerCase() === name.toLowerCase()
    ? user.player
    : { ...currentPlayer, name, initials: name.slice(0, 2).toUpperCase() };
  const s = playerSummary;
  const partyMates = initialParty.flatMap((slot) => (slot.kind === 'player' && !slot.leader ? [slot.player.name] : []));

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Players', name]}
        title="Player profile"
        subtitle="Counter-Strike 2 · Season 04"
        action={
          <Button variant="outlined" size="small" startIcon={<SettingsOutlined fontSize="small" />} component={RouterLink} to="/settings">
            Edit profile
          </Button>
        }
      />

      {/* Hero */}
      <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <PlayerAvatar initials={player.initials} size={64} sx={{ fontSize: 26 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>{player.name}</Typography>
              {s.online && <StatusBadge label="ONLINE" />}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {s.realName} · {player.country} · Member since {s.memberSince}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, color: 'text.secondary', fontSize: 12 }}>
              <VerifiedUserOutlined sx={{ fontSize: 14, color: 'success.main' }} />
              Steam verified · Anti-cheat enabled
            </Box>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{fmt.format(player.elo)} ELO</Typography>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                bgcolor: player.level === 10 ? '#EF4444' : colors.primary,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: '2px',
                lineHeight: 1.2,
                boxShadow: player.level === 10 ? '0 0 12px rgba(239,68,68,0.45)' : '0 0 10px rgba(255,85,0,0.3)',
              }}
            >
              LVL {player.level}
            </Box>
          </Box>
          <Typography variant="caption">
            Level {player.level} · #{fmt.format(s.rank)} in {s.region}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t) => (
          <Tab key={t} value={t} label={t} disableRipple sx={{ minWidth: 0, mr: 2, px: 0, fontSize: 13 }} />
        ))}
      </Tabs>

      {tab !== 'Overview' ? (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>{tab} will appear here.</Box>
      ) : (
        <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 296px' }, alignItems: 'start' }}>
          {/* Main column */}
          <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              {[
                { value: String(s.matches), label: 'Matches played' },
                { value: `${s.winRate}%`, label: 'Win rate' },
                { value: s.avgKd.toFixed(2), label: 'Average K/D' },
                { value: s.avgKills.toFixed(1), label: 'Average kills' },
              ].map((c, i) => (
                <Box key={c.label} sx={{ p: 2, borderLeft: i === 0 ? 0 : 1, borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 500 }}>{c.value}</Typography>
                  <Typography variant="caption">{c.label}</Typography>
                </Box>
              ))}
            </Box>

            <Panel title="Rating history" caption="Last 30 days">
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 1 }}>
                  <Box sx={{ color: 'text.disabled' }}>ELO rating</Box>
                  <Box sx={{ color: 'success.main', fontWeight: 600 }}>+{s.eloThisMonth} ELO this month</Box>
                </Box>
                <RatingChart values={ratingHistory.values} labels={ratingHistory.labels} />
              </Box>
            </Panel>

            <Panel
              title="Match history"
              caption={
                <Link component={RouterLink} to="/matches" color="inherit" underline="hover">
                  View all matches →
                </Link>
              }
            >
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={denseTableSx}>
                  <TableHead>
                    <TableRow>
                      {['Date', 'Map', 'Result', 'Score', 'K / D / A', 'ELO'].map((h) => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchHistory.map((m) => {
                      const win = m.result === 'W';
                      return (
                        <TableRow key={m.id} hover>
                          <TableCell>
                            <Link component={RouterLink} to={`/matches/${m.id}`} color="inherit" underline="hover">
                              {m.date}
                            </Link>
                          </TableCell>
                          <TableCell>{m.map}</TableCell>
                          <TableCell sx={{ color: win ? 'success.main' : colors.danger, fontWeight: 600 }}>{m.result}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{m.score}</TableCell>
                          <TableCell>{m.kda}</TableCell>
                          <TableCell sx={{ color: win ? 'success.main' : colors.danger }}>
                            {m.eloDelta > 0 ? '+' : '−'}
                            {Math.abs(m.eloDelta)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Panel>
          </Box>

          {/* Side column */}
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Panel title="Player details">
              <KeyValueList
                items={[
                  { label: 'Country', value: player.country },
                  { label: 'Joined', value: s.joined },
                  { label: 'Last played', value: s.lastPlayed },
                  { label: 'Preferred region', value: s.region },
                  {
                    label: 'Steam account',
                    value: (
                      <Link href={s.steamUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {s.steamName} <OpenInNew sx={{ fontSize: 12 }} />
                      </Link>
                    ),
                  },
                  { label: 'Account status', value: s.status },
                ]}
              />
            </Panel>

            <Panel title="Map statistics" caption="Last 50 matches">
              <Table size="small" sx={denseTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Map</TableCell>
                    <TableCell align="right">Played / Win rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mapStats.map((m) => (
                    <TableRow key={m.map}>
                      <TableCell sx={{ fontWeight: 600 }}>{m.map}</TableCell>
                      <TableCell align="right">
                        <Box component="span" sx={{ color: 'text.disabled', mr: 3 }}>
                          {m.played}
                        </Box>
                        {m.winRate}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>

            <Panel title="Current party" caption={`${1 + partyMates.length} / 5`}>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                  Playing with {partyMates.join(' and ')}
                </Typography>
                <Button component={RouterLink} to="/play" variant="outlined" fullWidth>
                  Go to matchmaking
                </Button>
              </Box>
            </Panel>
          </Box>
        </Box>
      )}
    </>
  );
}
