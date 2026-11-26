import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import SportsEsportsOutlined from '@mui/icons-material/SportsEsportsOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchProfile,
  fetchServers,
  markNotificationRead,
  type GameServerInfo,
  type NotificationItem,
} from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { paths } from '@/router/paths';
import { colors } from '@/theme';
import { fmt } from '@/utils/format';

export default function RightSidebar() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [servers, setServers] = useState<GameServerInfo[]>([]);

  useEffect(() => {
    let active = true;

    fetchServers().then((data) => {
      if (active) setServers(data);
    });

    if (user?.id) {
      fetchNotifications(user.id).then((data) => {
        if (active) setNotifications(data);
      });
    }

    return () => {
      active = false;
    };
  }, [user?.id]);

  // Синхронизируем current_room_id при переходах между страницами
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    fetchProfile(user.id)
      .then((profile) => {
        if (!active) return;
        const remoteRoomId = profile.current_room_id ?? null;
        if (remoteRoomId !== user.current_room_id) {
          void refreshUser();
        }
      })
      .catch(() => {
        // Ошибка логируется в API-клиенте
      });

    return () => {
      active = false;
    };
  }, [location.pathname, user?.id, user?.current_room_id, refreshUser]);

  const activeNotifications = user ? notifications : [];
  const unreadCount = activeNotifications.filter((n) => !n.read).length;
  const availableServers = servers.filter((s) => s.status === 'available' || s.status === 'in_use').length;
  const serverStatusTitle =
    servers.length === 0
      ? 'Нет доступных игровых серверов'
      : `Игровых серверов онлайн: ${availableServers} из ${servers.length}`;

  const activeRoomId = user?.current_room_id ?? null;
  const isOnActiveRoomPage = activeRoomId !== null && location.pathname === paths.match(activeRoomId);

  const handleLogout = () => {
    logout();
    navigate(paths.root);
  };

  const handleMarkRead = async (id: number | string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await markNotificationRead(id);
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

        {user && (
          <>
            <Divider sx={{ width: '60%', my: 1.5, borderColor: 'divider' }} />

            <Stack spacing={1.5} sx={{ alignItems: 'center', width: '100%', px: 1 }}>
              {activeRoomId !== null && (
                <Tooltip
                  title={
                    isOnActiveRoomPage
                      ? `Вы сейчас в комнате #${activeRoomId}`
                      : `Активная комната #${activeRoomId} · Вернуться к матчу`
                  }
                  placement="left"
                  arrow
                >
                  <Box
                    component={RouterLink}
                    to={paths.match(activeRoomId)}
                    aria-label={`Вернуться в комнату #${activeRoomId}`}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.4,
                      py: 0.9,
                      px: 0.5,
                      borderRadius: 1.5,
                      textDecoration: 'none',
                      color: '#FFFFFF',
                      bgcolor: isOnActiveRoomPage ? 'rgba(255, 85, 0, 0.24)' : 'rgba(255, 85, 0, 0.14)',
                      border: `1px solid ${colors.primary}`,
                      boxShadow: '0 0 12px rgba(255, 85, 0, 0.28)',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: colors.primary,
                        boxShadow: '0 0 16px rgba(255, 85, 0, 0.5)',
                      },
                    }}
                  >
                    <SportsEsportsOutlined sx={{ fontSize: 20, color: 'inherit' }} />
                    <Typography sx={{ fontSize: 10, fontWeight: 800, lineHeight: 1, letterSpacing: '0.02em' }}>
                      #{activeRoomId}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              <Tooltip title="Уведомления" placement="left" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => setNotifAnchor(e.currentTarget)}
                  aria-label="Уведомления"
                  sx={{ color: 'text.secondary', '&:hover': { color: '#FFFFFF' } }}
                >
                  <Badge color="primary" variant="dot" invisible={unreadCount === 0}>
                    <NotificationsNoneOutlined fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Stack>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
              transformOrigin={{ vertical: 'center', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    width: 300,
                    maxHeight: 360,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: colors.panel,
                    mr: 1,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Уведомления</Typography>
                {unreadCount > 0 && (
                  <Typography sx={{ fontSize: 11, color: colors.primary, fontWeight: 700 }}>
                    {unreadCount} новых
                  </Typography>
                )}
              </Box>
              <Box sx={{ p: 1.5 }}>
                {activeNotifications.length === 0 ? (
                  <Typography sx={{ py: 3, textAlign: 'center', fontSize: 13, color: 'text.disabled' }}>
                    Уведомлений пока нет
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {activeNotifications.map((n) => (
                      <Box
                        key={n.id}
                        onClick={() => !n.read && void handleMarkRead(n.id)}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          bgcolor: n.read ? 'transparent' : colors.selected,
                          border: 1,
                          borderColor: n.read ? 'divider' : colors.selectedBorder,
                          cursor: n.read ? 'default' : 'pointer',
                        }}
                      >
                        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{n.title}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{n.message}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Popover>
          </>
        )}
      </Box>

      {/* Bottom utilities */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Tooltip title={serverStatusTitle} placement="left" arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: availableServers > 0 ? 'success.main' : 'warning.main',
                boxShadow:
                  availableServers > 0
                    ? '0 0 8px rgba(34, 197, 94, 0.6)'
                    : '0 0 8px rgba(245, 158, 11, 0.6)',
              }}
            />
          </Box>
        </Tooltip>

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
