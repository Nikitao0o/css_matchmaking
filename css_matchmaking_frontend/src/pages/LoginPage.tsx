import SportsEsports from '@mui/icons-material/SportsEsports';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSteamLoginUrl } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import AuthCard from '@/components/AuthCard';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

export default function LoginPage() {
  const { quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || paths.matchmaking;
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleQuickLogin = async (username: string) => {
    setAuthError(null);
    setSubmitting(true);
    try {
      await quickLogin(username);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Не удалось войти в аккаунт.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard note="Соревновательная платформа Counter-Strike: Source">
      <Typography variant="h2" component="h1" sx={{ mb: 0.75, fontWeight: 700 }}>
        Вход в аккаунт
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Вход на платформу осуществляется через Steam.
      </Typography>

      {authError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          {authError}
        </Alert>
      )}

      {/* Steam Login */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        component="a"
        href={getSteamLoginUrl()}
        startIcon={<SportsEsports />}
        sx={{
          minHeight: 48,
          bgcolor: '#171a21',
          color: '#fff',
          '&:hover': { bgcolor: '#2a475e', boxShadow: 'none' },
        }}
      >
        Войти через Steam
      </Button>

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
          ИЛИ БЫСТРЫЙ ДОСТУП
        </Typography>
      </Divider>

      {/* Test Account Button */}
      <Button
        variant="outlined"
        size="medium"
        fullWidth
        disabled={submitting}
        onClick={() => handleQuickLogin('Player_1')}
        sx={{
          minHeight: 42,
          fontSize: 13,
          fontWeight: 600,
          borderColor: colors.border,
          color: 'text.secondary',
          '&:hover': {
            borderColor: colors.primary,
            color: 'text.primary',
            bgcolor: 'rgba(255, 85, 0, 0.05)',
          },
        }}
      >
        {submitting ? 'Вход…' : 'Войти как тестовый игрок'}
      </Button>
    </AuthCard>
  );
}
