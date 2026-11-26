import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '@/router/paths';

export default function NotFoundPage() {
  return (
    <Box sx={{ py: 12, textAlign: 'center' }}>
      <Typography variant="h1" sx={{ mb: 1 }}>
        Страница не найдена
      </Typography>
      <Typography color="text.disabled" sx={{ mb: 3 }}>
        Запрошенная страница не существует.
      </Typography>
      <Button component={RouterLink} to={paths.matchmaking} variant="contained">
        Перейти в матчмейкинг
      </Button>
    </Box>
  );
}
