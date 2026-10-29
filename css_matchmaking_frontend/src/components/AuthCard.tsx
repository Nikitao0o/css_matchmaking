import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme';

interface Props {
  tab: 'login' | 'register';
  /** Small text under the card. */
  note: ReactNode;
  /** Footer row inside the card (e.g. "Don't have an account?"). */
  footer: ReactNode;
  children: ReactNode;
}

export default function AuthCard({ tab, note, footer, children }: Props) {
  return (
    <Box sx={{ width: '100%', maxWidth: 460, mx: 'auto', my: { xs: 2, md: 4 } }}>
      <Typography sx={{ textAlign: 'center', fontSize: 12, color: 'text.disabled', mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Counter-Strike:Source · Competitive Faceit MM
      </Typography>

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 85, 0, 0.08)',
        }}
      >
        <Tabs
          value={tab}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: colors.header,
          }}
        >
          <Tab component={RouterLink} to="/login" value="login" label="Вход" sx={{ fontWeight: 700 }} />
          <Tab component={RouterLink} to="/register" value="register" label="Регистрация" sx={{ fontWeight: 700 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>{children}</Box>

        <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: colors.header, py: 2, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}>
          {footer}
        </Box>
      </Box>

      <Typography sx={{ textAlign: 'center', fontSize: 12, color: 'text.disabled', mt: 2, px: 2 }}>{note}</Typography>
    </Box>
  );
}
