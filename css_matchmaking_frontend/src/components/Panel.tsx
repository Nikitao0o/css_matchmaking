import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  caption?: ReactNode;
  centerTitle?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
}

/** Bordered card with a 40px header – the basic building block of every page. */
export default function Panel({ title, caption, centerTitle, children, sx, bodySx }: Props) {
  return (
    <Box component="section" sx={[{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        sx={{
          height: 40,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: centerTitle ? 'grid' : 'flex',
          gridTemplateColumns: centerTitle ? '1fr auto 1fr' : undefined,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {centerTitle && <span />}
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        <Box sx={{ justifySelf: 'end', color: 'text.disabled', fontSize: 12 }}>{caption}</Box>
      </Box>
      <Box sx={bodySx}>{children}</Box>
    </Box>
  );
}
