import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import { Produto, ModoApp } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';

type ProdutoDetalhesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProdutoDetalhes'>;
  route: RouteProp<RootStackParamList, 'ProdutoDetalhes'>;
};

export default function ProdutoDetalhesScreen({
  navigation,
  route,
}: ProdutoDetalhesScreenProps) {
  const { produto } = route.params;
  const { hospedeSelecionado, carrinho, modo, adicionarAoCarrinho } = useAppStore();
  const [quantidade, setQuantidade] = useState(1);

  const handleAdicionarAoCarrinho = () => {
    // No modo KIOSK, é obrigatório ter hóspede selecionado (via pulseira)
    if (modo === 'KIOSK' && !hospedeSelecionado) {
      Alert.alert('Atenção', 'Leia a pulseira do hóspede primeiro');
      return;
    }

    if (produto.estoque === 0) {
      Alert.alert('Erro', 'Produto sem estoque');
      return;
    }

    // Verificar se já existe no carrinho e se há estoque suficiente
    const itemNoCarrinho = carrinho.find(
      (item: { produto: Produto; quantidade: number }) => item.produto.id === produto.id
    );
    const quantidadeNoCarrinho = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

    if (quantidadeNoCarrinho + quantidade > produto.estoque) {
      Alert.alert(
        'Estoque Insuficiente',
        `Estoque disponível: ${produto.estoque}. Você já tem ${quantidadeNoCarrinho} no carrinho.`
      );
      return;
    }

    // Adicionar a quantidade selecionada
    for (let i = 0; i < quantidade; i++) {
      adicionarAoCarrinho(produto);
    }

    Alert.alert('✓', `${quantidade}x ${produto.nome} adicionado(s) ao carrinho!`);
    navigation.goBack();
  };

  const aumentarQuantidade = () => {
    const itemNoCarrinho = carrinho.find(
      (item: { produto: Produto; quantidade: number }) => item.produto.id === produto.id
    );
    const quantidadeNoCarrinho = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    const maxDisponivel = produto.estoque - quantidadeNoCarrinho;

    if (quantidade < maxDisponivel) {
      setQuantidade(quantidade + 1);
    } else {
      Alert.alert('Atenção', `Máximo disponível: ${maxDisponivel}`);
    }
  };

  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        {/* Imagem do produto */}
        <View style={styles.imagemContainer}>
          {produto.foto ? (
            <Image source={{ uri: produto.foto }} style={styles.produtoImagem} />
          ) : (
            <View style={styles.produtoImagemPlaceholder}>
              <Text style={styles.produtoImagemPlaceholderText}>🍽️</Text>
            </View>
          )}
          {produto.estoque === 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Sem estoque</Text>
            </View>
          )}
        </View>

        {/* Informações do produto */}
        <View style={styles.infoContainer}>
          {produto.categoria && (
            <Text style={styles.categoria}>{produto.categoria.toUpperCase()}</Text>
          )}
          <Text style={styles.nome}>{produto.nome}</Text>
          <Text style={styles.preco}>R$ {produto.preco.toFixed(2)}</Text>

          {/* Estoque */}
          <View style={styles.estoqueContainer}>
            <Text
              style={[
                styles.estoque,
                produto.estoque === 0 && styles.estoqueZero,
                produto.estoque > 0 && produto.estoque <= 5 && styles.estoqueBaixo,
              ]}
            >
              {produto.estoque > 0
                ? `${produto.estoque} em estoque${produto.estoque <= 5 ? ' (baixo)' : ''}`
                : 'Sem estoque'}
            </Text>
          </View>

          {/* Seletor de quantidade */}
          {produto.estoque > 0 && (
            <View style={styles.quantidadeContainer}>
              <Text style={styles.quantidadeLabel}>Quantidade:</Text>
              <View style={styles.quantidadeControls}>
                <TouchableOpacity
                  style={[styles.quantidadeButton, quantidade === 1 && styles.quantidadeButtonDisabled]}
                  onPress={diminuirQuantidade}
                  disabled={quantidade === 1}
                >
                  <Text style={[styles.quantidadeButtonText, quantidade === 1 && styles.quantidadeButtonTextDisabled]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={styles.quantidadeValue}>{quantidade}</Text>
                <TouchableOpacity
                  style={styles.quantidadeButton}
                  onPress={aumentarQuantidade}
                >
                  <Text style={styles.quantidadeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Descrição (se houver) */}
          {produto.descricao && (
            <View style={styles.descricaoContainer}>
              <Text style={styles.descricaoTitle}>Sobre</Text>
              <Text style={styles.descricao}>{produto.descricao}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Botão de adicionar ao carrinho */}
      {produto.estoque > 0 && (
        <View style={styles.footer}>
          <Button
            title={`Adicionar ${quantidade > 1 ? `${quantidade}x ` : ''}à Sacola - R$ ${(produto.preco * quantidade).toFixed(2)}`}
            onPress={handleAdicionarAoCarrinho}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  imagemContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  produtoImagem: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  produtoImagemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  produtoImagemPlaceholderText: {
    fontSize: 120,
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
    ...typography.h2,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoContainer: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -borderRadius.xl,
  },
  categoria: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  nome: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  preco: {
    ...typography.h1,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  estoqueContainer: {
    marginBottom: spacing.lg,
  },
  estoque: {
    ...typography.body,
    color: colors.textSecondary,
  },
  estoqueZero: {
    color: colors.error,
    fontWeight: '600',
  },
  estoqueBaixo: {
    color: colors.warning,
    fontWeight: '600',
  },
  quantidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  quantidadeLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  quantidadeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantidadeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButtonDisabled: {
    backgroundColor: colors.backgroundDark,
    opacity: 0.5,
  },
  quantidadeButtonText: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quantidadeButtonTextDisabled: {
    color: colors.textSecondary,
  },
  quantidadeValue: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  descricaoContainer: {
    marginTop: spacing.md,
  },
  descricaoTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descricao: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
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

