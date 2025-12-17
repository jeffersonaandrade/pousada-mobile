import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { listarProdutos, buscarHospedePorPulseira } from '../services/api';
import { Produto, ModoApp } from '../types';
import { useNFC } from '../hooks/useNFC';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ScreenWrapper from '../components/ScreenWrapper';
import { getErrorMessage } from '../utils/errorHandler';

type CardapioScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cardapio'>;
};

export default function CardapioScreen({ navigation }: CardapioScreenProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [setorSelecionado, setSetorSelecionado] = useState<string>('TODOS');
  const [loading, setLoading] = useState(true);
  const { hospedeSelecionado, setHospedeSelecionado, carrinho, modo, adicionarAoCarrinho } = useAppStore();
  const { lerPulseira, isReading } = useNFC();

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    // Filtrar produtos por categoria e setor
    let produtosFiltrados = produtos;

    // Filtro por categoria
    if (categoriaSelecionada) {
      produtosFiltrados = produtosFiltrados.filter((p) => p.categoria === categoriaSelecionada);
    }

    // Filtro por setor
    if (setorSelecionado !== 'TODOS') {
      produtosFiltrados = produtosFiltrados.filter((p) => p.setor === setorSelecionado);
    }

    setProdutosFiltrados(produtosFiltrados);
  }, [produtos, categoriaSelecionada, setorSelecionado]);

  const carregarProdutos = async () => {
    try {
      const data = await listarProdutos(undefined, true);
      // Filtrar apenas produtos visíveis no cardápio
      const produtosVisiveis = data.filter((p) => p.visivelCardapio !== false);
      setProdutos(produtosVisiveis);
      setProdutosFiltrados(produtosVisiveis);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Obter categorias únicas dos produtos
  const categorias = Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean)));

  // Obter setores únicos dos produtos
  const setoresDisponiveis = Array.from(new Set(produtos.map((p) => p.setor).filter(Boolean)));

  // Mapear setores para rótulos amigáveis
  const getSetorLabel = (setor: string): string => {
    const labels: Record<string, string> = {
      TODOS: 'Todos',
      COZINHA: 'Restaurante/Cozinha',
      BAR_PISCINA: 'Bar da Piscina',
      BOATE: 'Boate/Show',
    };
    return labels[setor] || setor;
  };

  // Lista de setores com "TODOS" no início
  const setoresComTodos = ['TODOS', ...setoresDisponiveis];

  const handleProdutoPress = (produto: Produto) => {
    // Navegar para tela de detalhes
    navigation.navigate('ProdutoDetalhes', { produto });
  };

  const lerPulseiraHandler = async () => {
    const uid = await lerPulseira();
    if (!uid) {
      Alert.alert('Erro', 'Não foi possível ler a pulseira');
      return;
    }

    try {
      const hospede = await buscarHospedePorPulseira(uid);
      setHospedeSelecionado(hospede);
      Alert.alert(
        'Hóspede Identificado',
        `${hospede.nome}\nDívida atual: R$ ${hospede.dividaAtual.toFixed(2)}`
      );
    } catch (error: any) {
      Alert.alert('Erro', getErrorMessage(error));
    }
  };

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    // No modo KIOSK, é obrigatório ter hóspede selecionado (via pulseira)
    // No modo GARCOM, o garçom pode adicionar produtos sem pulseira (usará PIN do cliente)
    if (modo === 'KIOSK' && !hospedeSelecionado) {
      Alert.alert('Atenção', 'Leia a pulseira do hóspede primeiro');
      return;
    }
    
    if (produto.estoque === 0) {
      Alert.alert('Erro', 'Produto sem estoque');
      return;
    }

    // Verificar se já existe no carrinho e se há estoque suficiente
    const itemNoCarrinho = carrinho.find((item: { produto: Produto; quantidade: number }) => item.produto.id === produto.id);
    const quantidadeNoCarrinho = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    
    if (quantidadeNoCarrinho >= produto.estoque) {
      Alert.alert(
        'Estoque Insuficiente',
        `Você já tem ${quantidadeNoCarrinho} unidade(s) deste produto no carrinho. Estoque disponível: ${produto.estoque}`
      );
      return;
    }
    
    adicionarAoCarrinho(produto);
    // Feedback visual mais sutil
    Alert.alert('✓', `${produto.nome} adicionado ao carrinho!`);
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.produtoCard}
      onPress={() => handleProdutoPress(item)}
      activeOpacity={0.9}
      disabled={item.estoque === 0}
    >
      {item.foto ? (
        <Image source={{ uri: item.foto }} style={styles.produtoImagem} />
      ) : (
        <View style={styles.produtoImagemPlaceholder}>
          <Text style={styles.produtoImagemPlaceholderText}>🍽️</Text>
        </View>
      )}
      {item.estoque === 0 && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>Sem estoque</Text>
        </View>
      )}
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome} numberOfLines={2}>{item.nome}</Text>
        {item.categoria && (
          <Text style={styles.produtoCategoria}>{item.categoria}</Text>
        )}
        <View style={styles.produtoEstoqueContainer}>
          <Text
            style={[
              styles.produtoEstoque,
              item.estoque === 0 && styles.produtoEstoqueZero,
              item.estoque > 0 && item.estoque <= 5 && styles.produtoEstoqueBaixo,
            ]}
          >
            {item.estoque > 0 
              ? `${item.estoque} em estoque${item.estoque <= 5 ? ' (baixo)' : ''}`
              : 'Sem estoque'}
          </Text>
        </View>
        <View style={styles.produtoFooter}>
          <Text style={styles.produtoPreco}>R$ {item.preco.toFixed(2)}</Text>
          {item.estoque > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e: any) => {
                e.stopPropagation();
                handleAdicionarAoCarrinho(item);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper contentContainerStyle={styles.centerContent}>
        <LoadingState message="Carregando produtos..." />
      </ScreenWrapper>
    );
  }

  if (!loading && produtos.length === 0) {
    return (
      <ScreenWrapper contentContainerStyle={styles.centerContent}>
        <EmptyState
          icon="🍽️"
          title="Nenhum produto disponível"
          message="Não há produtos cadastrados no momento"
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollEnabled={false}>
      {/* Header com info do hóspede */}
      <View style={styles.header}>
        {hospedeSelecionado ? (
          <View style={styles.hospedeInfo}>
            <Text style={styles.hospedeNome}>{hospedeSelecionado.nome}</Text>
            <Text style={styles.hospedeDivida}>
              Dívida: R$ {hospedeSelecionado.dividaAtual.toFixed(2)}
            </Text>
          </View>
        ) : (
          <>
            {modo === 'KIOSK' ? (
              // Modo Kiosk: obrigatório ler pulseira
              <TouchableOpacity
                style={styles.lerPulseiraButton}
                onPress={lerPulseiraHandler}
                disabled={isReading}
              >
                {isReading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.lerPulseiraButtonText}>📱 Ler Pulseira</Text>
                )}
              </TouchableOpacity>
            ) : (
              // Modo Garçom: leitura opcional (pode usar PIN do cliente)
              <View style={styles.hospedeInfo}>
                <Text style={styles.hospedeNome}>Modo Garçom</Text>
                <Text style={styles.hospedeDivida}>
                  Leia a pulseira ou informe o PIN do cliente no checkout
                </Text>
                <TouchableOpacity
                  style={[styles.lerPulseiraButton, styles.lerPulseiraButtonSecondary]}
                  onPress={lerPulseiraHandler}
                  disabled={isReading}
                >
                  {isReading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.lerPulseiraButtonText}>📱 Ler Pulseira (Opcional)</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Filtros de setor */}
      {setoresDisponiveis.length > 0 && (
        <View style={styles.setoresContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.setoresScroll}
          >
            {setoresComTodos.map((setor) => (
              <TouchableOpacity
                key={setor}
                style={[
                  styles.setorButton,
                  setorSelecionado === setor && styles.setorButtonActive,
                ]}
                onPress={() => setSetorSelecionado(setor)}
              >
                <Text
                  style={[
                    styles.setorButtonText,
                    setorSelecionado === setor && styles.setorButtonTextActive,
                  ]}
                >
                  {getSetorLabel(setor)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filtros de categoria */}
      {categorias.length > 0 && (
        <View style={styles.categoriasContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoriaButton,
                categoriaSelecionada === null && styles.categoriaButtonActive,
              ]}
              onPress={() => setCategoriaSelecionada(null)}
            >
              <Text
                style={[
                  styles.categoriaButtonText,
                  categoriaSelecionada === null && styles.categoriaButtonTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.categoriaButton,
                  categoriaSelecionada === categoria && styles.categoriaButtonActive,
                ]}
                onPress={() => setCategoriaSelecionada(categoria || null)}
              >
                <Text
                  style={[
                    styles.categoriaButtonText,
                    categoriaSelecionada === categoria && styles.categoriaButtonTextActive,
                  ]}
                >
                  {categoria}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Lista de produtos */}
      <FlatList
        data={produtosFiltrados}
        renderItem={renderProduto}
        keyExtractor={(item: Produto) => item.id.toString()}
        contentContainerStyle={styles.lista}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {setorSelecionado !== 'TODOS' || categoriaSelecionada
                ? 'Nenhum produto encontrado com os filtros selecionados'
                : 'Nenhum produto encontrado nesta categoria'}
            </Text>
          </View>
        }
      />

      {/* Botão do carrinho */}
      {carrinho.length > 0 && (
        <TouchableOpacity
          style={styles.carrinhoButton}
          onPress={() => navigation.navigate('Carrinho')}
        >
          <Text style={styles.carrinhoButtonText}>
            🛒 Carrinho ({carrinho.length})
          </Text>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  hospedeInfo: {
    alignItems: 'center',
  },
  hospedeNome: {
    ...typography.h3,
    color: colors.text,
  },
  hospedeDivida: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  lerPulseiraButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  lerPulseiraButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lerPulseiraButtonSecondary: {
    backgroundColor: colors.secondary,
    marginTop: spacing.sm,
  },
  lista: {
    padding: spacing.md,
  },
  produtoCard: {
    flex: 1,
    backgroundColor: colors.background,
    margin: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  produtoImagem: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  produtoImagemPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  produtoImagemPlaceholderText: {
    fontSize: 64,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  produtoInfo: {
    padding: spacing.md,
  },
  produtoNome: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  produtoCategoria: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  produtoEstoqueContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  produtoEstoque: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  produtoEstoqueZero: {
    color: colors.error,
    fontWeight: '600',
  },
  produtoEstoqueBaixo: {
    color: colors.warning,
    fontWeight: '600',
  },
  produtoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  produtoPreco: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carrinhoButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    elevation: 5,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  carrinhoButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  setoresContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setoresScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  setorButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundDark,
    marginRight: spacing.sm,
  },
  setorButtonActive: {
    backgroundColor: colors.primary,
  },
  setorButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  setorButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoriasContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriasScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoriaButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundDark,
    marginRight: spacing.sm,
  },
  categoriaButtonActive: {
    backgroundColor: colors.secondary,
  },
  categoriaButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoriaButtonTextActive: {
    color: colors.text,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
