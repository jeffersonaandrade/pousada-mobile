import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { autenticarUsuario } from '../services/api';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { Role } from '../types';
import Button from '../components/Button';
import { getErrorMessage } from '../utils/errorHandler';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUsuario } = useAppStore();

  const adicionarDigito = (digito: string) => {
    // Validar que é um número
    if (!/^\d$/.test(digito)) {
      return;
    }
    if (pin.length < 4) {
      setPin(pin + digito);
    }
  };

  const removerDigito = () => {
    setPin(pin.slice(0, -1));
  };

  const limparPin = () => {
    setPin('');
  };

  const autenticar = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erro', 'Digite um PIN de 4 dígitos');
      return;
    }

    setLoading(true);
    try {
      const usuario = await autenticarUsuario(pin);
      setUsuario(usuario);
      Alert.alert('Sucesso', `Bem-vindo, ${usuario.nome}!`);
      
      // Redirecionar baseado no cargo (switch case)
      switch (usuario.cargo) {
        case Role.WAITER:
          // Garçom: vai para Menu/Pedidos
          navigation.navigate('Menu');
          break;
        
        case Role.MANAGER:
          // Gerente: vai para Menu/Pedidos (com poderes extras)
          navigation.navigate('Menu');
          break;
        
        case Role.CLEANER:
          // Camareira: vai para Governança
          navigation.navigate('Governance');
          break;
        
        case Role.ADMIN:
          // Admin: vai para Menu (acesso completo)
          navigation.navigate('Menu');
          break;
        
        default:
          // Perfil não suportado
          Alert.alert(
            'Perfil Não Suportado',
            'Seu perfil não tem acesso ao aplicativo mobile. Entre em contato com o administrador.',
            [
              {
                text: 'OK',
                onPress: () => {
                  limparPin();
                  navigation.goBack();
                },
              },
            ]
          );
          setUsuario(null);
          break;
      }
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
      limparPin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>👥</Text>
          </View>
          <Text style={styles.title}>Acesso da Equipe</Text>
          <Text style={styles.subtitle}>Digite seu PIN de 4 dígitos</Text>
        </View>

        {/* Display do PIN */}
        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                pin.length > index && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {/* Teclado numérico */}
        <View style={styles.keyboard}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => adicionarDigito(num.toString())}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.key, styles.keyAction]}
            onPress={removerDigito}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, styles.keyActionText]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={() => adicionarDigito('0')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.key, styles.keyAction]}
            onPress={limparPin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, styles.keyActionText]}>C</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de confirmar */}
        <Button
          title="Entrar"
          onPress={autenticar}
          disabled={loading || pin.length !== 4}
          loading={loading}
          variant="primary"
          size="large"
          fullWidth
        />
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 56,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  key: {
    width: 80,
    height: 80,
    backgroundColor: colors.background,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keyAction: {
    backgroundColor: colors.backgroundDark,
  },
  keyText: {
    ...typography.h2,
    color: colors.text,
  },
  keyActionText: {
    color: colors.textSecondary,
  },
});
