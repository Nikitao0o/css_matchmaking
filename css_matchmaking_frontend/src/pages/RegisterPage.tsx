import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthCard from '../components/AuthCard';
import Field from '../components/Field';
import { paths } from '../router/paths';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^\w{3,20}$/;

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'agree', string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const next: Errors = {};
    if (!NAME_RE.test(name)) next.name = 'От 3 до 20 символов: буквы, цифры и знак подчеркивания.';
    if (!EMAIL_RE.test(email)) next.email = 'Введите корректный email адрес.';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      next.password = 'Минимум 8 символов, включая букву и цифру.';
    if (confirm !== password) next.confirm = 'Пароли не совпадают.';
    if (!agree) next.agree = 'Необходимо принять Условия использования и Политику конфиденциальности.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate(paths.matchmaking, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Ошибка при регистрации. Попробуйте еще раз.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      tab="register"
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
            Войти
          </Link>
        </>
      }
      note="После регистрации ваш профиль будет автоматически активирован со стартовым рейтингом 1000 ELO (Level 3)."
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, fontWeight: 700 }}>
          Создание аккаунта
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Создайте игровой профиль и начните играть на соревновательных серверах.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 13, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            {serverError}
          </Alert>
        )}

        <Field label="Имя игрока (никнейм)" value={name} onChange={setName} placeholder="Например: shadow_ninja" helperText="3–20 символов. Латиница, цифры и подчеркивание." error={errors.name} autoComplete="username" autoFocus />
        <Field label="Email адрес" type="email" value={email} onChange={setEmail} placeholder="name@example.com" error={errors.email} autoComplete="email" />
        <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Создайте надежный пароль" helperText="Не менее 8 символов, включая букву и цифру." error={errors.password} autoComplete="new-password" />
        <Field label="Подтвердите пароль" type="password" value={confirm} onChange={setConfirm} placeholder="Повторите пароль" error={errors.confirm} autoComplete="new-password" />

        <Box sx={{ mb: 2.5 }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
            label={
              <>
                Я принимаю <Link component={RouterLink} to="/terms">Условия обслуживания</Link> и{' '}
                <Link component={RouterLink} to="/privacy">Политику конфиденциальности</Link>.
              </>
            }
            slotProps={{ typography: { sx: { fontSize: 12, color: 'text.secondary' } } }}
          />
          {errors.agree && <FormHelperText error sx={{ mx: 0, fontSize: 12 }}>{errors.agree}</FormHelperText>}
        </Box>

        <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting}>
          {submitting ? 'Создание профиля…' : 'Зарегистрироваться'}
        </Button>
      </Box>
    </AuthCard>
  );
}
