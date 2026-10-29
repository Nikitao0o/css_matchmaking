import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer';
import LeftSidebar from '../components/LeftSidebar';
import PageContainer from '../components/PageContainer';
import RightSidebar from '../components/RightSidebar';

/** Master shell for the entire website: left sliding panel, center content, right profile/elo panel. */
export default function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* Left sliding navigation panel with CSS brand */}
      <LeftSidebar />

      {/* Central main content area */}
      <Box
        sx={{
          flex: 1,
          ml: '68px',
          mr: '76px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Box component="main" sx={{ flex: 1, py: { xs: 2.5, sm: 3 } }}>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </Box>

        <Footer />
      </Box>

      {/* Right profile, ELO & utility panel */}
      <RightSidebar />
    </Box>
  );
}
