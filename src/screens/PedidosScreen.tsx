import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { listarPedidos, cancelarPedido } from '../services/api';
import { Pedido, StatusPedido, Role } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ManagerAuthModal from '../components/ManagerAuthModal';
import { getErrorMessage } from '../utils/errorHandler';
import { useAppStore } from '../store/appStore';

type PedidosScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Pedidos'>;
};

const statusColors: Record<StatusPedido, string> = {
  PENDENTE: colors.warning,
  PREPARANDO: colors.info,
  PRONTO: colors.success,
  ENTREGUE: colors.textSecondary,
  CANCELADO: colors.error,
};

const statusLabels: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  PREPARANDO: 'Preparando',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default function PedidosScreen({ navigation }: PedidosScreenProps) {
  const { usuario } = useAppStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [pedidoParaCancelar, setPedidoParaCancelar] = useState<Pedido | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // Proteção de rota: CLEANER não pode acessar Pedidos
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

  useEffect(() => {
    // Só carregar pedidos se não for CLEANER
    if (usuario && usuario.cargo !== Role.CLEANER) {
      carregarPedidos();
    }
  }, [usuario]);

  const carregarPedidos = async () => {
    try {
      // Se for ADMIN, pode ver todos os pedidos (opcional)
      // Se for GARCOM, força filtro por usuarioId e recente
      const params: {
        usuarioId?: number;
        recente?: boolean;
      } = {};

      if (usuario) {
        if (usuario.cargo === Role.WAITER || usuario.cargo === Role.MANAGER) {
          // Garçom e Gerente veem apenas seus pedidos das últimas 24h
          params.usuarioId = usuario.id;
          params.recente = true;
        }
        // ADMIN pode ver todos (não aplica filtro)
      }

      const data = await listarPedidos(params);
      // Ordenar por data (mais recentes primeiro)
      const ordenados = data.sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setPedidos(ordenados);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarPedidos();
  };

  const handleCancelarPedido = (pedido: Pedido) => {
    // Verificar se o pedido pode ser cancelado
    if (pedido.status === 'CANCELADO') {
      Alert.alert('Atenção', 'Este pedido já foi cancelado');
      return;
    }

    if (pedido.status === 'ENTREGUE') {
      Alert.alert('Atenção', 'Não é possível cancelar um pedido já entregue');
      return;
    }

    setPedidoParaCancelar(pedido);
    setMostrarModalCancelar(true);
  };

  const confirmarCancelamento = async (managerPin: string) => {
    if (!pedidoParaCancelar) {
      return;
    }

    setCancelando(true);
    try {
      await cancelarPedido(pedidoParaCancelar.id, managerPin);
      
      // Atualizar lista local
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoParaCancelar.id ? { ...p, status: 'CANCELADO' as StatusPedido } : p
        )
      );

      Alert.alert('Sucesso', 'Pedido cancelado com sucesso');
      setMostrarModalCancelar(false);
      setPedidoParaCancelar(null);
    } catch (error: unknown) {
      const status = (error as any)?.status || (error as any)?.response?.status;
      
      if (status === 403) {
        Alert.alert(
          'Permissão Negada',
          'PIN de Gerente inválido ou sem permissão',
          [{ text: 'OK', style: 'destructive' }]
        );
      } else {
        Alert.alert('Erro', getErrorMessage(error));
      }
      // Não fechar modal em caso de erro para permitir nova tentativa
    } finally {
      setCancelando(false);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Pedido }) => {
    const podeCancelar = item.status !== 'CANCELADO' && item.status !== 'ENTREGUE';

    return (
      <View style={styles.pedidoCard}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
            <Text style={styles.pedidoData}>{formatarData(item.data)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[item.status] + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColors[item.status] },
              ]}
            >
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>

        <View style={styles.pedidoBody}>
          <View style={styles.pedidoRow}>
            <Text style={styles.pedidoLabel}>Produto:</Text>
            <Text style={styles.pedidoValue}>
              {item.produto?.nome || 'Produto não encontrado'}
            </Text>
          </View>
          <View style={styles.pedidoRow}>
            <Text style={styles.pedidoLabel}>Hóspede:</Text>
            <Text style={styles.pedidoValue}>
              {item.hospede?.nome || 'Hóspede não encontrado'}
            </Text>
          </View>
          {item.hospede?.quarto && (
            <View style={styles.pedidoRow}>
              <Text style={styles.pedidoLabel}>Quarto:</Text>
              <Text style={styles.pedidoValue}>{item.hospede.quarto}</Text>
            </View>
          )}
          <View style={styles.pedidoRow}>
            <Text style={styles.pedidoLabel}>Valor:</Text>
            <Text style={[styles.pedidoValue, styles.pedidoValor]}>
              R$ {item.valor.toFixed(2)}
            </Text>
          </View>
        </View>

        {podeCancelar && (
          <TouchableOpacity
            style={styles.cancelarButton}
            onPress={() => handleCancelarPedido(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelarButtonText}>🗑️ Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Se for CLEANER, não renderizar o conteúdo
  if (usuario && usuario.cargo === Role.CLEANER) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Carregando pedidos..." />
      </SafeAreaView>
    );
  }

  if (pedidos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="📋"
          title="Nenhum pedido encontrado"
          message="Não há pedidos registrados no momento"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pedidos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      />

      <ManagerAuthModal
        visible={mostrarModalCancelar}
        onClose={() => {
          setMostrarModalCancelar(false);
          setPedidoParaCancelar(null);
        }}
        onConfirm={confirmarCancelamento}
        title="Cancelar Pedido"
        message="Esta ação exige senha de gerente para cancelar o pedido"
        loading={cancelando}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  list: {
    padding: spacing.md,
  },
  pedidoCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoId: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pedidoData: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  pedidoBody: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pedidoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pedidoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pedidoValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  pedidoValor: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 16,
  },
  cancelarButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelarButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
  },
});

