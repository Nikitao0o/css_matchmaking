import Box from '@mui/material/Box';
import { colors } from '../theme';

type Tone = 'primary' | 'success';

export default function StatusBadge({ label, tone = 'primary' }: { label: string; tone?: Tone }) {
  const isSuccess = tone === 'success';
  const c = isSuccess ? colors.success : colors.primary;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        height: 22,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: c,
        bgcolor: isSuccess ? 'rgba(34, 197, 94, 0.12)' : colors.selected,
        border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : colors.selectedBorder}`,
        borderRadius: '2px',
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c }} />
      {label}
    </Box>
  );
}
