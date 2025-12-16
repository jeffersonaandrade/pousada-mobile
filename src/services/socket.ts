import { io, Socket } from 'socket.io-client';
import {
  SOCKET_URL,
  SOCKET_RECONNECTION_DELAY,
  SOCKET_RECONNECTION_ATTEMPTS,
} from '../config/api';
import { Pedido } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private currentSocketUrl: string = SOCKET_URL;

  /**
   * Conecta ao Socket.io com a URL fornecida
   * Se não fornecida, usa a URL padrão do .env
   */
  connect(socketUrl?: string): Socket {
    const urlToUse = socketUrl || SOCKET_URL;
    
    // Se já existe uma conexão com a mesma URL, retorna ela
    if (this.socket && this.currentSocketUrl === urlToUse && this.socket.connected) {
      return this.socket;
    }

    // Se existe conexão diferente, desconecta primeiro
    if (this.socket) {
      this.disconnect();
    }

    // Cria nova conexão
    this.currentSocketUrl = urlToUse;
    this.socket = io(urlToUse, {
      transports: ['polling', 'websocket'], // IMPORTANTE: polling primeiro para React Native
      reconnection: true,
      reconnectionDelay: SOCKET_RECONNECTION_DELAY,
      reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPTS,
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao Socket.io:', this.socket?.id);
      console.log('📍 URL:', urlToUse);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message);
      console.error('Verifique se:');
      console.error('1. O servidor está rodando');
      console.error('2. O IP está correto:', urlToUse);
      console.error('3. O dispositivo está na mesma rede');
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentSocketUrl = SOCKET_URL;
    }
  }

  // Eventos do backend
  onNovoPedido(callback: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.on('novo_pedido', callback);
    }
  }

  onPedidoAtualizado(callback: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.on('pedido_atualizado', callback);
    }
  }

  onPedidoCancelado(callback: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.on('pedido_cancelado', callback);
    }
  }

  // Remover listeners
  offNovoPedido(callback?: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.off('novo_pedido', callback);
    }
  }

  offPedidoAtualizado(callback?: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.off('pedido_atualizado', callback);
    }
  }

  offPedidoCancelado(callback?: (pedido: Pedido) => void): void {
    if (this.socket) {
      this.socket.off('pedido_cancelado', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

