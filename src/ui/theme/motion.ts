export const motion = {
  fast: 150,
  base: 200,
  slow: 300,
  spring: { damping: 15, stiffness: 180, mass: 1 },
  springBouncy: { damping: 12, stiffness: 220, mass: 0.9 },
} as const;
