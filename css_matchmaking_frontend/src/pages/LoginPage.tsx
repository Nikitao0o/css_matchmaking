import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SportsEsports from '@mui/icons-material/SportsEsports';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/api/config';
import { useAuth } from '@/auth/AuthContext';
import AuthCard from '@/components/AuthCard';
import Field from '@/components/Field';
import PlayerAvatar from '@/components/PlayerAvatar';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

const TEST_ACCOUNTS = [
  { name: 'DevPlayer', label: 'Тестовый игрок (ID 1)', level: 1, elo: 1000 },
  { name: 'Player_1', label: 'Игрок 1 для матчинга', level: 3, elo: 1000 },
  { name: 'Player_2', label: 'Игрок 2 для матчинга', level: 3, elo: 1000 },
  { name: 's1mple', label: 'Про-игрок', level: 10, elo: 1000 },
];

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const val = identifier.trim();
    if (!val) {
      setAuthError('Введите никнейм игрока или числовой User ID');
      return;
    }

    setSubmitting(true);
    try {
      await login(val);
      navigate(paths.matchmaking, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Не удалось войти. Убедитесь, что бэкенд запущен.');
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
      navigate(paths.matchmaking, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Ошибка входа через бэкенд.');
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
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
            Создать аккаунт
          </Link>
        </>
      }
      note={
        <>
          Сервер API: <code>{API_BASE_URL}</code>
        </>
      }
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, fontWeight: 700 }}>
          Вход в аккаунт
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Войдите под никнеймом или через Steam для подключения к матчмейкингу.
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            {authError}
          </Alert>
        )}

        <Field
          label="Никнейм или User ID"
          value={identifier}
          onChange={setIdentifier}
          placeholder="Например: DevPlayer или 1"
          helperText="Если игрока еще нет в базе данных, бэкенд создаст его автоматически."
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
          {submitting ? 'Запрос к бэкенду…' : 'Войти через бэкенд'}
        </Button>

        {/* Steam Login */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            component="a"
            href={`${API_BASE_URL}/login`}
            startIcon={<SportsEsports />}
            sx={{
              borderColor: '#171a21',
              bgcolor: '#171a21',
              color: '#fff',
              '&:hover': { bgcolor: '#2a475e', borderColor: '#2a475e' },
            }}
          >
            Войти через Steam OpenID
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
            ИЛИ БЫСТРЫЙ ВХОД ДЛЯ ТЕСТИРОВАНИЯ
          </Typography>
        </Divider>

        {/* Real Backend Quick Login */}
        <Stack spacing={1}>
          {TEST_ACCOUNTS.map((acc) => (
            <Box
              key={acc.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.25,
                border: 1,
                borderColor: colors.border,
                bgcolor: colors.surfaceRaised,
                borderRadius: 1,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: colors.primary,
                  bgcolor: 'rgba(255, 85, 0, 0.06)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <PlayerAvatar initials={acc.name.slice(0, 2).toUpperCase()} size={30} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                    {acc.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                    {acc.label}
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="outlined"
                disabled={submitting}
                onClick={() => handleQuickLogin(acc.name)}
                sx={{
                  minHeight: 28,
                  py: 0.25,
                  px: 1.5,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  ml: 1,
                }}
              >
                Войти
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </AuthCard>
  );
}
