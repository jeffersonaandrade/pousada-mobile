import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Input from './Input';
import Button from './Button';

interface ManagerAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void>;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function ManagerAuthModal({
  visible,
  onClose,
  onConfirm,
  title = 'Autorização de Supervisor Necessária',
  message = 'Esta ação exige senha de gerente',
  loading = false,
}: ManagerAuthModalProps) {
  const [pin, setPin] = useState('');

  const handleConfirm = async () => {
    if (!pin.trim()) {
      return;
    }

    try {
      await onConfirm(pin.trim());
      // Limpar PIN apenas se sucesso
      setPin('');
    } catch (error) {
      // Em caso de erro, limpar PIN para nova tentativa
      setPin('');
      throw error; // Re-throw para o componente pai tratar
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Input
            label="PIN do Gerente"
            value={pin}
            onChangeText={setPin}
            placeholder="Digite o PIN"
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            autoFocus
            editable={!loading}
          />

          <View style={styles.buttons}>
            <Button
              title="Cancelar"
              onPress={handleClose}
              variant="secondary"
              size="medium"
              style={styles.button}
              disabled={loading}
            />
            <Button
              title={loading ? 'Verificando...' : 'Confirmar'}
              onPress={handleConfirm}
              variant="primary"
              size="medium"
              style={styles.button}
              disabled={!pin.trim() || loading}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});

