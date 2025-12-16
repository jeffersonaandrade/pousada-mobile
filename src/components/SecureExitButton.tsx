import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { autenticarUsuario } from '../services/api';
import { useAppStore } from '../store/appStore';
import ManagerAuthModal from './ManagerAuthModal';
import { colors, spacing, borderRadius } from '../theme/colors';
import { getErrorMessage } from '../utils/errorHandler';
import { Role } from '../types';

interface SecureExitButtonProps {
  modo: 'GARCOM' | 'RECEPCAO' | 'KIOSK';
  discreto?: boolean; // Para modo Kiosk - botão invisível ou ativado por toque longo
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SecureExitButton({ modo, discreto = false }: SecureExitButtonProps) {
  const navigation = useNavigation<NavigationProp>();
  const { reset } = useAppStore();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [validando, setValidando] = useState(false);

  const handleSair = () => {
    setMostrarModal(true);
  };

  const validarESair = async (pin: string) => {
    setValidando(true);
    try {
      // Autenticar com o PIN fornecido
      const usuario = await autenticarUsuario(pin);
      
      // Verificar se é MANAGER ou ADMIN
      // O backend retorna string ("MANAGER" ou "ADMIN")
      const cargo = String(usuario.cargo).toUpperCase();
      if (cargo !== 'MANAGER' && cargo !== 'ADMIN') {
        throw new Error('Apenas gerentes podem sair deste modo');
      }

      // PIN válido e é gerente - permitir saída
      reset();
      navigation.navigate('Config');
    } catch (error: unknown) {
      const status = (error as any)?.status || (error as any)?.response?.status;
      
      if (status === 401) {
        Alert.alert(
          'PIN Inválido',
          'O PIN informado não é válido ou o usuário está inativo.',
          [{ text: 'OK', style: 'destructive' }]
        );
      } else {
        Alert.alert(
          'Permissão Negada',
          getErrorMessage(error) || 'Apenas gerentes podem sair deste modo.',
          [{ text: 'OK', style: 'destructive' }]
        );
      }
      // Não fechar modal em caso de erro para permitir nova tentativa
      throw error; // Re-throw para o modal não fechar
    } finally {
      setValidando(false);
    }
  };

  // Modo Kiosk: botão discreto (invisível ou ativado por toque longo)
  if (modo === 'KIOSK' && discreto) {
    return (
      <TouchableOpacity
        style={styles.kioskExitArea}
        onLongPress={handleSair}
        activeOpacity={1}
      >
        {/* Área invisível no canto superior direito */}
        <View style={styles.kioskInvisibleButton} />
      </TouchableOpacity>
    );
  }

  // Modo Kiosk: botão visível mas discreto
  if (modo === 'KIOSK') {
    return (
      <>
        <TouchableOpacity
          style={styles.kioskButton}
          onPress={handleSair}
          activeOpacity={0.7}
        >
          <Text style={styles.kioskButtonText}>🔒</Text>
        </TouchableOpacity>

        <ManagerAuthModal
          visible={mostrarModal}
          onClose={() => setMostrarModal(false)}
          onConfirm={validarESair}
          title="Sair do Modo Kiosk"
          message="Para sair deste modo, insira o PIN de Gerente"
          loading={validando}
        />
      </>
    );
  }

  // Modo Garçom ou Recepção: botão visível
  const label = modo === 'GARCOM' ? 'Encerrar Turno' : 'Sair';
  const icon = modo === 'GARCOM' ? '🚪' : '🔒';

  return (
    <>
      <TouchableOpacity
        style={styles.exitButtonHeader}
        onPress={handleSair}
        activeOpacity={0.7}
      >
        <Text style={styles.exitButtonIconHeader}>{icon}</Text>
        <Text style={styles.exitButtonTextHeader}>{label}</Text>
      </TouchableOpacity>

      <ManagerAuthModal
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onConfirm={validarESair}
        title="Autorização Necessária"
        message={`Para sair do modo ${modo === 'GARCOM' ? 'Garçom' : 'Recepção'}, insira o PIN de Gerente`}
        loading={validando}
      />
    </>
  );
}

const styles = StyleSheet.create({
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  exitButtonIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  exitButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  exitButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exitButtonIconHeader: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  exitButtonTextHeader: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  kioskButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundDark + '80',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  kioskButtonText: {
    fontSize: 20,
  },
  kioskExitArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 1000,
  },
  kioskInvisibleButton: {
    flex: 1,
  },
});

