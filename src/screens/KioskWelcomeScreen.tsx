import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from '../components/Button';
import SecureExitButton from '../components/SecureExitButton';

type KioskWelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KioskWelcome'>;
};

export default function KioskWelcomeScreen({ navigation }: KioskWelcomeScreenProps) {
  const handleContinuar = () => {
    navigation.navigate('Cardapio');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Botão de saída discreto (ativado por toque longo no logo) */}
      <SecureExitButton modo="KIOSK" discreto />
      
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏨</Text>
          </View>
        </View>

        {/* Mensagem de boas-vindas */}
        <Text style={styles.title}>Seja bem-vindo!</Text>
        <Text style={styles.subtitle}>
          Aproxime sua pulseira NFC para começar
        </Text>

        {/* Instruções */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Aproxime sua pulseira do dispositivo
            </Text>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Escolha os produtos do cardápio
            </Text>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Finalize seu pedido
            </Text>
          </View>
        </View>

        {/* Botão para continuar */}
        <Button
          title="Continuar"
          onPress={handleContinuar}
          variant="primary"
          size="large"
          fullWidth
          style={styles.continueButton}
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
    marginBottom: spacing.xl,
  },
  instructionsContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    ...typography.body,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: spacing.md,
  },
  instructionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.md,
  },
});

