export interface MapItem {
  id: string;
  name: string;
  code: string;
  tag: string;
  badge: string;
  accent: string;
}

export const MAP_POOL: MapItem[] = [
  { id: 'mirage', name: 'Mirage', code: 'de_mirage', tag: 'Город', badge: 'MRG', accent: '#E67E22' },
  { id: 'dust2', name: 'Dust II', code: 'de_dust2', tag: 'Пустыня', badge: 'D2', accent: '#F39C12' },
  { id: 'inferno', name: 'Inferno', code: 'de_inferno', tag: 'Деревня', badge: 'INF', accent: '#E74C3C' },
  { id: 'nuke', name: 'Nuke', code: 'de_nuke', tag: 'АЭС', badge: 'NUK', accent: '#3498DB' },
  { id: 'train', name: 'Train', code: 'de_train', tag: 'Депо', badge: 'TRN', accent: '#95A5A6' },
  { id: 'cache', name: 'Cache', code: 'de_cache', tag: 'ЧАЭС', badge: 'CCH', accent: '#2ECC71' },
  { id: 'tuscan', name: 'Tuscan', code: 'de_tuscan', tag: 'Побережье', badge: 'TSC', accent: '#16A085' },
  { id: 'cbble', name: 'Cobblestone', code: 'de_cbble', tag: 'Замок', badge: 'CBL', accent: '#9B59B6' },
];
