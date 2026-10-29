import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export interface KeyValue {
  label: string;
  value: ReactNode;
}

export default function KeyValueList({ items }: { items: KeyValue[] }) {
  return (
    <Box sx={{ p: 2, display: 'grid', rowGap: 1.5 }}>
      {items.map((it) => (
        <Box key={it.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: 13 }}>
          <Box sx={{ color: 'text.disabled' }}>{it.label}</Box>
          <Box sx={{ fontWeight: 600, textAlign: 'right' }}>{it.value}</Box>
        </Box>
      ))}
    </Box>
  );
}
