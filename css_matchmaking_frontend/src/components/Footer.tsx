import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { paths } from '@/router/paths';

const links = [
  { label: 'Правила', to: paths.rules },
  { label: 'Поддержка', to: paths.support },
  { label: 'Конфиденциальность', to: paths.privacy },
  { label: 'Условия', to: paths.terms },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 4.5 }}>
      <PageContainer sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.disabled">
          © 2026 CSS Matchmaking
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
