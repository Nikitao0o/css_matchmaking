import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { colors } from '@/theme';

interface Props {
  /** Small text under the card. */
  note: ReactNode;
  children: ReactNode;
}

export default function AuthCard({ note, children }: Props) {
  return (
    <Box sx={{ width: '100%', maxWidth: 460, mx: 'auto', my: { xs: 2, md: 4 } }}>
      <Typography sx={{ textAlign: 'center', fontSize: 12, color: 'text.disabled', mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Counter-Strike:Source · Competitive Matchmaking
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: colors.header, px: 3, py: 1.75 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.primary }}>
            Авторизация
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>

      <Typography sx={{ textAlign: 'center', fontSize: 12, color: 'text.disabled', mt: 2, px: 2 }}>{note}</Typography>
    </Box>
  );
}
