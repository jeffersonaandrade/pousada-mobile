import { useState, useEffect } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

/**
 * Hook para leitura NFC real com fallback para mock
 * 
 * Prioriza hardware NFC real quando disponível.
 * Usa simulação apenas quando hardware não está disponível.
 */
export function useNFC() {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);

  // Verificar suporte NFC ao montar o componente
  useEffect(() => {
    checkNfcSupport();
    return () => {
      // Cleanup: garantir que NFC seja cancelado ao desmontar
      NfcManager.cancelTechnologyRequest().catch(() => {
        // Ignorar erros no cleanup
      });
    };
  }, []);

  /**
   * Verifica se o dispositivo suporta NFC
   */
  const checkNfcSupport = async () => {
    try {
      const supported = await NfcManager.isSupported();
      setIsNfcSupported(supported);
      
      if (supported) {
        // Inicializar NFC Manager se suportado
        await NfcManager.start();
      }
    } catch (err) {
      console.warn('Erro ao verificar suporte NFC:', err);
      setIsNfcSupported(false);
    }
  };

  /**
   * Lê a pulseira NFC usando hardware real ou mock
   */
  const lerPulseira = async (): Promise<string | null> => {
    setIsReading(true);
    setError(null);

    // Verificar suporte NFC se ainda não foi verificado
    if (isNfcSupported === null) {
      await checkNfcSupport();
    }

    // Se não suportado, usar mock
    if (isNfcSupported === false) {
      console.log('Hardware NFC não detectado. Usando Mock.');
      return simularLeituraMock();
    }

    // Tentar leitura real
    try {
      // Solicitar tecnologia NFC
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Aproxime a pulseira do dispositivo',
      });

      // Obter tag NFC
      const tag = await NfcManager.getTag();
      
      if (!tag || !tag.id) {
        throw new Error('Tag NFC inválida ou sem UID');
      }

      // Converter UID de array de bytes para string hexadecimal
      const uid = Array.from(tag.id)
        .map((byte: number) => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      console.log('NFC lido com sucesso. UID:', uid);
      return uid;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ler pulseira';
      
      // Se for cancelamento do usuário, não tratar como erro
      if (errorMessage.includes('cancelled') || errorMessage.includes('cancel')) {
        console.log('Leitura NFC cancelada pelo usuário');
        return null;
      }

      console.warn('Erro ao ler NFC real, usando mock:', errorMessage);
      setError(errorMessage);
      
      // Fallback para mock em caso de erro
      return simularLeituraMock();
    } finally {
      // SEMPRE cancelar a requisição de tecnologia para não travar o leitor
      try {
        await NfcManager.cancelTechnologyRequest().catch(() => {
          // Ignorar erros no cancelamento
        });
      } catch (err) {
        // Ignorar erros no cancelamento
      }
      setIsReading(false);
    }
  };

  /**
   * Simula a leitura de uma pulseira NFC (fallback)
   */
  const simularLeituraMock = async (): Promise<string | null> => {
    try {
      // Simula delay de leitura
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // UID simulado (em produção, virá do chip NFC real)
      const uidSimulado = `NFC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      console.log('NFC Mock: UID simulado gerado:', uidSimulado);
      return uidSimulado;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao simular leitura NFC';
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Cancela a leitura NFC em andamento
   */
  const cancelarLeitura = async () => {
    try {
      if (isNfcSupported) {
        await NfcManager.cancelTechnologyRequest().catch(() => {
          // Ignorar erros no cancelamento
        });
      }
    } catch (err) {
      // Ignorar erros no cancelamento
    } finally {
      setIsReading(false);
      setError(null);
    }
  };

  return {
    lerPulseira,
    cancelarLeitura,
    isReading,
    error,
    isNfcSupported,
  };
}
