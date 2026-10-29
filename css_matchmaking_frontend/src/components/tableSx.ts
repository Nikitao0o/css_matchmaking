import type { SxProps, Theme } from '@mui/material/styles';
import { colors } from '../theme';

/** Shared dense-table look used by match history, team rosters and map stats. */
export const denseTableSx: SxProps<Theme> = {
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${colors.border}`,
    px: 2,
    py: 1.25,
    fontSize: 13,
    color: 'text.primary',
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'text.disabled',
    fontWeight: 500,
    py: 1,
  },
  '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': { borderBottom: 0 },
};
