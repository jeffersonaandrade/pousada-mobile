import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { ModoApp } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { getServerIP, saveServerIP, buildServerConfig } from '../services/config';
import { updateApiBaseURL } from '../services/api';
import api from '../services/api';
import { socketService } from '../services/socket';
import ScreenWrapper from '../components/ScreenWrapper';

type ConfigScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Config'>;
};

export default function ConfigScreen({ navigation }: ConfigScreenProps) {
  const { setModo } = useAppStore();
  const [serverIP, setServerIP] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Carregar IP salvo ao montar o componente
  useEffect(() => {
    loadSavedIP();
  }, []);

  const loadSavedIP = async () => {
    try {
      const savedIP = await getServerIP();
      if (savedIP) {
        setServerIP(savedIP);
        // Configurar API e Socket com o IP salvo
        const config = buildServerConfig(savedIP);
        updateApiBaseURL(config.apiUrl);
        socketService.connect(config.socketUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar IP salvo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIP = async () => {
    const ip = serverIP.trim();
    
    if (!ip) {
      Alert.alert('Erro', 'Por favor, informe o IP do servidor');
      return;
    }

    // Validação básica de formato IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      Alert.alert('Erro', 'Formato de IP inválido. Use o formato: 192.168.0.88');
      return;
    }

    setIsTestingConnection(true);

    try {
      // Salvar IP no AsyncStorage (chave 'API_IP')
      await saveServerIP(ip);
      
      // Configurar Socket
      const config = buildServerConfig(ip);
      socketService.disconnect(); // Desconectar anterior se existir
      socketService.connect(config.socketUrl);
      
      // Testar conexão com a API (endpoint simples)
      try {
        // Tentar um endpoint que sempre existe para testar conexão
        // Usa /produtos com limit=1 para ser rápido
        await api.get('/produtos', { params: { limit: 1 } });
        
        setIsTestingConnection(false);
        Alert.alert(
          'Sucesso',
          'Servidor configurado e conectado com sucesso!',
          [{ text: 'OK' }]
        );
      } catch (apiError: any) {
        // Se a API retornar erro mas conseguir fazer requisição HTTP, considera sucesso
        // (pode ser 404 ou 500, mas significa que o servidor respondeu)
        if (apiError.response) {
          // Servidor respondeu (mesmo que com erro)
          setIsTestingConnection(false);
          Alert.alert(
            'Sucesso',
            'IP salvo e servidor acessível!',
            [{ text: 'OK' }]
          );
        } else if (apiError.request) {
          // Requisição foi feita mas não houve resposta (timeout ou rede)
          setIsTestingConnection(false);
          Alert.alert(
            'Aviso',
            'IP salvo, mas não foi possível conectar ao servidor agora.\n\nVerifique se o servidor está rodando e acessível.',
            [{ text: 'OK' }]
          );
        } else {
          // Erro de configuração (provavelmente IP não configurado)
          throw apiError;
        }
      }
    } catch (error: any) {
      setIsTestingConnection(false);
      const errorMessage = error?.message || 'Não foi possível conectar ao servidor';
      Alert.alert(
        'Erro de Conexão',
        `${errorMessage}\n\nVerifique se:\n- O IP está correto\n- O servidor está rodando\n- O dispositivo está na mesma rede`,
        [{ text: 'OK' }]
      );
      console.error('Erro ao testar conexão:', error);
    }
  };

  const selecionarModo = async (modo: ModoApp) => {
    // Verificar se tem IP configurado
    const ip = serverIP.trim();
    if (!ip) {
      Alert.alert(
        'Configuração Necessária',
        'Por favor, configure o IP do servidor antes de continuar.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Garantir que o IP está salvo e configurado
    try {
      const savedIP = await getServerIP();
      if (!savedIP || savedIP !== ip) {
        await saveServerIP(ip);
        const config = buildServerConfig(ip);
        updateApiBaseURL(config.apiUrl);
        socketService.connect(config.socketUrl);
      }
    } catch (error) {
      console.error('Erro ao configurar IP:', error);
    }

    setModo(modo);

    switch (modo) {
      case ModoApp.GARCOM:
        navigation.navigate('Login');
        break;
      case ModoApp.RECEPCAO:
        navigation.navigate('Recepcao');
        break;
      case ModoApp.KIOSK:
        navigation.navigate('KioskWelcome');
        break;
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentContainerStyle={styles.content}>
        {/* Logo/Header */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏨</Text>
          </View>
        </View>

        {/* Mensagem de boas-vindas */}
        <Text style={styles.title}>Seja bem-vindo!</Text>
        <Text style={styles.subtitle}>Configure o servidor e escolha o modo</Text>

        {/* Campo de configuração de IP */}
        <View style={styles.ipConfigContainer}>
          <Text style={styles.ipLabel}>IP do Servidor</Text>
          <View style={styles.ipInputContainer}>
            <TextInput
              style={styles.ipInput}
              placeholder="192.168.0.88"
              placeholderTextColor={colors.textSecondary}
              value={serverIP}
              onChangeText={setServerIP}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isTestingConnection}
            />
            <TouchableOpacity
              style={[styles.saveButton, isTestingConnection && styles.saveButtonDisabled]}
              onPress={handleSaveIP}
              disabled={isTestingConnection}
              activeOpacity={0.8}
            >
              {isTestingConnection ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.ipHint}>
            Digite o IP do servidor (ex: 192.168.0.88)
          </Text>
        </View>

        {/* Cards de opções - estilo Figma */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardRecepcao]}
            onPress={() => selecionarModo(ModoApp.RECEPCAO)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>📋</Text>
            </View>
            <Text style={styles.optionTitle}>Recepção</Text>
            <Text style={styles.optionDescription}>
              Check-in de hóspedes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardGarcom]}
            onPress={() => selecionarModo(ModoApp.GARCOM)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>👥</Text>
            </View>
            <Text style={styles.optionTitle}>Equipe</Text>
            <Text style={styles.optionDescription}>
              Acesso Staff
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardKiosk]}
            onPress={() => selecionarModo(ModoApp.KIOSK)}
            activeOpacity={0.8}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>🏪</Text>
            </View>
            <Text style={styles.optionTitle}>Kiosk</Text>
            <Text style={styles.optionDescription}>
              Autoatendimento
            </Text>
          </TouchableOpacity>
        </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing.xl, // Margem extra para garantir espaço quando o teclado aparecer
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    maxHeight: 120, // Limite máximo para telas grandes
    aspectRatio: 1, // Mantém proporção quadrada
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 56, // Reduzido de 64 para 56
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  ipConfigContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg, // Reduzido de xl para lg
    marginTop: spacing.sm, // Adiciona margem superior
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ipLabel: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ipInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ipInput: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: 'bold',
  },
  ipHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 12,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg, // Margem inferior para garantir espaço
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100, // Altura mínima ao invés de fixa
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardRecepcao: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  optionCardGarcom: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  optionCardKiosk: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  optionIcon: {
    width: 56,
    height: 56,
    minWidth: 56, // Garante tamanho mínimo
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconText: {
    fontSize: 28, // Reduzido de 32 para 28
  },
  optionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    flex: 1,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
