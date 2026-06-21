export const colors = {
  // Backgrounds (darkest → elevated)
  bg: '#0B0D10',
  surface: '#111318',
  elevated: '#171A21',

  // Semantic accents: you = your native side, partner = the target you learn
  you: '#8B5CF6',
  youSoft: 'rgba(139,92,246,0.16)',
  partner: '#22D3EE',
  partnerSoft: 'rgba(34,211,238,0.16)',

  // Status
  success: '#84CC16',
  successSoft: 'rgba(132,204,22,0.16)',
  warning: '#FB923C',
  warningSoft: 'rgba(251,146,60,0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  dangerBright: '#FF3B30', // solid vivid red for destructive buttons

  // Text
  text: '#FFFFFF',
  textSecondary: '#B8BDC7',
  textMuted: '#7A8190',

  // Lines / overlays
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  overlay: 'rgba(0,0,0,0.6)',
  glass: 'rgba(23,26,33,0.72)',
} as const;

export const gradients = {
  you: ['#8B5CF6', '#6D28D9'] as const,
  partner: ['#22D3EE', '#0891B2'] as const,
  duo: ['#8B5CF6', '#22D3EE'] as const,
  flame: ['#FB923C', '#F87171'] as const,
  success: ['#A3E635', '#65A30D'] as const,
};
