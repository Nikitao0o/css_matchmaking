import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { paths } from '../router/paths';
import { colors } from '../theme';
import PlayerAvatar from './PlayerAvatar';

const fmt = new Intl.NumberFormat('en-US');

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button
          component={RouterLink}
          to={paths.login}
          variant="outlined"
          size="small"
        >
          Вход
        </Button>
        <Button
          component={RouterLink}
          to={paths.register}
          variant="contained"
          size="small"
        >
          Регистрация
        </Button>
      </Stack>
    );
  }

  const { player } = user;

  const go = (to: string) => {
    setAnchor(null);
    navigate(to);
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          textAlign: 'left',
          py: 0.5,
          px: 1,
          borderRadius: 1,
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: 'rgba(255, 85, 0, 0.08)' },
        }}
      >
        <PlayerAvatar initials={player.initials} size={32} sx={{ border: `1.5px solid ${player.level === 10 ? '#EF4444' : colors.primary}` }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{player.name}</Typography>
            <Box
              sx={{
                px: 0.5,
                py: 0.1,
                bgcolor: player.level === 10 ? '#EF4444' : colors.primary,
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                borderRadius: '2px',
                lineHeight: 1.2,
              }}
            >
              LVL {player.level}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.4 }}>
            {fmt.format(player.elo)} ELO
          </Typography>
        </Box>
        <KeyboardArrowDown fontSize="small" sx={{ color: 'text.secondary' }} />
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 0.5, border: 1, borderColor: 'divider' } } }}
      >
        <MenuItem onClick={() => go(paths.matchmaking)}>
          <ListItemText>Матчмейкинг</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(paths.player(player.name))}>
          <ListItemText>My profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            logout();
            navigate(paths.root);
          }}
        >
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
