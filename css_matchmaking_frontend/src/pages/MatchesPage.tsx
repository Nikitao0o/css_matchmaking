import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import { paths } from '@/router/paths';

export default function MatchesPage() {
  return (
    <>
      <PageHeader crumbs={['Stack', 'Matches']} title="История матчей" subtitle="Counter-Strike: Source Matchmaking" />
      <Panel title="Список завершенных матчей">
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
      </Panel>
    </>
  );
}
