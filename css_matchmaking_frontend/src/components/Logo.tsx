import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme';

export default function Logo({ withIcon = false, to = '/' }: { withIcon?: boolean; to?: string }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        textDecoration: 'none',
        color: 'text.primary',
        transition: 'opacity 0.15s ease',
        '&:hover': { opacity: 0.9 },
      }}
    >
      {withIcon && (
        <CrisisAlertIcon
          sx={{
            fontSize: 22,
            color: colors.primary,
          }}
        />
      )}
      <Typography
        component="span"
        sx={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <span>MATCH</span>
        <Box component="span" sx={{ color: colors.primary }}>
          MAKING
        </Box>
      </Typography>
    </Box>
  );
}
