import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { colors } from '../theme';

interface Props {
  initials: string;
  size?: number;
  sx?: SxProps<Theme>;
}

/** Square initials tile used everywhere a player picture would go. */
export default function PlayerAvatar({ initials, size = 32, sx }: Props) {
  return (
    <Box
      aria-hidden
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          bgcolor: colors.surfaceRaised,
          border: `1px solid ${colors.border}`,
          color: 'text.primary',
          fontWeight: 600,
          fontSize: Math.round(size * 0.36),
          letterSpacing: '0.02em',
          userSelect: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {initials}
    </Box>
  );
}
