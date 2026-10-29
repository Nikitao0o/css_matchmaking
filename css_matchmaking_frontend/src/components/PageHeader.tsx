import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface Props {
  crumbs: string[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ crumbs, title, subtitle, action }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, pt: 4, pb: 3 }}>
      <Box>
        <Typography sx={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.disabled', mb: 1.5 }}>
          {crumbs.join(' / ')}
        </Typography>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ mt: 0.5, color: 'text.disabled' }} variant="body1">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
