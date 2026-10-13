/** Dark, high-contrast theme for a competitive matchmaking interface. */
const theme = {
	colors: {
		background: "#111214",
		surface: "#1B1D20",
		surfaceRaised: "#24272B",
		surfaceHover: "#2D3035",
		border: "#383B40",
		text: "#F5F5F5",
		textMuted: "#A3A7AD",
		primary: "#FF5500",
		primaryHover: "#E64D00",
		success: "#35C46A",
		warning: "#F5B942",
		danger: "#F04444",
	},
	typography: {
		fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
		headingWeight: 700,
		bodyWeight: 400,
	},
	radius: {
		small: "4px",
		medium: "8px",
		large: "12px",
		pill: "999px",
	},
	spacing: {
		xs: "4px",
		sm: "8px",
		md: "16px",
		lg: "24px",
		xl: "32px",
	},
	shadow: {
		card: "0 8px 24px rgba(0, 0, 0, 0.28)",
		focus: "0 0 0 3px rgba(255, 85, 0, 0.28)",
	},
} as const;

export type Theme = typeof theme;
export default theme;
