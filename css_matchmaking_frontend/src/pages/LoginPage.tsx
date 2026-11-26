import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import SportsEsports from '@mui/icons-material/SportsEsports';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { getSteamLoginUrl } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import AuthCard from '@/components/AuthCard';
import Field from '@/components/Field';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || paths.matchmaking;
  const [identifier, setIdentifier] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const val = identifier.trim();
    if (!val) {
      setAuthError('Введите никнейм игрока');
      return;
    }

    setSubmitting(true);
    try {
      await login(val);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Не удалось войти. Проверьте соединение с сервером.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
    <AuthCard
      tab="login"
      footer={
        <>
          Нет аккаунта?{' '}
          <Link component={RouterLink} to={paths.register} sx={{ fontWeight: 600 }}>
            Создать аккаунт
          </Link>
        </>
      }
      note="Соревновательная платформа Counter-Strike: Source"
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, fontWeight: 700 }}>
          Вход в аккаунт
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Войдите под своим никнеймом или через Steam для участия в матчах.
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            {authError}
          </Alert>
        )}

        <Field
          label="Никнейм или Email"
          value={identifier}
          onChange={setIdentifier}
          placeholder="Введите ваш никнейм"
          autoFocus
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={submitting}
          sx={{ mt: 1.5, minHeight: 46 }}
        >
          {submitting ? 'Вход…' : 'Войти'}
        </Button>

        {/* Steam Login */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            component="a"
            href={getSteamLoginUrl()}
            startIcon={<SportsEsports />}
            sx={{
              borderColor: '#171a21',
              bgcolor: '#171a21',
              color: '#fff',
              '&:hover': { bgcolor: '#2a475e', borderColor: '#2a475e' },
            }}
          >
            Войти через Steam
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
            ИЛИ БЫСТРЫЙ ДОСТУП
          </Typography>
        </Divider>

        {/* Single Test Account Button */}
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
          Войти как тестовый игрок
        </Button>
      </Box>
    </AuthCard>
  );
}
