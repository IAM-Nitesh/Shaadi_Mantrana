export interface DesignTokens {
  colors: DesignTokensColors;
  typography: DesignTokensTypography;
  spacing: DesignTokensSpacing;
}

export interface DesignTokensColors {
  primary: string;
  secondary: string;
  neutral: string;
}

export interface DesignTokensTypography {
  fontSizes: string;
  fontWeights: string;
  lineHeights: string;
}

export interface DesignTokensSpacing {
  0: spacing;
  1: spacing;
  2: spacing;
  3: spacing;
  4: spacing;
  5: spacing;
  6: spacing;
  8: spacing;
  10: spacing;
  12: spacing;
  16: spacing;
  20: spacing;
  24: spacing;
  32: spacing;
}

export interface DesignTokens {
  borderRadius: DesignTokensBorderRadius;
}

export interface DesignTokensBorderRadius {
  none: borderRadius;
  sm: borderRadius;
  base: borderRadius;
  md: borderRadius;
  lg: borderRadius;
  xl: borderRadius;
  2xl: borderRadius;
  3xl: borderRadius;
  full: borderRadius;
}

export interface DesignTokens {
  shadows: DesignTokensShadows;
}

export interface DesignTokensShadows {
  xs: boxShadow;
  sm: boxShadow;
  md: boxShadow;
  lg: boxShadow;
  xl: boxShadow;
  2xl: boxShadow;
}

export interface DesignTokens {
}
