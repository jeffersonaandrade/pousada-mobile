import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from '../components/Button';
import SecureExitButton from '../components/SecureExitButton';
import ScreenWrapper from '../components/ScreenWrapper';

type KioskWelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KioskWelcome'>;
};

export default function KioskWelcomeScreen({ navigation }: KioskWelcomeScreenProps) {
  const handleContinuar = () => {
    navigation.navigate('Cardapio');
  };

  // Detectar se é tela pequena para ajustar espaçamentos
  const screenHeight = Dimensions.get('window').height;
  const isSmallScreen = screenHeight < 700;

  return (
    <ScreenWrapper scrollEnabled={true} contentContainerStyle={styles.scrollContent}>
      {/* Botão de saída discreto (ativado por toque longo no logo) */}
      <SecureExitButton modo="KIOSK" discreto />
      
      <View style={[styles.content, isSmallScreen && styles.contentSmall]}>
        {/* Logo/Header */}
        <View style={[styles.logoContainer, isSmallScreen && styles.logoContainerSmall]}>
          <View style={[styles.logoCircle, isSmallScreen && styles.logoCircleSmall]}>
            <Text style={[styles.logoText, isSmallScreen && styles.logoTextSmall]}>🏨</Text>
          </View>
        </View>

        {/* Mensagem de boas-vindas */}
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>Seja bem-vindo!</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Aproxime sua pulseira NFC para começar
        </Text>

        {/* Instruções */}
        <View style={[styles.instructionsContainer, isSmallScreen && styles.instructionsContainerSmall]}>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: 600, // Altura mínima para garantir que o conteúdo seja visível
  },
  contentSmall: {
    padding: spacing.md,
    minHeight: 500,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainerSmall: {
    marginBottom: spacing.lg,
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
  logoCircleSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 64,
  },
  logoTextSmall: {
    fontSize: 48,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  titleSmall: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  subtitleSmall: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  instructionsContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  instructionsContainerSmall: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
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

