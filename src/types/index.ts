export enum TipoCliente {
  HOSPEDE = 'HOSPEDE',
  DAY_USE = 'DAY_USE',
  VIP = 'VIP',
}

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  PREPARANDO = 'PREPARANDO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export enum Role {
  WAITER = 'WAITER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  CLEANER = 'CLEANER',
}

export enum ModoApp {
  RECEPCAO = 'RECEPCAO',
  GARCOM = 'GARCOM',
  KIOSK = 'KIOSK',
}

export enum MetodoPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
}

export enum StatusQuarto {
  LIVRE = 'LIVRE',
  OCUPADO = 'OCUPADO',
  LIMPEZA = 'LIMPEZA',
  MANUTENCAO = 'MANUTENCAO',
}

export interface Quarto {
  id: number;
  numero: string;
  status: StatusQuarto;
  hospedeAtual?: {
    id: number;
    nome: string;
  } | null;
}

export interface Usuario {
  id: number;
  nome: string;
  pin: string;
  cargo: Role;
  ativo: boolean;
}

export interface Hospede {
  id: number;
  tipo: TipoCliente;
  nome: string;
  email?: string;
  documento?: string;
  quarto?: string;
  uidPulseira: string;
  limiteGasto?: number;
  dividaAtual: number;
  entrada?: number; // Valor da diária/entrada pago no check-in
  ativo: boolean;
  pedidos?: Pedido[];
}

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
  foto?: string;
  categoria?: string;
  descricao?: string;
  setor?: string; // "COZINHA", "BAR_PISCINA", "BOATE"
  visivelCardapio?: boolean; // Se true, aparece no cardápio para venda
}

export interface Pedido {
  id: number;
  hospedeId: number;
  produtoId: number;
  status: StatusPedido;
  valor: number;
  data: string;
  hospede?: Hospede;
  produto?: Produto;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
