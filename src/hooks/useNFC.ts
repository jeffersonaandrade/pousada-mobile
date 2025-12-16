import { useState } from 'react';

/**
 * Hook simulado para leitura NFC
 * 
 * Para implementação real, instale: npm install react-native-nfc-manager
 * 
 * Exemplo de uso real:
 * 
 * import NfcManager, { NfcTech } from 'react-native-nfc-manager';
 * 
 * async function readNFC() {
 *   try {
 *     await NfcManager.start();
 *     await NfcManager.requestTechnology(NfcTech.Ndef);
 *     const tag = await NfcManager.getTag();
 *     return tag.id; // UID da pulseira
 *   } catch (ex) {
 *     console.warn('Erro ao ler NFC:', ex);
 *   } finally {
 *     NfcManager.cancelTechnologyRequest();
 *   }
 * }
 */

export function useNFC() {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Simula a leitura de uma pulseira NFC
   * Na implementação real, substituir por NfcManager
   */
  const lerPulseira = async (): Promise<string | null> => {
    setIsReading(true);
    setError(null);

    try {
      // SIMULAÇÃO: Aguarda 2 segundos e retorna um UID fictício
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // UID simulado (em produção, virá do chip NFC real)
      const uidSimulado = `NFC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      return uidSimulado;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ler pulseira';
      setError(errorMessage);
      return null;
    } finally {
      setIsReading(false);
    }
  };

  /**
   * Cancela a leitura NFC em andamento
   */
  const cancelarLeitura = () => {
    setIsReading(false);
    // Em produção: NfcManager.cancelTechnologyRequest();
  };

  return {
    lerPulseira,
    cancelarLeitura,
    isReading,
    error,
  };
}

/**
 * INSTRUÇÕES PARA IMPLEMENTAÇÃO REAL:
 * 
 * 1. Instalar a biblioteca:
 *    npm install react-native-nfc-manager
 * 
 * 2. Configurar permissões no Android (android/app/src/main/AndroidManifest.xml):
 *    <uses-permission android:name="android.permission.NFC" />
 *    <uses-feature android:name="android.hardware.nfc" android:required="false" />
 * 
 * 3. Configurar no iOS (ios/[AppName]/Info.plist):
 *    <key>NFCReaderUsageDescription</key>
 *    <string>Precisamos acessar o NFC para ler as pulseiras</string>
 * 
 * 4. Substituir a função lerPulseira() pela implementação real acima
 */
