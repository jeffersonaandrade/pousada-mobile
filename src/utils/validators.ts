/**
 * Utilitários de validação
 */

export const validarNumero = (valor: string): boolean => {
  const numero = parseFloat(valor);
  return !isNaN(numero) && isFinite(numero) && numero > 0;
};

export const validarPIN = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarNumero = (valor: number, casasDecimais: number = 2): string => {
  return valor.toFixed(casasDecimais).replace('.', ',');
};

/**
 * Aplica máscara de moeda brasileira (R$ 0,00) enquanto o usuário digita
 * @param valor - String com números digitados
 * @returns String formatada como "R$ 0,00"
 */
export const aplicarMascaraMoeda = (valor: string): string => {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, '');
  
  // Se não houver números, retorna vazio
  if (!apenasNumeros) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const valorNumerico = parseFloat(apenasNumeros) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

/**
 * Remove a máscara de moeda e retorna apenas o número
 * @param valorFormatado - String formatada como "R$ 0,00"
 * @returns Número (ex: 150.50)
 */
export const removerMascaraMoeda = (valorFormatado: string): number => {
  // Remove tudo que não é número ou ponto/vírgula
  const apenasNumeros = valorFormatado.replace(/[^\d,]/g, '').replace(',', '.');
  
  if (!apenasNumeros) return 0;
  
  return parseFloat(apenasNumeros);
};

