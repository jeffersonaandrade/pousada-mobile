// Sistema de cores profissional baseado no design do Figma
export const colors = {
  // Cores primárias (vermelho profissional - tom mais escuro e elegante)
  primary: '#DC2626',      // Vermelho profissional (mais escuro que o laranja)
  primaryDark: '#B91C1C',
  primaryLight: '#EF4444',
  
  secondary: '#F59E0B',    // Amarelo/dourado profissional (tom mais sóbrio)
  secondaryDark: '#D97706',
  secondaryLight: '#FBBF24',
  
  // Cores neutras
  background: '#FFFFFF',
  backgroundLight: '#F8F9FA',
  backgroundDark: '#F5F5F5',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  // Cores de status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Cores de borda
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Cores de sombra
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

