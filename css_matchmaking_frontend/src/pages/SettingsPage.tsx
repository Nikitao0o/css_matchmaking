import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useId, useState, type FormEvent } from 'react';
import { updateProfile } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import Field from '@/components/Field';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import { COUNTRIES, isValidCountryCode } from '@/constants/countries';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const countrySelectId = useId();

  const initialCountry = isValidCountryCode(user?.player.countryCode)
    ? user!.player.countryCode
    : 'RU';

  const [username, setUsername] = useState(user?.username ?? '');
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmedName = username.trim();

    if (trimmedName.length < 3 || trimmedName.length > 20) {
      setError('Никнейм должен содержать от 3 до 20 символов.');
      return;
    }
    if (!isValidCountryCode(country)) {
      setError('Выберите страну или регион из списка.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await updateProfile(user.id, {
        username: trimmedName,
        country,
      });
      await refreshUser();
      setToast('Профиль обновлен');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Настройки']}
        title="Настройки профиля"
        subtitle="Управление данными вашего аккаунта"
      />

      <Box sx={{ maxWidth: 560 }}>
        <Panel title="Основные данные">
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Field
              label="Никнейм"
              value={username}
              onChange={setUsername}
              placeholder="Введите новый никнейм"
              helperText="От 3 до 20 символов."
            />

            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <Typography component="label" htmlFor={countrySelectId} sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
                Страна / регион
              </Typography>
              <Select
                id={countrySelectId}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: { maxHeight: 320, border: 1, borderColor: 'divider' },
                    },
                  },
                }}
                sx={{
                  bgcolor: '#121215',
                  fontSize: 13,
                  '& .MuiSelect-select': { py: '12px', px: '14px' },
                }}
              >
                {COUNTRIES.map((item) => (
                  <MenuItem key={item.code} value={item.code} sx={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <span>{item.name}</span>
                    <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 700 }}>
                      {item.code} · {item.region}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText sx={{ mx: 0, mt: 0.75, fontSize: 12 }}>
                Выберите ваш регион из доступного списка.
              </FormHelperText>
            </FormControl>

            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mb: 2 }}>
              ID аккаунта: #{user?.id}
            </Typography>

            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </Button>
          </Box>
        </Panel>
      </Box>

      <Snackbar
        open={toast !== null}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
