import Box from '@mui/material/Box';
import { colors } from '../theme';

interface Props {
  values: number[];
  labels: string[];
  min?: number;
  max?: number;
  ticks?: number[];
}

const W = 840;
const H = 170;
const PAD = { l: 54, r: 8, t: 12, b: 28 };

/** Dependency-free SVG line chart that scales with its container. */
export default function RatingChart({ values, labels, min = 1700, max = 1900, ticks = [1700, 1800, 1900] }: Props) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + innerH - ((v - min) / (max - min)) * innerH;
  const x = (i: number) => PAD.l + (i / Math.max(values.length - 1, 1)) * innerW;

  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPoints = `${points} ${PAD.l + innerW},${H - PAD.b} ${PAD.l},${H - PAD.b}`;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="ELO rating history"
      sx={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} />
          <text x={0} y={y(t) + 4} fill={colors.muted} fontSize={11}>
            {t.toLocaleString('en-US')}
          </text>
        </g>
      ))}
      <polygon points={areaPoints} fill="url(#eloGradient)" />
      <polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {labels.map((l, i) => {
        const px = PAD.l + (i / (labels.length - 1)) * innerW;
        const anchor = i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle';
        return (
          <text key={l} x={px} y={H - 6} fill={colors.muted} fontSize={11} textAnchor={anchor}>
            {l}
          </text>
        );
      })}
    </Box>
  );
}
