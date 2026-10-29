import ArrowForward from '@mui/icons-material/ArrowForward';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import EqualizerOutlined from '@mui/icons-material/EqualizerOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import SpeedOutlined from '@mui/icons-material/SpeedOutlined';
import SportsEsportsOutlined from '@mui/icons-material/SportsEsportsOutlined';
import WhatshotOutlined from '@mui/icons-material/WhatshotOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { paths } from '../router/paths';
import { colors } from '../theme';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: <EmojiEventsOutlined sx={{ fontSize: 30, color: colors.primary }} />,
    title: 'Ранговая система ELO',
    description: '10 уровней мастерства, от новичка до FPL Pro. Честный подбор соперников равного уровня.',
  },
  {
    icon: <SpeedOutlined sx={{ fontSize: 30, color: colors.primary }} />,
    title: 'Высокий 128 Tickrate',
    description: 'Оптимизированные соревновательные серверы с минимальной задержкой и точной регистрацией попаданий.',
  },
  {
    icon: <ShieldOutlined sx={{ fontSize: 30, color: colors.primary }} />,
    title: 'Защита и честная игра',
    description: 'Встроенные алгоритмы проверки и модерации обеспечивают равные условия для всех участников.',
  },
  {
    icon: <EqualizerOutlined sx={{ fontSize: 30, color: colors.primary }} />,
    title: 'Подробная статистика',
    description: 'K/D, ADR, процент хедшотов, винрейт и наглядные графики динамики рейтинга каждого игрока.',
  },
];

interface ModeItem {
  title: string;
  badge: string;
  players: string;
  description: string;
  accent: string;
}

const MODES: ModeItem[] = [
  {
    title: 'Соревновательный',
    badge: '5х5',
    players: '10 игроков',
    description: 'Классический турнирный формат с полной экономикой, тактическими паузами и 30 соревновательными раундами.',
    accent: colors.primary,
  },
  {
    title: 'Напарники',
    badge: '2х2',
    players: '4 игрока',
    description: 'Быстрые и динамичные сражения в парах на укороченных картах с одной зоной закладки бомбы.',
    accent: '#3B82F6',
  },
  {
    title: 'Дуэли',
    badge: '1х1',
    players: '2 игрока',
    description: 'Битва один на один. Проверьте реакцию, аим и знание позиций без посторонней помощи.',
    accent: '#10B981',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 1140, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 6, pb: 6, pt: 2 }}>
      {/* 1. Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          p: { xs: 3, sm: 5, md: 7 },
          bgcolor: '#121216',
          border: '1px solid #27272A',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 85, 0, 0.15), rgba(18, 18, 22, 0))',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Season Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.6,
            borderRadius: '999px',
            bgcolor: 'rgba(255, 85, 0, 0.12)',
            border: '1px solid rgba(255, 85, 0, 0.35)',
            color: colors.primary,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            mb: 3,
          }}
        >
          <WhatshotOutlined sx={{ fontSize: 16 }} />
          <span>Сезон 1 · Counter-Strike: Source Matchmaking</span>
        </Box>

        {/* Main Title */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: 30, sm: 42, md: 52 },
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: 820,
            mb: 2.5,
          }}
        >
          Играй. Побеждай.{' '}
          <Box component="span" sx={{ color: colors.primary, display: 'inline' }}>
            Поднимай ELO.
          </Box>
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: { xs: 15, sm: 17, md: 19 },
            color: colors.textSecondary,
            maxWidth: 680,
            lineHeight: 1.6,
            mb: 4.5,
          }}
        >
          Соревновательная платформа нового поколения для любителей Counter-Strike: Source.
          Турнирный маппул, рейтинговая система 1–10 уровней и честный баланс команд.
        </Typography>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', mb: 5 }}>
          <Button
            component={RouterLink}
            to={paths.matchmaking}
            variant="contained"
            size="large"
            startIcon={<SportsEsportsOutlined sx={{ fontSize: 24 }} />}
            sx={{
              px: 4.5,
              py: 1.6,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              bgcolor: colors.primary,
              boxShadow: '0 6px 24px rgba(255, 85, 0, 0.45)',
              '&:hover': {
                bgcolor: colors.primaryHover,
                boxShadow: '0 8px 30px rgba(255, 85, 0, 0.6)',
              },
            }}
          >
            В матчмейкинг
          </Button>

          {user ? (
            <Button
              component={RouterLink}
              to={paths.player(user.player.name)}
              variant="outlined"
              size="large"
              startIcon={<PersonOutlined sx={{ fontSize: 22 }} />}
              sx={{
                px: 3.5,
                py: 1.5,
                fontSize: 15,
                fontWeight: 700,
                borderColor: '#3F3F46',
                color: '#FFFFFF',
                '&:hover': {
                  borderColor: colors.primary,
                  bgcolor: 'rgba(255, 85, 0, 0.08)',
                },
              }}
            >
              Мой профиль ({user.player.name})
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to={paths.login}
              variant="outlined"
              size="large"
              sx={{
                px: 3.5,
                py: 1.5,
                fontSize: 15,
                fontWeight: 700,
                borderColor: '#3F3F46',
                color: '#FFFFFF',
                '&:hover': {
                  borderColor: colors.primary,
                  bgcolor: 'rgba(255, 85, 0, 0.08)',
                },
              }}
            >
              Войти в аккаунт
            </Button>
          )}
        </Stack>

        {/* Quick Numbers Bar */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: { xs: 2, sm: 3 },
            width: '100%',
            maxWidth: 780,
            pt: 3.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#FFFFFF' }}>
              1–10 LVL
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
              Рейтинг ELO
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: colors.primary }}>
              128 TICK
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
              Выделенные серверы
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#FFFFFF' }}>
              3 РЕЖИМА
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
              5х5 · 2х2 · 1х1
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#FFFFFF' }}>
              8 КАРТ
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
              Турнирный маппул
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. Game Modes Section */}
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.primary, mb: 0.5 }}>
            Форматы игры
          </Typography>
          <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: '#FFFFFF' }}>
            Выберите свой формат сражения
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {MODES.map((mode) => (
            <Box
              key={mode.badge}
              sx={{
                bgcolor: colors.panel,
                border: 1,
                borderColor: colors.border,
                borderRadius: 2.5,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                '&:hover': {
                  borderColor: mode.accent,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.5), 0 0 16px ${mode.accent}33`,
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: '6px',
                      bgcolor: `${mode.accent}22`,
                      border: `1px solid ${mode.accent}55`,
                      color: mode.accent,
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    {mode.badge}
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12, fontWeight: 600 }}>
                    {mode.players}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                  {mode.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, mb: 3 }}>
                  {mode.description}
                </Typography>
              </Box>

              <Button
                onClick={() => navigate(paths.matchmaking)}
                variant="outlined"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{
                  width: '100%',
                  borderColor: '#2F2F36',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  py: 1,
                  '&:hover': {
                    borderColor: mode.accent,
                    bgcolor: `${mode.accent}14`,
                    color: mode.accent,
                  },
                }}
              >
                В лобби {mode.badge}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 3. Platform Features Grid */}
      <Box sx={{ bgcolor: colors.panel, border: 1, borderColor: colors.border, borderRadius: 3, p: { xs: 3, sm: 4, md: 5 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.primary, mb: 0.5 }}>
            Преимущества
          </Typography>
          <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 900, color: '#FFFFFF' }}>
            Почему соревноваться на нашей платформе?
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3.5,
          }}
        >
          {FEATURES.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                gap: 2,
                p: 2.5,
                bgcolor: '#141417',
                border: '1px solid #232328',
                borderRadius: 2,
              }}
            >
              <Box sx={{ flexShrink: 0, mt: 0.5 }}>{item.icon}</Box>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>
                  {item.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 4. Competitive Map Pool Strip */}
      <Box
        sx={{
          bgcolor: '#121216',
          border: '1px solid #27272A',
          borderRadius: 2.5,
          p: 3.5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', mb: 0.75 }}>
            Турнирный соревновательный маппул
          </Typography>
          <Typography sx={{ fontSize: 13, color: colors.textSecondary, maxWidth: 560 }}>
            Mirage, Dust II, Inferno, Nuke, Train, Cache, Tuscan, Cobblestone. Выбирайте любимые карты в лобби перед началом поиска.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={paths.matchmaking}
          variant="contained"
          endIcon={<ArrowForward />}
          sx={{
            flexShrink: 0,
            px: 3.5,
            py: 1.25,
            fontSize: 14,
            fontWeight: 800,
            textTransform: 'uppercase',
            bgcolor: colors.primary,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          Перейти к выбору карт
        </Button>
      </Box>

      {/* 5. Bottom Ready Banner */}
      <Box
        sx={{
          textAlign: 'center',
          p: { xs: 4, sm: 5 },
          borderRadius: 3,
          bgcolor: 'rgba(255, 85, 0, 0.05)',
          border: '1px dashed rgba(255, 85, 0, 0.35)',
        }}
      >
        <Typography sx={{ fontSize: { xs: 20, sm: 26 }, fontWeight: 900, color: '#FFFFFF', mb: 1 }}>
          Готовы испытать свои силы?
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.textSecondary, maxWidth: 520, mx: 'auto', mb: 3 }}>
          Присоединяйтесь к матчам прямо сейчас. Приглашайте друзей, собирайте команду или побеждайте соло.
        </Typography>
        <Button
          component={RouterLink}
          to={paths.matchmaking}
          variant="contained"
          size="large"
          startIcon={<SportsEsportsOutlined sx={{ fontSize: 24 }} />}
          sx={{
            px: 4.5,
            py: 1.4,
            fontSize: 15,
            fontWeight: 900,
            bgcolor: colors.primary,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          Открыть лобби матчмейкинга
        </Button>
      </Box>
    </Box>
  );
}
