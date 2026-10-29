import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { paths } from '../router/paths';
import { colors } from '../theme';

const fmt = new Intl.NumberFormat('en-US');

export default function RightSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(paths.root);
  };

  return (
    <Box
      component="aside"
      aria-label="Боковая панель профиля"
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        width: 76,
        bgcolor: colors.header,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        userSelect: 'none',
      }}
    >
      {/* Top Profile / ELO Widget */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {user ? (
          <Tooltip title={`Профиль ${user.player.name} · Нажмите для перехода`} placement="left" arrow>
            <Box
              component={RouterLink}
              to={paths.player(user.player.name)}
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                py: 1,
                px: 0.5,
                borderRadius: 1,
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 85, 0, 0.08)',
                  '& .avatar-circle': {
                    transform: 'scale(1.06)',
                    boxShadow: user.player.level === 10 ? '0 0 14px rgba(239,68,68,0.5)' : '0 0 14px rgba(255,85,0,0.4)',
                  },
                },
              }}
            >
              {/* Avatar with circular level badge */}
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Box
                  className="avatar-circle"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: colors.surfaceRaised,
                    border: `2px solid ${user.player.level === 10 ? '#EF4444' : colors.primary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 15,
                    color: '#FFFFFF',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {user.player.initials}
                </Box>
                {/* Level badge circle */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    bgcolor: user.player.level === 10 ? '#EF4444' : colors.primary,
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    borderRadius: '999px',
                    border: '2px solid #141416',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: user.player.level === 10 ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(255,85,0,0.5)',
                    lineHeight: 1,
                  }}
                >
                  {user.player.level}
                </Box>
              </Box>

              {/* ELO Rating display */}
              <Typography
                sx={{
                  mt: 1.25,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  textAlign: 'center',
                }}
              >
                {fmt.format(user.player.elo)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'success.main',
                  mt: 0.35,
                  lineHeight: 1,
                }}
              >
                +25
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          /* Guest state with login/register buttons */
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 1,
              py: 0.5,
            }}
          >
            <Tooltip title="Вы не авторизованы" placement="left" arrow>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  bgcolor: colors.surfaceRaised,
                  border: '1px dashed #3F3F46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.disabled',
                }}
              >
                <PersonOutlined sx={{ fontSize: 22 }} />
              </Box>
            </Tooltip>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: 'text.disabled',
                mt: 0.75,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Гость
            </Typography>

            <Stack spacing={0.75} sx={{ mt: 1.5, width: '100%' }}>
              <Button
                component={RouterLink}
                to={paths.login}
                variant="outlined"
                size="small"
                sx={{
                  py: 0.25,
                  px: 0.5,
                  minHeight: 26,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Вход
              </Button>
              <Button
                component={RouterLink}
                to={paths.register}
                variant="contained"
                size="small"
                sx={{
                  py: 0.25,
                  px: 0.5,
                  minHeight: 26,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                Рег.
              </Button>
            </Stack>
          </Box>
        )}

        <Divider sx={{ width: '60%', my: 1.5, borderColor: 'divider' }} />

        {/* Action icons */}
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title="Уведомления" placement="left" arrow>
            <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: '#FFFFFF' } }}>
              <Badge color="primary" variant="dot">
                <NotificationsNoneOutlined fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Bottom utilities */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        {/* Status dot */}
        <Tooltip title="Серверы Europe: Все системы работают нормально" placement="left" arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'success.main',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
          </Box>
        </Tooltip>

        {/* Logout if authenticated */}
        {user && (
          <Tooltip title="Выйти из аккаунта" placement="left" arrow>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{
                color: 'text.disabled',
                transition: 'all 0.15s ease',
                '&:hover': {
                  color: '#EF4444',
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              <LogoutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
