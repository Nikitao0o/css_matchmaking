import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import { paths } from '@/router/paths';

export default function PlayersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(paths.player(encodeURIComponent(trimmed)));
  };

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Игроки']}
        title="Поиск игроков"
        subtitle="Найдите профиль игрока по никнейму"
        action={
          user ? (
            <Button variant="outlined" size="small" component={RouterLink} to={paths.player(user.player.name)}>
              Мой профиль
            </Button>
          ) : undefined
        }
      />

      <Panel title="Поиск по никнейму">
        <Box component="form" onSubmit={handleSearch} sx={{ p: 3, display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <OutlinedInput
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите никнейм игрока…"
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: 'text.disabled', fontSize: 20 }} />
              </InputAdornment>
            }
            inputProps={{ 'aria-label': 'Никнейм игрока' }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!query.trim()}
            sx={{ minWidth: { xs: '100%', sm: 140 }, minHeight: 44 }}
          >
            Найти
          </Button>
        </Box>
      </Panel>
    </>
  );
}
