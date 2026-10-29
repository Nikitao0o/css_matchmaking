import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { PAGE_MAX_WIDTH } from '../theme';

export default function PageContainer({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box sx={[{ width: '100%', maxWidth: PAGE_MAX_WIDTH, mx: 'auto', px: 3 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Box>
  );
}
