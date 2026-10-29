import Box from '@mui/material/Box';
import PageHeader from '../components/PageHeader';

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader crumbs={['Stack', title]} title={title} />
      <Box sx={{ py: 10, textAlign: 'center', color: 'text.disabled', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        This section is not built yet.
      </Box>
    </>
  );
}
