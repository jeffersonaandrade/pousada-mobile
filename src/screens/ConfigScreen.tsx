import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
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
import { socketService } from '../services/socket';

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
      // Salvar IP
      await saveServerIP(ip);
      
      // Configurar API e Socket
      const config = buildServerConfig(ip);
      updateApiBaseURL(config.apiUrl);
      
      // Tentar conectar ao Socket para testar
      socketService.disconnect(); // Desconectar anterior se existir
      const socket = socketService.connect(config.socketUrl);
      
      // Aguardar um pouco para ver se conecta
      setTimeout(() => {
        setIsTestingConnection(false);
        if (socket.connected) {
          Alert.alert('Sucesso', 'Servidor configurado e conectado com sucesso!');
        } else {
          Alert.alert(
            'Aviso',
            'IP salvo, mas não foi possível conectar agora. Verifique se o servidor está rodando.',
            [{ text: 'OK' }]
          );
        }
      }, 2000);
    } catch (error) {
      setIsTestingConnection(false);
      Alert.alert('Erro', 'Não foi possível salvar o IP. Tente novamente.');
      console.error('Erro ao salvar IP:', error);
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
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 64,
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
    marginBottom: spacing.xl,
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
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconText: {
    fontSize: 32,
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
