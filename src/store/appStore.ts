import { create } from 'zustand';
import { ModoApp, Usuario, Hospede, Produto } from '../types';

interface AppState {
  // Configuração do app
  modo: ModoApp | null;
  setModo: (modo: ModoApp) => void;

  // Usuário logado (para modo Garçom)
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;

  // Hóspede selecionado
  hospedeSelecionado: Hospede | null;
  setHospedeSelecionado: (hospede: Hospede | null) => void;

  // Carrinho de produtos (para modo Garçom/Kiosk)
  carrinho: Array<{ produto: Produto; quantidade: number }>;
  adicionarAoCarrinho: (produto: Produto) => void;
  removerDoCarrinho: (produtoId: number) => void;
  incrementarItem: (produtoId: number) => void;
  decrementarItem: (produtoId: number) => void;
  limparCarrinho: () => void;

  // Reset completo
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Estado inicial
  modo: null,
  usuario: null,
  hospedeSelecionado: null,
  carrinho: [],

  // Actions
  setModo: (modo) => set({ modo }),
  
  setUsuario: (usuario) => set({ usuario }),
  
  setHospedeSelecionado: (hospede) => set({ hospedeSelecionado: hospede }),
  
  adicionarAoCarrinho: (produto) =>
    set((state) => {
      const itemExistente = state.carrinho.find(
        (item) => item.produto.id === produto.id
      );

      if (itemExistente) {
        return {
          carrinho: state.carrinho.map((item) =>
            item.produto.id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          ),
        };
      }

      return {
        carrinho: [...state.carrinho, { produto, quantidade: 1 }],
      };
    }),
  
  removerDoCarrinho: (produtoId) =>
    set((state) => ({
      carrinho: state.carrinho.filter((item) => item.produto.id !== produtoId),
    })),
  
  incrementarItem: (produtoId) =>
    set((state) => {
      const item = state.carrinho.find((item) => item.produto.id === produtoId);
      if (!item) return state;

      // Verificar estoque antes de incrementar
      if (item.quantidade >= item.produto.estoque) {
        return state; // Não incrementa se já está no limite do estoque
      }

      return {
        carrinho: state.carrinho.map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        ),
      };
    }),

  decrementarItem: (produtoId) =>
    set((state) => {
      const item = state.carrinho.find((item) => item.produto.id === produtoId);
      if (!item) return state;

      // Travar em 1 - não permite diminuir abaixo de 1
      if (item.quantidade <= 1) {
        return state;
      }

      return {
        carrinho: state.carrinho.map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        ),
      };
    }),
  
  limparCarrinho: () => set({ carrinho: [] }),
  
  reset: () =>
    set({
      modo: null,
      usuario: null,
      hospedeSelecionado: null,
      carrinho: [],
    }),
}));
