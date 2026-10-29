import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import { denseTableSx } from '../components/tableSx';
import { matchHistory } from '../data/mock';
import { colors } from '../theme';

export default function MatchesPage() {
  return (
    <>
      <PageHeader crumbs={['Stack', 'Matches']} title="Matches" subtitle="Counter-Strike 2 · Season 04" />
      <Panel title="Recent matches">
        <Table size="small" sx={denseTableSx}>
          <TableHead>
            <TableRow>
              {['Match', 'Date', 'Map', 'Result', 'Score', 'ELO'].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matchHistory.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>
                  <Link component={RouterLink} to={`/matches/${m.id}`}>
                    #{m.id}
                  </Link>
                </TableCell>
                <TableCell>{m.date}</TableCell>
                <TableCell>{m.map}</TableCell>
                <TableCell sx={{ color: m.result === 'W' ? 'success.main' : colors.danger, fontWeight: 600 }}>{m.result}</TableCell>
                <TableCell>{m.score}</TableCell>
                <TableCell sx={{ color: m.eloDelta > 0 ? 'success.main' : colors.danger }}>
                  {m.eloDelta > 0 ? '+' : '−'}
                  {Math.abs(m.eloDelta)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
