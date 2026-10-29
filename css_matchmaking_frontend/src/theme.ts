import { createTheme } from '@mui/material/styles';

/** FACEIT-inspired dark & orange design tokens */
export const colors = {
  page: '#0E0E10',              // Deep matte carbon/black
  header: '#141416',            // Top navigation bar
  panel: '#18181B',             // Cards and panels (Zinc-900)
  surfaceRaised: '#222226',     // Elevated / hover surfaces
  border: '#27272D',            // Subtle dark borders
  borderHover: '#3F3F46',       // Border on hover
  selected: 'rgba(255, 85, 0, 0.12)', // Orange-tinted selection
  selectedBorder: 'rgba(255, 85, 0, 0.45)',
  text: '#F4F4F6',              // Crisp white
  textSecondary: '#A1A1AA',     // Zinc-400
  muted: '#71717A',             // Zinc-500
  primary: '#FF5500',           // Iconic FACEIT Orange
  primaryHover: '#FF6B1A',      // Slightly brighter on hover
  primaryActive: '#E04B00',     // Pressed orange
  success: '#22C55E',           // Win/Operational green
  danger: '#EF4444',            // Loss/Error red
  warning: '#F59E0B',           // Amber warning
} as const;

export const PAGE_MAX_WIDTH = 1232; // 1184 content + 2 * 24 gutter

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: colors.primaryHover,
      dark: colors.primaryActive,
      contrastText: '#FFFFFF',
    },
    success: { main: colors.success },
    error: { main: colors.danger },
    warning: { main: colors.warning },
    background: { default: colors.page, paper: colors.panel },
    text: { primary: colors.text, secondary: colors.textSecondary, disabled: colors.muted },
    divider: colors.border,
  },
  shape: { borderRadius: 3 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    h1: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text },
    h2: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: colors.text },
    h3: { fontSize: 14, fontWeight: 600, color: colors.text },
    body1: { fontSize: 14 },
    body2: { fontSize: 13 },
    caption: { fontSize: 12, color: colors.muted },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.page,
          color: colors.text,
          scrollbarColor: '#2D2D35 #0E0E10',
        },
        a: { color: 'inherit' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 3,
          minHeight: 34,
          fontWeight: 600,
          transition: 'all 0.15s ease-in-out',
        },
        sizeLarge: { minHeight: 44, fontSize: 14, fontWeight: 700 },
        contained: {
          backgroundColor: colors.primary,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: colors.primaryHover,
            boxShadow: '0 4px 14px rgba(255, 85, 0, 0.35)',
          },
          '&:active': {
            backgroundColor: colors.primaryActive,
          },
        },
        outlined: {
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: colors.primary,
            color: colors.primary,
            backgroundColor: 'rgba(255, 85, 0, 0.08)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#121215',
          borderRadius: 3,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
            borderWidth: 1.5,
          },
        },
        input: { padding: '12px 14px', fontSize: 13, '&::placeholder': { color: colors.muted, opacity: 1 } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontWeight: 600,
          color: colors.muted,
          '&.Mui-selected': { color: colors.primary },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { backgroundColor: colors.primary, height: 2 },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: {
          color: colors.primary,
          '&:hover': { color: colors.primaryHover },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: colors.borderHover,
          padding: 4,
          '&.Mui-checked': { color: colors.primary },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised },
        bar: { backgroundColor: colors.primary, borderRadius: 2 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: colors.panel },
      },
    },
  },
});

export default theme;
