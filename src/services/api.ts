import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import {
  ApiResponse,
  Hospede,
  Pedido,
  Produto,
  Usuario,
  TipoCliente,
  StatusPedido,
  Quarto,
  StatusQuarto,
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Atualiza a baseURL da API dinamicamente
 * Usado quando o IP do servidor é configurado pelo usuário
 */
export const updateApiBaseURL = (newBaseURL: string): void => {
  api.defaults.baseURL = newBaseURL;
  console.log('✅ API Base URL atualizada para:', newBaseURL);
};

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Log detalhado apenas em desenvolvimento
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Adiciona informações úteis ao erro
    if (error.response) {
      // Erro com resposta do servidor
      error.status = error.response.status;
      error.statusText = error.response.statusText;
    } else if (error.request) {
      // Erro de rede (sem resposta)
      error.isNetworkError = true;
    }

    return Promise.reject(error);
  }
);

// === USUÁRIOS ===
export const autenticarUsuario = async (pin: string): Promise<Usuario> => {
  const response = await api.post<ApiResponse<Usuario>>('/usuarios/auth', { pin });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao autenticar');
  }
  return response.data.data;
};

// === HÓSPEDES ===
export const buscarHospedePorPulseira = async (uid: string): Promise<Hospede> => {
  const response = await api.get<ApiResponse<Hospede>>(`/hospedes/pulseira/${uid}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Pulseira não encontrada');
  }
  return response.data.data;
};

// Buscar hóspede por quarto - usando GET /api/hospedes com filtro
// Nota: A documentação não especifica endpoint específico, então usamos o endpoint geral
export const buscarHospedePorQuarto = async (quarto: string): Promise<Hospede> => {
  // Buscar todos os hóspedes ativos e filtrar por quarto no frontend
  // OU usar busca se o backend implementar endpoint específico
  const response = await api.get<ApiResponse<Hospede[]>>(`/hospedes`, {
    params: { ativo: 'true' },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar hóspedes');
  }
  
  const hospede = response.data.data.find((h: Hospede) => h.quarto === quarto && h.ativo);
  if (!hospede) {
    throw new Error('Hóspede não encontrado para este quarto');
  }
  return hospede;
};

// Buscar hóspede por nome - usando GET /api/hospedes com filtro
// Nota: A documentação não especifica endpoint específico, então usamos o endpoint geral
export const buscarHospedePorNome = async (nome: string): Promise<Hospede[]> => {
  // Buscar todos os hóspedes ativos e filtrar por nome no frontend
  // OU usar busca se o backend implementar endpoint específico
  const response = await api.get<ApiResponse<Hospede[]>>(`/hospedes`, {
    params: { ativo: 'true' },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar hóspedes');
  }
  
  const nomeLower = nome.toLowerCase().trim();
  const hospedes = response.data.data.filter(
    (h: Hospede) => h.ativo && h.nome.toLowerCase().includes(nomeLower)
  );
  return hospedes;
};

export const criarHospede = async (data: {
  tipo: TipoCliente;
  nome: string;
  email?: string;
  documento?: string;
  quarto?: string; // Número do quarto (string) - compatibilidade
  quartoId?: number; // ID do quarto (número) - obrigatório para HOSPEDE
  uidPulseira: string;
  limiteGasto?: number;
  valorEntrada?: number; // Valor da diária/entrada pago no check-in
  pagoNaEntrada?: boolean; // Se o pagamento foi feito na entrada
  metodoPagamento?: string; // Método de pagamento: 'DINHEIRO', 'PIX', 'CREDITO', 'DEBITO'
}): Promise<Hospede> => {
  const response = await api.post<ApiResponse<Hospede>>('/hospedes', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar hóspede');
  }
  return response.data.data;
};

export const realizarCheckout = async (hospedeId: number): Promise<Hospede> => {
  const response = await api.patch<ApiResponse<Hospede>>(`/hospedes/${hospedeId}/checkout`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao realizar checkout');
  }
  return response.data.data;
};

// Endpoint administrativo - não usado no frontend de pedidos
// export const listarHospedes = async (ativo?: boolean): Promise<Hospede[]> => {
//   const params = ativo !== undefined ? { ativo: ativo.toString() } : {};
//   const response = await api.get<ApiResponse<Hospede[]>>('/hospedes', { params });
//   if (!response.data.success || !response.data.data) {
//     throw new Error(response.data.error || 'Erro ao listar hóspedes');
//   }
//   return response.data.data;
// };

// === PRODUTOS ===
export const listarProdutos = async (categoria?: string, apenasDisponiveis?: boolean): Promise<Produto[]> => {
  const params: Record<string, string> = {};
  if (categoria) {
    params.categoria = categoria;
  }
  if (apenasDisponiveis) {
    params.apenasDisponiveis = 'true';
  }
  const response = await api.get<ApiResponse<Produto[]>>('/produtos', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao listar produtos');
  }
  return response.data.data;
};

// === PEDIDOS ===
/**
 * Criar pedidos (múltiplos itens em uma única requisição)
 * Formato esperado pelo backend conforme documentação:
 * - Cenário A (NFC): { items: [{ produtoId, quantidade }], uidPulseira: "..." }
 * - Cenário B (Manual): { items: [{ produtoId, quantidade }], hospedeId: 1, managerPin: "5678" }
 */
export const criarPedidos = async (
  items: Array<{ produtoId: number; quantidade: number }>,
  options: {
    uidPulseira?: string;
    hospedeId?: number;
    managerPin?: string;
    pinGarcom?: string;
    usuarioId?: number;
  }
): Promise<Pedido[]> => {
  // Configurar headers baseado no tipo de autenticação
  const headers: Record<string, string> = {};
  
  if (options.pinGarcom) {
    // Modo Garçom: envia PIN no header
    headers['X-User-Pin'] = options.pinGarcom;
  }
  
  // Body do pedido conforme documentação do backend
  const body: {
    items: Array<{ produtoId: number; quantidade: number }>;
    uidPulseira?: string;
    hospedeId?: number;
    managerPin?: string;
    usuarioId?: number;
  } = {
    items,
  };
  
  // Cenário A (NFC): envia uidPulseira
  if (options.uidPulseira) {
    body.uidPulseira = options.uidPulseira;
  }
  
  // Cenário B (Manual): envia hospedeId e managerPin
  if (options.hospedeId) {
    body.hospedeId = options.hospedeId;
  }

  if (options.managerPin) {
    body.managerPin = options.managerPin;
  }

  // Adicionar usuarioId se fornecido (para rastrear qual garçom criou o pedido)
  if (options.usuarioId) {
    body.usuarioId = options.usuarioId;
  }
  
  const response = await api.post<ApiResponse<Pedido[]> & { count?: number }>('/pedidos', body, {
    headers,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar pedidos');
  }
  return response.data.data;
};

// Função legada mantida para compatibilidade (não recomendada, usar criarPedidos)
export const criarPedido = async (
  hospedeId: number | undefined,
  produtoId: number,
  uidPulseira?: string,
  pinGarcom?: string,
  quarto?: string,
  managerPin?: string
): Promise<Pedido> => {
  // Usar a nova função criarPedidos internamente
  const pedidos = await criarPedidos(
    [{ produtoId, quantidade: 1 }],
    {
      hospedeId,
      uidPulseira,
      managerPin,
      pinGarcom,
    }
  );
  return pedidos[0];
};

// Buscar pedidos de um hóspede específico (para impressão de resumo)
export const buscarPedidosPorHospede = async (hospedeId: number): Promise<Pedido[]> => {
  const response = await api.get<ApiResponse<Pedido[]>>('/pedidos', {
    params: { hospedeId: hospedeId.toString() },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar pedidos do hóspede');
  }
  return response.data.data;
};

// Listar pedidos (com filtros opcionais)
export const listarPedidos = async (params?: {
  status?: StatusPedido;
  hospedeId?: number;
  usuarioId?: number;
  recente?: boolean;
  page?: number;
  limit?: number;
}): Promise<Pedido[]> => {
  const queryParams: Record<string, string> = {};
  
  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.hospedeId) {
    queryParams.hospedeId = params.hospedeId.toString();
  }
  if (params?.usuarioId) {
    queryParams.usuarioId = params.usuarioId.toString();
  }
  if (params?.recente !== undefined) {
    queryParams.recente = params.recente.toString();
  }
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  if (params?.limit) {
    queryParams.limit = params.limit.toString();
  }

  const response = await api.get<ApiResponse<Pedido[]>>('/pedidos', {
    params: queryParams,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao listar pedidos');
  }
  return response.data.data;
};

// Cancelar pedido (requer PIN de gerente)
export const cancelarPedido = async (pedidoId: number, managerPin: string): Promise<Pedido> => {
  const response = await api.delete<ApiResponse<Pedido>>(`/pedidos/${pedidoId}`, {
    data: { managerPin },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao cancelar pedido');
  }
  return response.data.data;
};

// Endpoints administrativos - não usados no frontend de pedidos
// export const listarPedidos = async (status?: StatusPedido): Promise<Pedido[]> => {
//   const params = status ? { status } : {};
//   const response = await api.get<ApiResponse<Pedido[]>>('/pedidos', { params });
//   if (!response.data.success || !response.data.data) {
//     throw new Error(response.data.error || 'Erro ao listar pedidos');
//   }
//   return response.data.data;
// };

// export const atualizarStatusPedido = async (
//   id: number,
//   status: StatusPedido
// ): Promise<Pedido> => {
//   const response = await api.patch<ApiResponse<Pedido>>(`/pedidos/${id}/status`, {
//     status,
//   });
//   if (!response.data.success || !response.data.data) {
//     throw new Error(response.data.error || 'Erro ao atualizar pedido');
//   }
//   return response.data.data;
// };

// === QUARTOS ===
export const buscarQuartos = async (): Promise<Quarto[]> => {
  const response = await api.get<ApiResponse<Quarto[]>>('/quartos');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar quartos');
  }
  return response.data.data;
};

export const atualizarStatusQuarto = async (
  quartoId: number,
  status: StatusQuarto
): Promise<Quarto> => {
  const response = await api.patch<ApiResponse<Quarto>>(`/quartos/${quartoId}/status`, {
    status,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao atualizar status do quarto');
  }
  return response.data.data;
};
