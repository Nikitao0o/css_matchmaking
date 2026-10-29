import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { paths } from '../router/paths';

/** Shown when a route throws or a lazy chunk fails to load. */
export default function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
      <Box>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Something went wrong
        </Typography>
        <Typography color="text.disabled" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button component={RouterLink} to={paths.home} variant="contained">
          На главную
        </Button>
      </Box>
    </Box>
  );
}
