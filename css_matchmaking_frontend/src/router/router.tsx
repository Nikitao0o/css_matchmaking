import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import RequireAuth from '../auth/RequireAuth';
import MainLayout from '../layouts/MainLayout';
import ErrorPage from '../pages/ErrorPage';
import { paths } from './paths';

/** Code-split a page: `lazy(() => import('../pages/X'))` – pages are default exports. */
const page = (load: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

/** /players -> /players/<current user> */
function MyProfileRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to={paths.login} replace />;
  return <Navigate to={paths.player(user.player.name)} replace />;
}

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Welcome home screen (public)
      { path: paths.root, ...page(() => import('../pages/HomePage')) },
      { path: paths.home, ...page(() => import('../pages/HomePage')) },

      // Matchmaking lobby (public)
      { path: paths.matchmaking, ...page(() => import('../pages/MatchmakingPage')) },
      { path: paths.play, element: <Navigate to={paths.matchmaking} replace /> },

      // Public: log in / create account
      { path: paths.login, ...page(() => import('../pages/LoginPage')) },
      { path: paths.register, ...page(() => import('../pages/RegisterPage')) },

      // Public browsing
      { path: paths.matches, ...page(() => import('../pages/MatchesPage')) },
      { path: paths.match(), ...page(() => import('../pages/MatchPage')) },
      { path: paths.player(), ...page(() => import('../pages/ProfilePage')) },
      {
        path: paths.rankings,
        lazy: async () => {
          const { default: ComingSoonPage } = await import('../pages/ComingSoonPage');
          return { element: <ComingSoonPage title="Рейтинг игроков" /> };
        },
      },

      // Private routes requiring authentication
      {
        element: <RequireAuth />,
        children: [
          { path: paths.players, element: <MyProfileRedirect /> },
          {
            path: paths.settings,
            lazy: async () => {
              const { default: ComingSoonPage } = await import('../pages/ComingSoonPage');
              return { element: <ComingSoonPage title="Настройки" /> };
            },
          },
        ],
      },
      { path: '*', ...page(() => import('../pages/NotFoundPage')) },
    ],
  },
];

export const router = createBrowserRouter(routes);
