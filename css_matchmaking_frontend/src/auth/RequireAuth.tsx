import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
