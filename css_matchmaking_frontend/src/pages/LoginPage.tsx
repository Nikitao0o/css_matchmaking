import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthCard from '../components/AuthCard';
import Field from '../components/Field';
import PlayerAvatar from '../components/PlayerAvatar';
import { paths } from '../router/paths';
import { colors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login, quickLogin, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = 'Введите корректный email адрес.';
    if (!password) next.password = 'Введите пароль.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login(email, password, remember);
      navigate(paths.matchmaking, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Не удалось войти. Проверьте данные.');
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
          Проблемы со входом? <Link component={RouterLink} to="/support" color="inherit">Служба поддержки</Link>
        </>
      }
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, fontWeight: 700 }}>
          Вход в аккаунт
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Войдите, чтобы присоединиться к лобби и начать поиск матча.
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            {authError}
          </Alert>
        )}

        <Field label="Email адрес" type="email" value={email} onChange={setEmail} placeholder="name@example.com" error={errors.email} autoComplete="email" autoFocus />
        <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Введите ваш пароль" error={errors.password} autoComplete="current-password" />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label="Запомнить меня"
            slotProps={{ typography: { sx: { fontSize: 12, color: 'text.secondary' } } }}
          />
          <Link component={RouterLink} to="/forgot-password" sx={{ fontSize: 12 }}>
            Забыли пароль?
          </Link>
        </Box>

        <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting}>
          {submitting ? 'Вход…' : 'Войти'}
        </Button>

        {/* Demo Accounts section */}
        <Box sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⚡ Пробные аккаунты для теста
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
              пароль: password123
            </Typography>
          </Box>

          <Stack spacing={1}>
            {demoAccounts.map((acc) => (
              <Box
                key={acc.id}
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
                <Box
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setAuthError(null);
                  }}
                  title="Нажмите, чтобы подставить в форму"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', flex: 1, minWidth: 0 }}
                >
                  <PlayerAvatar initials={acc.player.initials} size={30} />
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.player.name}
                      </Typography>
                      <Box
                        sx={{
                          px: 0.6,
                          py: 0.1,
                          bgcolor: acc.player.level === 10 ? '#EF4444' : colors.primary,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: '2px',
                          lineHeight: 1.2,
                        }}
                      >
                        LVL {acc.player.level}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.player.elo} ELO · {acc.description}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      await quickLogin(acc);
                      navigate(paths.matchmaking, { replace: true });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  sx={{
                    minHeight: 28,
                    py: 0.25,
                    px: 1.25,
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
      </Box>
    </AuthCard>
  );
}
