import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { fetchMatchHistory, type MatchHistoryItem } from '@/api';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import { denseTableSx } from '@/components/tableSx';
import { paths } from '@/router/paths';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchMatchHistory().then((data) => {
      if (active) setMatches(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader crumbs={['Stack', 'Matches']} title="История матчей" subtitle="Counter-Strike: Source Matchmaking" />
      <Panel title="Список завершенных матчей">
        {matches.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 16, mb: 2 }}>
              История матчей пуста.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
              Сыгранные матчи сохраняются автоматически после завершения игры.
            </Typography>
            <Button variant="contained" component={RouterLink} to={paths.matchmaking}>
              Начать поиск матча
            </Button>
          </Box>
        ) : (
          <Table size="small" sx={denseTableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Матч</TableCell>
                <TableCell>Режим</TableCell>
                <TableCell>Карта</TableCell>
                <TableCell>Счёт</TableCell>
                <TableCell>Результат</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>#{m.id}</TableCell>
                  <TableCell>{m.game_mode}</TableCell>
                  <TableCell>{m.map_name}</TableCell>
                  <TableCell>{m.score ?? '—'}</TableCell>
                  <TableCell>{m.result ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
