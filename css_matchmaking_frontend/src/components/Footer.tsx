import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import PageContainer from './PageContainer';

const links = [
  { label: 'Rules', to: '/rules' },
  { label: 'Support', to: '/support' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 4.5 }}>
      <PageContainer sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.disabled">
          © 2026 STACK · Competitive Counter-Strike
        </Typography>
        <Stack direction="row" spacing={3}>
          {links.map((l) => (
            <Link key={l.label} component={RouterLink} to={l.to} variant="body2" color="text.disabled" underline="hover">
              {l.label}
            </Link>
          ))}
        </Stack>
      </PageContainer>
    </Box>
  );
}
