import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { fetchLeaderboard, type LeaderboardEntry } from '@/api';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import PlayerAvatar from '@/components/PlayerAvatar';
import { denseTableSx } from '@/components/tableSx';
import { paths } from '@/router/paths';
import { colors } from '@/theme';
import { calculateLevel } from '@/utils/elo';
import { fmt } from '@/utils/format';

export default function RankingsPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchLeaderboard()
      .then((data) => {
        if (active) setPlayers(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Рейтинг']}
        title="Таблица лидеров"
        subtitle="Рейтинг игроков Counter-Strike: Source по ELO"
      />

      <Panel title="Лидеры по ELO">
        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        ) : players.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 15 }}>
              Таблица лидеров пока пуста.
            </Typography>
          </Box>
        ) : (
          <Table size="small" sx={denseTableSx}>
            <TableHead>
              <TableRow>
                <TableCell width={56}>#</TableCell>
                <TableCell>Игрок</TableCell>
                <TableCell>Уровень</TableCell>
                <TableCell align="right">ELO</TableCell>
                <TableCell align="right">Матчи</TableCell>
                <TableCell align="right">Винрейт</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player, index) => {
                const level = calculateLevel(player.elo);
                const winRate =
                  player.matches_played > 0
                    ? Math.round((player.wins / player.matches_played) * 100)
                    : 0;
                return (
                  <TableRow key={player.id}>
                    <TableCell sx={{ fontWeight: 700, color: index < 3 ? colors.primary : 'text.secondary' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                        <PlayerAvatar initials={player.username.slice(0, 2).toUpperCase()} size={28} />
                        <Link
                          component={RouterLink}
                          to={paths.player(encodeURIComponent(player.username))}
                          color="inherit"
                          underline="hover"
                          sx={{ fontWeight: 600 }}
                        >
                          {player.username}
                        </Link>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 0.9,
                          py: 0.25,
                          bgcolor: level === 10 ? '#EF4444' : colors.primary,
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 800,
                          borderRadius: '2px',
                        }}
                      >
                        LVL {level}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {fmt.format(player.elo)}
                    </TableCell>
                    <TableCell align="right">{player.matches_played}</TableCell>
                    <TableCell align="right">{winRate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
