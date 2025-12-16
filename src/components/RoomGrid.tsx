import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { buscarQuartos, atualizarStatusQuarto } from '../services/api';
import { Quarto, StatusQuarto } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { getErrorMessage } from '../utils/errorHandler';
import Button from './Button';

type RoomGridProps = {
  visible: boolean;
  onClose: () => void;
  onSelectRoom: (quarto: Quarto) => void;
  allowSelection?: boolean; // Se true, permite selecionar quartos LIVRE
};

export default function RoomGrid({
  visible,
  onClose,
  onSelectRoom,
  allowSelection = false,
}: RoomGridProps) {
  const [quartos, setQuartos] = useState<Quarto[]>([]);
  const [loading, setLoading] = useState(false);
  const [atualizando, setAtualizando] = useState<number | null>(null);

  // Buscar quartos ao abrir o modal
  useEffect(() => {
    if (visible) {
      carregarQuartos();
    }
  }, [visible]);

  const carregarQuartos = async () => {
    setLoading(true);
    try {
      const dados = await buscarQuartos();
      setQuartos(dados);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleQuartoPress = async (quarto: Quarto) => {
    // Se for LIVRE e permitir seleção, seleciona
    if (quarto.status === StatusQuarto.LIVRE && allowSelection) {
      onSelectRoom(quarto);
      onClose();
      return;
    }

    // Se for LIMPEZA, pergunta se quer liberar
    if (quarto.status === StatusQuarto.LIMPEZA) {
      Alert.alert(
        'Liberar Quarto',
        `Liberar quarto ${quarto.numero} para uso?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Liberar',
            onPress: async () => {
              setAtualizando(quarto.id);
              try {
                await atualizarStatusQuarto(quarto.id, StatusQuarto.LIVRE);
                await carregarQuartos(); // Recarregar lista
                Alert.alert('Sucesso', `Quarto ${quarto.numero} liberado para uso`);
              } catch (error: unknown) {
                Alert.alert('Erro', getErrorMessage(error));
              } finally {
                setAtualizando(null);
              }
            },
          },
        ]
      );
      return;
    }

    // Se for OCUPADO, apenas mostra informação
    if (quarto.status === StatusQuarto.OCUPADO) {
      const nomeHospede = quarto.hospedeAtual?.nome || 'Desconhecido';
      Alert.alert(
        'Quarto Ocupado',
        `Quarto ${quarto.numero}\nHóspede: ${nomeHospede}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getQuartoStyle = (status: StatusQuarto) => {
    switch (status) {
      case StatusQuarto.LIVRE:
        return styles.quartoLivre;
      case StatusQuarto.OCUPADO:
        return styles.quartoOcupado;
      case StatusQuarto.LIMPEZA:
        return styles.quartoLimpeza;
      default:
        return styles.quartoLivre;
    }
  };

  const getQuartoTextStyle = (status: StatusQuarto) => {
    switch (status) {
      case StatusQuarto.LIVRE:
        return styles.quartoTextLivre;
      case StatusQuarto.OCUPADO:
        return styles.quartoTextOcupado;
      case StatusQuarto.LIMPEZA:
        return styles.quartoTextLimpeza;
      default:
        return styles.quartoTextLivre;
    }
  };

  const renderQuarto = ({ item }: { item: Quarto }) => {
    const isUpdating = atualizando === item.id;
    const isClickable =
      item.status === StatusQuarto.LIVRE ||
      item.status === StatusQuarto.LIMPEZA;

    return (
      <TouchableOpacity
        style={[
          styles.quartoCard,
          getQuartoStyle(item.status),
          !isClickable && styles.quartoDisabled,
        ]}
        onPress={() => handleQuartoPress(item)}
        disabled={!isClickable || isUpdating}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <>
            <Text style={[styles.quartoNumero, getQuartoTextStyle(item.status)]}>
              {item.numero}
            </Text>
            {item.status === StatusQuarto.OCUPADO && item.hospedeAtual && (
              <Text
                style={[styles.quartoHospede, getQuartoTextStyle(item.status)]}
                numberOfLines={1}
              >
                {item.hospedeAtual.nome}
              </Text>
            )}
            {item.status === StatusQuarto.LIMPEZA && (
              <Text style={[styles.quartoStatus, getQuartoTextStyle(item.status)]}>
                🧹 Limpeza
              </Text>
            )}
            {item.status === StatusQuarto.OCUPADO && (
              <Text style={styles.quartoIcon}>🔒</Text>
            )}
            {item.status === StatusQuarto.LIVRE && allowSelection && (
              <Text style={styles.quartoIcon}>✓</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {allowSelection ? 'Selecionar Quarto' : 'Mapa de Quartos'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Legenda */}
          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaColor, styles.legendaLivre]} />
              <Text style={styles.legendaText}>Livre</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaColor, styles.legendaOcupado]} />
              <Text style={styles.legendaText}>Ocupado</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaColor, styles.legendaLimpeza]} />
              <Text style={styles.legendaText}>Limpeza</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando quartos...</Text>
            </View>
          ) : (
            <FlatList
              data={quartos}
              renderItem={renderQuarto}
              keyExtractor={(item) => item.id.toString()}
              numColumns={4}
              contentContainerStyle={styles.grid}
              refreshing={loading}
              onRefresh={carregarQuartos}
            />
          )}

          <View style={styles.footer}>
            <Button
              title="Atualizar"
              onPress={carregarQuartos}
              variant="outline"
              size="medium"
              loading={loading}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  legenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendaColor: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.sm,
  },
  legendaLivre: {
    backgroundColor: colors.success,
  },
  legendaOcupado: {
    backgroundColor: colors.error,
  },
  legendaLimpeza: {
    backgroundColor: colors.warning,
  },
  legendaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  grid: {
    padding: spacing.md,
  },
  quartoCard: {
    flex: 1,
    aspectRatio: 1,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    minWidth: 80,
    maxWidth: 120,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quartoLivre: {
    backgroundColor: colors.success,
  },
  quartoOcupado: {
    backgroundColor: colors.error,
  },
  quartoLimpeza: {
    backgroundColor: colors.warning,
  },
  quartoDisabled: {
    opacity: 0.8,
  },
  quartoNumero: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  quartoTextLivre: {
    color: '#FFFFFF',
  },
  quartoTextOcupado: {
    color: '#FFFFFF',
  },
  quartoTextLimpeza: {
    color: '#FFFFFF',
  },
  quartoHospede: {
    ...typography.bodySmall,
    fontSize: 10,
    textAlign: 'center',
  },
  quartoStatus: {
    ...typography.bodySmall,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  quartoIcon: {
    fontSize: 20,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

