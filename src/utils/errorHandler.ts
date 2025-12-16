/**
 * Utilitário para tratamento de erros com mensagens amigáveis
 */

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    // Mensagens de erro mais amigáveis
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'Recurso não encontrado.';
    }
    
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Acesso não autorizado. Verifique suas credenciais.';
    }
    
    if (message.includes('403') || message.includes('forbidden')) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    
    if (message.includes('500') || message.includes('server')) {
      return 'Erro no servidor. Tente novamente em alguns instantes.';
    }
    
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
};

export const isNetworkError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('network') || 
         message.includes('timeout') || 
         message.includes('connection') ||
         error?.code === 'ECONNABORTED' ||
         error?.code === 'ERR_NETWORK';
};

