export const theme = {
  colors: {
    primary: '#2D5A27',      // Forest Green
    secondary: '#A8D5BA',    // Fresh Mint
    accent: '#FFD966',       // Warm Yellow
    background: '#F9F7F2',   // Soft Beige
    white: '#FFFFFF',
    text: {
      primary: '#2C2C2C',    // Deep Charcoal
      secondary: '#556B2F',  // Moss Gray
      disabled: '#A0A0A0',
    },
    error: '#E57373',        // Soft Coral
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 12,
    md: 20,
    lg: 32,
    full: 999,
  },
  shadows: {
    soft: {
      shadowColor: '#2D5A27',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

export type Theme = typeof theme;
