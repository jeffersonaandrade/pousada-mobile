import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { buscarPedidosPorHospede } from '../services/api';
import { Hospede, Pedido } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { getErrorMessage } from '../utils/errorHandler';
import LoadingState from '../components/LoadingState';

type KioskExtratoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KioskExtrato'>;
};

export default function KioskExtratoScreen({ navigation }: KioskExtratoScreenProps) {
  const { hospedeSelecionado, setHospedeSelecionado } = useAppStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVoltar = () => {
    // Limpar dados do hóspede
    setHospedeSelecionado(null);
    // Voltar para tela inicial
    navigation.reset({
      index: 0,
      routes: [{ name: 'KioskWelcome' }],
    });
  };

  // Função para resetar timeout
  const resetTimeout = () => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Criar novo timeout de 30 segundos
    timeoutRef.current = setTimeout(() => {
      handleVoltar();
    }, 30000);
  };

  // Timeout automático de 30 segundos
  useEffect(() => {
    // Inicializar timeout
    resetTimeout();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Carregar pedidos do hóspede
  useEffect(() => {
    if (hospedeSelecionado) {
      carregarPedidos();
    } else {
      // Se não houver hóspede, voltar para tela inicial
      navigation.reset({
        index: 0,
        routes: [{ name: 'KioskWelcome' }],
      });
    }
  }, [hospedeSelecionado]);

  const carregarPedidos = async () => {
    if (!hospedeSelecionado) return;

    setLoading(true);
    try {
      const dados = await buscarPedidosPorHospede(hospedeSelecionado.id);
      setPedidos(dados);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = (): number => {
    return pedidos.reduce((total, pedido) => total + pedido.valor, 0);
  };

  const renderItem = ({ item }: { item: Pedido }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome} numberOfLines={2}>
          {item.produto?.nome || 'Produto não encontrado'}
        </Text>
        <Text style={styles.itemData}>
          {new Date(item.data).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.itemValores}>
        <Text style={styles.itemQuantidade}>Qtd: 1</Text>
        <Text style={styles.itemValor}>
          R$ {item.valor.toFixed(2).replace('.', ',')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <LoadingState message="Carregando extrato..." />
      </ScreenWrapper>
    );
  }

  if (!hospedeSelecionado) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <ScreenWrapper scrollEnabled={false}>
      <View style={styles.container}>
        {/* Header com informações do hóspede */}
        <View style={styles.header}>
          <Text style={styles.hospedeNome} numberOfLines={2}>
            {hospedeSelecionado.nome}
          </Text>
          <Text style={styles.totalDivida}>
            Total: R$ {hospedeSelecionado.dividaAtual.toFixed(2).replace('.', ',')}
          </Text>
        </View>

        {/* Lista de pedidos */}
        <View style={styles.listaContainer}>
          {pedidos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum consumo registrado</Text>
            </View>
          ) : (
            <FlatList
              data={pedidos}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.lista}
              showsVerticalScrollIndicator={true}
              onTouchStart={resetTimeout}
              onScrollBeginDrag={resetTimeout}
            />
          )}
        </View>

        {/* Rodapé com botão voltar */}
        <View style={styles.footer}>
          <Button
            title="Voltar"
            onPress={() => {
              resetTimeout();
              handleVoltar();
            }}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  hospedeNome: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  totalDivida: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 32,
  },
  listaContainer: {
    flex: 1,
  },
  lista: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemNome: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemData: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemValores: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemQuantidade: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemValor: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

