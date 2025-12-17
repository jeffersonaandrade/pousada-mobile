import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_IP_KEY = 'API_IP'; // Chave padrão conforme especificação
const SERVER_IP_KEY_LEGACY = '@pousada:server_ip'; // Chave antiga para migração
const DEFAULT_IP = '192.168.0.88'; // IP padrão do .env (pode ser usado como fallback)

export interface ServerConfig {
  ip: string;
  apiUrl: string;
  socketUrl: string;
}

/**
 * Salva o IP do servidor no AsyncStorage
 * Usa a chave 'API_IP' conforme especificação
 */
export const saveServerIP = async (ip: string): Promise<void> => {
  try {
    // Remove espaços e valida formato básico
    const cleanIP = ip.trim();
    
    // Validação básica de IP
    if (!cleanIP || cleanIP.length === 0) {
      throw new Error('IP não pode estar vazio');
    }

    // Salva no AsyncStorage com a chave 'API_IP'
    await AsyncStorage.setItem('API_IP', cleanIP);
    console.log('✅ IP do servidor salvo (API_IP):', cleanIP);
  } catch (error) {
    console.error('❌ Erro ao salvar IP:', error);
    throw error;
  }
};

/**
 * Recupera o IP do servidor do AsyncStorage
 * Usa a chave 'API_IP' conforme especificação
 * Tenta migração da chave antiga se necessário
 */
export const getServerIP = async (): Promise<string | null> => {
  try {
    // Tenta chave padrão 'API_IP' primeiro
    let ip = await AsyncStorage.getItem('API_IP');
    
    // Se não encontrar, tenta chave antiga (migração)
    if (!ip) {
      ip = await AsyncStorage.getItem(SERVER_IP_KEY_LEGACY);
      // Se encontrar na chave antiga, migra para a nova
      if (ip) {
        await AsyncStorage.setItem('API_IP', ip);
        await AsyncStorage.removeItem(SERVER_IP_KEY_LEGACY);
        console.log('✅ IP migrado da chave antiga para API_IP');
      }
    }
    
    return ip;
  } catch (error) {
    console.error('❌ Erro ao recuperar IP:', error);
    return null;
  }
};

/**
 * Remove o IP salvo (útil para reset)
 */
export const clearServerIP = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('API_IP');
    console.log('✅ IP do servidor removido');
  } catch (error) {
    console.error('❌ Erro ao remover IP:', error);
    throw error;
  }
};

/**
 * Gera as URLs completas baseadas no IP
 */
export const getServerConfig = async (): Promise<ServerConfig | null> => {
  const ip = await getServerIP();
  
  if (!ip) {
    return null;
  }

  return {
    ip,
    apiUrl: `http://${ip}:3000/api`,
    socketUrl: `http://${ip}:3000`,
  };
};

/**
 * Gera as URLs completas baseadas no IP fornecido (sem salvar)
 */
export const buildServerConfig = (ip: string): ServerConfig => {
  const cleanIP = ip.trim();
  return {
    ip: cleanIP,
    apiUrl: `http://${cleanIP}:3000/api`,
    socketUrl: `http://${cleanIP}:3000`,
  };
};

