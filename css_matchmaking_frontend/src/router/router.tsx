import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import RequireAuth from '@/auth/RequireAuth';
import MainLayout from '@/layouts/MainLayout';
import ErrorPage from '@/pages/ErrorPage';
import { paths } from '@/router/paths';

/** Code-split a page: `lazy(() => import('@/pages/X'))` – pages are default exports. */
const page = (load: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

const comingSoon = (title: string) => ({
  lazy: async () => {
    const { default: ComingSoonPage } = await import('@/pages/ComingSoonPage');
    return { element: <ComingSoonPage title={title} /> };
  },
});

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Public: Home, player search by nickname, ELO leaderboard, auth & info pages
      { path: paths.root, ...page(() => import('@/pages/HomePage')) },
      { path: paths.home, ...page(() => import('@/pages/HomePage')) },
      { path: paths.players, ...page(() => import('@/pages/PlayersPage')) },
      { path: paths.player(), ...page(() => import('@/pages/ProfilePage')) },
      { path: paths.rankings, ...page(() => import('@/pages/RankingsPage')) },
      { path: paths.login, ...page(() => import('@/pages/LoginPage')) },
      { path: paths.rules, ...comingSoon('Правила') },
      { path: paths.support, ...comingSoon('Поддержка') },
      { path: paths.privacy, ...comingSoon('Конфиденциальность') },
      { path: paths.terms, ...comingSoon('Условия обслуживания') },

      // Private routes requiring authentication
      {
        element: <RequireAuth />,
        children: [
          { path: paths.matchmaking, ...page(() => import('@/pages/MatchmakingPage')) },
          { path: paths.matches, ...page(() => import('@/pages/MatchesPage')) },
          { path: paths.match(), ...page(() => import('@/pages/MatchPage')) },
          { path: paths.settings, ...page(() => import('@/pages/SettingsPage')) },
        ],
      },
      { path: '*', ...page(() => import('@/pages/NotFoundPage')) },
    ],
  },
];

export const router = createBrowserRouter(routes);
