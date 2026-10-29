import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import FormatListBulletedOutlined from '@mui/icons-material/FormatListBulletedOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import LeaderboardOutlined from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import SportsEsportsOutlined from '@mui/icons-material/SportsEsportsOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { NavLink, Link as RouterLink } from 'react-router-dom';
import { paths } from '../router/paths';
import { colors } from '../theme';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Главная', to: paths.home, icon: <HomeOutlined sx={{ fontSize: 22 }} />, exact: true },
  { label: 'Матчмейкинг', to: paths.matchmaking, icon: <SportsEsportsOutlined sx={{ fontSize: 22 }} /> },
  { label: 'Матчи', to: paths.matches, icon: <FormatListBulletedOutlined sx={{ fontSize: 22 }} /> },
  { label: 'Рейтинг', to: paths.rankings, icon: <LeaderboardOutlined sx={{ fontSize: 22 }} /> },
  { label: 'Игроки', to: paths.players, icon: <GroupOutlined sx={{ fontSize: 22 }} /> },
];

export default function LeftSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const expanded = isPinned || isHovered;

  return (
    <Box
      component="aside"
      aria-label="Боковая навигация"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1200,
        width: expanded ? 230 : 68,
        bgcolor: colors.header,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease',
        boxShadow: expanded ? '8px 0 28px rgba(0, 0, 0, 0.7)' : 'none',
        overflowX: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top logo / brand */}
      <Box>
        <Box
          component={RouterLink}
          to={paths.home}
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            px: expanded ? 2.5 : 0,
            textDecoration: 'none',
            borderBottom: 1,
            borderColor: 'divider',
            transition: 'all 0.15s ease',
            '&:hover .logo-text': {
              color: colors.primaryHover,
            },
          }}
        >
          <Typography
            className="logo-text"
            sx={{
              fontSize: 22,
              fontWeight: 900,
              color: colors.primary,
              letterSpacing: '0.08em',
              lineHeight: 1,
              transition: 'color 0.15s ease',
            }}
          >
            CSS
          </Typography>
          {expanded && (
            <Typography
              sx={{
                ml: 1.25,
                fontSize: 10,
                fontWeight: 800,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              Matchmaking
            </Typography>
          )}
        </Box>

        {/* Navigation list */}
        <Box component="nav" sx={{ mt: 1.5 }}>
          {navItems.map((item) => {
            const linkContent = (
              <Box
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.exact}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 46,
                  mx: 1,
                  my: 0.5,
                  px: expanded ? 2 : 1.75,
                  borderRadius: 1,
                  textDecoration: 'none',
                  color: 'text.secondary',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  '&:hover': {
                    bgcolor: 'rgba(255, 85, 0, 0.08)',
                    color: 'text.primary',
                  },
                  '&.active': {
                    bgcolor: 'rgba(255, 85, 0, 0.15)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    '& .nav-icon': {
                      color: colors.primary,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3.5,
                      bgcolor: colors.primary,
                      borderRadius: '0 4px 4px 0',
                    },
                  },
                }}
              >
                <Box
                  className="nav-icon"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 26,
                    color: 'inherit',
                  }}
                >
                  {item.icon}
                </Box>
                {expanded && (
                  <Typography
                    sx={{
                      ml: 1.5,
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      color: 'inherit',
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Box>
            );

            return expanded ? (
              linkContent
            ) : (
              <Tooltip key={item.to} title={item.label} placement="right" arrow>
                {linkContent}
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Bottom controls */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Box
          component={RouterLink}
          to={paths.settings}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 42,
            px: expanded ? 2 : 1.75,
            borderRadius: 1,
            textDecoration: 'none',
            color: 'text.secondary',
            justifyContent: expanded ? 'flex-start' : 'center',
            '&:hover': {
              bgcolor: 'rgba(255, 85, 0, 0.08)',
              color: 'text.primary',
            },
          }}
        >
          <SettingsOutlined sx={{ fontSize: 20 }} />
          {expanded && (
            <Typography sx={{ ml: 1.5, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              Настройки
            </Typography>
          )}
        </Box>

        {/* Pin / Expand button toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
            mt: 0.5,
            px: expanded ? 1.5 : 0,
          }}
        >
          {expanded && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
              {isPinned ? 'Закреплено' : 'Закрепить'}
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={() => setIsPinned(!isPinned)}
            aria-label={isPinned ? 'Открепить панель' : 'Закрепить панель'}
            sx={{
              color: isPinned ? colors.primary : 'text.disabled',
              '&:hover': { color: colors.primary },
            }}
          >
            {expanded ? (
              <ChevronLeftOutlined fontSize="small" />
            ) : (
              <ChevronRightOutlined fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
