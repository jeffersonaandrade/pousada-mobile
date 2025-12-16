// Configuração da API via variáveis de ambiente
import {
  API_BASE_URL as ENV_API_BASE_URL,
  SOCKET_URL as ENV_SOCKET_URL,
  API_TIMEOUT as ENV_API_TIMEOUT,
  SOCKET_RECONNECTION_DELAY as ENV_SOCKET_RECONNECTION_DELAY,
  SOCKET_RECONNECTION_ATTEMPTS as ENV_SOCKET_RECONNECTION_ATTEMPTS,
} from '@env';

// Exportar URLs diretamente
export const API_BASE_URL = ENV_API_BASE_URL;
export const SOCKET_URL = ENV_SOCKET_URL;

// Converter timeouts e números de string para number
export const API_TIMEOUT = parseInt(ENV_API_TIMEOUT || '10000', 10);
export const SOCKET_RECONNECTION_DELAY = parseInt(
  ENV_SOCKET_RECONNECTION_DELAY || '1000',
  10
);
export const SOCKET_RECONNECTION_ATTEMPTS = parseInt(
  ENV_SOCKET_RECONNECTION_ATTEMPTS || '5',
  10
);
