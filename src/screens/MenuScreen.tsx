import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { Role } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import SecureExitButton from '../components/SecureExitButton';

type MenuScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Menu'>;
};

export default function MenuScreen({ navigation }: MenuScreenProps) {
  const { usuario, modo } = useAppStore();

  // Proteção de rota: CLEANER não pode acessar Menu
  useEffect(() => {
    if (usuario && usuario.cargo === Role.CLEANER) {
      Alert.alert(
        'Acesso Negado',
        'Seu perfil não tem acesso a esta tela. Você será redirecionado para a tela de Governança.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('Governance');
            },
          },
        ]
      );
    }
  }, [usuario, navigation]);

  // Se for CLEANER, não renderizar o conteúdo
  if (usuario && usuario.cargo === Role.CLEANER) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header customizado */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Menu Principal</Text>
        {/* Botão de saída seguro no canto superior direito */}
        {modo && (
          <View style={styles.exitButtonContainer}>
            <SecureExitButton modo={modo} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario?.nome?.charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>
          <Text style={styles.welcome}>
            Olá, {usuario?.nome || 'Usuário'}!
          </Text>
          <Text style={styles.subtitle}>O que deseja fazer?</Text>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuCard, styles.menuCardPrimary]}
            onPress={() => navigation.navigate('Cardapio')}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🍽️</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Fazer Pedido</Text>
              <Text style={styles.menuDescription}>
                Realizar pedidos para hóspedes
              </Text>
            </View>
          </TouchableOpacity>

          {/* Check-in apenas para Recepção */}
          {modo === 'RECEPCAO' && (
            <TouchableOpacity
              style={[styles.menuCard, styles.menuCardSecondary]}
              onPress={() => navigation.navigate('CheckIn')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>📋</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Check-in</Text>
                <Text style={styles.menuDescription}>
                  Cadastrar novos hóspedes
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Lista de Pedidos */}
          <TouchableOpacity
            style={[styles.menuCard, styles.menuCardInfo]}
            onPress={() => navigation.navigate('Pedidos')}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📦</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Pedidos</Text>
              <Text style={styles.menuDescription}>
                Ver e gerenciar pedidos
              </Text>
            </View>
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
  customHeader: {
    backgroundColor: colors.primary,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
  },
  exitButtonContainer: {
    zIndex: 1000,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    ...typography.h1,
    color: '#FFFFFF',
  },
  welcome: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  menuContainer: {
    gap: spacing.md,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  menuCardPrimary: {
    borderLeftColor: colors.primary,
  },
  menuCardSecondary: {
    borderLeftColor: colors.success,
  },
  menuCardInfo: {
    borderLeftColor: colors.info,
  },
  menuCardDanger: {
    borderLeftColor: colors.error,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIcon: {
    fontSize: 32,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  menuDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
