import { useState, useEffect } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Alert } from 'react-native';

/**
 * Hook para leitura NFC real (PRODUÇÃO)
 * 
 * Requer hardware NFC real. Não há fallback para mock.
 * Se o hardware não estiver disponível, retorna erro explícito.
 */
export function useNFC() {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNfcSupported, setIsNfcSupported] = useState<boolean>(false);

  // Verificar suporte NFC ao montar o componente
  useEffect(() => {

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
        } else {
          setError('Hardware NFC não disponível neste dispositivo.');
        }
      } catch (err) {
        console.error('Erro ao verificar suporte NFC:', err);
        setError('Erro ao verificar suporte NFC no dispositivo.');
      }
    };

    checkNfcSupport();

    // Limpa ao desmontar
    return () => {
      // Cleanup: garantir que NFC seja cancelado ao desmontar
      NfcManager.cancelTechnologyRequest().catch(() => {
        // Ignorar erros no cleanup
      });
    };
  }, []);

  /**
   * Lê a pulseira NFC usando hardware real
   * 
   * @throws {Error} Se hardware NFC não estiver disponível
   * @returns {Promise<string | null>} UID da pulseira ou null se cancelado pelo usuário
   */
  const lerPulseira = async (): Promise<string | null> => {
    setIsReading(true);
    setError(null);

    // Se não suportado, retornar erro explícito
    if (!isNfcSupported) {
      const errorMsg = 'Hardware NFC não disponível neste dispositivo. Este aplicativo requer um dispositivo com suporte a NFC.';
      setError(errorMsg);
      setIsReading(false);
      Alert.alert(
        'NFC Não Disponível',
        errorMsg,
        [{ text: 'OK' }]
      );
      return null;
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
      // tag.id pode ser string[] ou number[], então normalizamos para number[]
      // const idArray = Array.isArray(tag.id) ? tag.id : [];
      // console.log(idArray);
      const uid = tag.id
      // const uid = idArray
      //   .map((byte: number | string) => {
      //     const numByte = typeof byte === 'string' ? parseInt(byte, 16) : byte;
      //     return numByte.toString(16).padStart(2, '0');
      //   })
      //   .join('')
      //   .toUpperCase();

      console.log('NFC lido com sucesso. UID:', uid);
      return uid;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ler pulseira';
      console.log(err)
      // if (errorMessage === "") {
      //   console.log('Leitura NFC voltada pelo usuário');
      //   return 'Leitor desconectado';
      // }
      
      // Se for cancelamento do usuário, não tratar como erro
      if (
        errorMessage === "" ||
        errorMessage.includes('cancelled') || 
        errorMessage.includes('cancel') ||
        errorMessage.includes('User cancelled')
      ) {
        Alert.alert(
          '',
          'Leitura NFC cancelada pelo usuário',
          [{ text: 'OK' }]
        );
        console.log('Leitura NFC cancelada pelo usuário');
        return 'Cancel';
      }

      // Erro real - não usar mock, retornar erro explícito
      console.error('Erro ao ler NFC:', errorMessage);
      setError(errorMessage);
      
      Alert.alert(
        'Erro na Leitura NFC',
        `Não foi possível ler a pulseira: ${errorMessage}\n\nVerifique se:\n- O NFC está ativado no dispositivo\n- A pulseira está próxima ao sensor\n- O dispositivo suporta NFC`,
        [{ text: 'OK' }]
      );
      
      return null;
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
