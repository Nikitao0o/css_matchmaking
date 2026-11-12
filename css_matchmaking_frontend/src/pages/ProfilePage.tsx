import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { fetchProfile, type UserProfileResponse } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import KeyValueList from '@/components/KeyValueList';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import PlayerAvatar from '@/components/PlayerAvatar';
import StatusBadge from '@/components/StatusBadge';
import { paths } from '@/router/paths';
import { colors } from '@/theme';

const fmt = new Intl.NumberFormat('en-US');
const TABS = ['Overview', 'Matches', 'Statistics'] as const;

function calculateLevel(elo: number): number {
  if (elo >= 2001) return 10;
  if (elo >= 1851) return 9;
  if (elo >= 1701) return 8;
  if (elo >= 1551) return 7;
  if (elo >= 1401) return 6;
  if (elo >= 1251) return 5;
  if (elo >= 1101) return 4;
  if (elo >= 951) return 3;
  if (elo >= 801) return 2;
  return 1;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { name } = useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = user?.id;

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      setError('Вы не авторизованы. Войдите в аккаунт, чтобы просмотреть профиль.');
      return;
    }

    setLoading(true);
    setError(null);

    fetchProfile(targetId)
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => {
        console.error('Ошибка загрузки профиля:', err);
        setError('Не удалось загрузить данные игрока. Попробуйте обновить страницу.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetId]);

  if (loading) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
          Загрузка профиля…
        </Typography>
      </Box>
    );
  }

  if (error || !profileData) {
    return (
      <Box sx={{ py: 6, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error ?? 'Данные игрока не найдены.'}
        </Alert>
        <Button variant="contained" component={RouterLink} to={paths.login}>
          Перейти на страницу входа
        </Button>
      </Box>
    );
  }

  const username = profileData.username || name || `Player #${profileData.id}`;
  const initials = username.slice(0, 2).toUpperCase();
  const currentElo = profileData.elo ?? 1000;
  const currentLevel = calculateLevel(currentElo);
  const totalMatches = profileData.matches_played ?? 0;
  const wins = profileData.wins ?? 0;
  const losses = profileData.losses ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return (
    <>
      <PageHeader
        crumbs={['Stack', 'Players', username]}
        title="Player profile"
        subtitle="Counter-Strike: Source Matchmaking"
        action={
          <Button variant="outlined" size="small" startIcon={<SettingsOutlined fontSize="small" />} component={RouterLink} to="/settings">
            Edit profile
          </Button>
        }
      />

      {/* Hero */}
      <Box sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <PlayerAvatar initials={initials} size={64} sx={{ fontSize: 26 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>{username}</Typography>
              <StatusBadge label="ONLINE" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              ID: #{profileData.id} · Counter-Strike: Source Player
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, color: 'text.secondary', fontSize: 12 }}>
              <VerifiedUserOutlined sx={{ fontSize: 14, color: 'success.main' }} />
              Подтвержденный профиль CS:S
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{fmt.format(currentElo)} ELO</Typography>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                bgcolor: currentLevel === 10 ? '#EF4444' : colors.primary,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: '2px',
                lineHeight: 1.2,
                boxShadow: currentLevel === 10 ? '0 0 12px rgba(239,68,68,0.45)' : '0 0 10px rgba(255,85,0,0.3)',
              }}
            >
              LVL {currentLevel}
            </Box>
          </Box>
          <Typography variant="caption">
            Level {currentLevel} · Рейтинговый профиль
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t) => (
          <Tab key={t} value={t} label={t} disableRipple sx={{ minWidth: 0, mr: 2, px: 0, fontSize: 13 }} />
        ))}
      </Tabs>

      {tab !== 'Overview' ? (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>
          {totalMatches === 0 ? 'Матчей пока не сыграно. Запустите матч в поиске игры.' : `${tab} данные загружаются`}
        </Box>
      ) : (
        <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 296px' }, alignItems: 'start' }}>
          {/* Main column */}
          <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              {[
                { value: String(totalMatches), label: 'Сыграно матчей' },
                { value: `${winRate}%`, label: 'Винрейт' },
                { value: String(wins), label: 'Побед' },
                { value: String(losses), label: 'Поражений' },
              ].map((c, i) => (
                <Box key={c.label} sx={{ p: 2, borderLeft: i === 0 ? 0 : 1, borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 500 }}>{c.value}</Typography>
                  <Typography variant="caption">{c.label}</Typography>
                </Box>
              ))}
            </Box>

            <Panel title="Статус аккаунта">
              <Box sx={{ p: 2.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Официальный соревновательный профиль. Ваш ELO обновляется по результатам каждого сыгранного матча.
                </Typography>
                <Button component={RouterLink} to={paths.matchmaking} variant="contained">
                  Перейти в поиск матча
                </Button>
              </Box>
            </Panel>
          </Box>

          {/* Side column */}
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Panel title="Параметры игрока">
              <KeyValueList
                items={[
                  { label: 'ID игрока', value: `#${profileData.id}` },
                  { label: 'Никнейм', value: username },
                  { label: 'Текущий ELO', value: String(currentElo) },
                  { label: 'Статус аккаунта', value: 'Активен' },
                  { label: 'Регион', value: 'Европа' },
                ]}
              />
            </Panel>
          </Box>
        </Box>
      )}
    </>
  );
}
