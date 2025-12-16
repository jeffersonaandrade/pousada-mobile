import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Produto } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from './Button';

interface ProductCardProps {
  produto: Produto;
  onPress: () => void;
  onAddToCart?: () => void;
}

export default function ProductCard({
  produto,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const isOutOfStock = produto.estoque === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isOutOfStock}
    >
      {/* Imagem do produto */}
      <View style={styles.imageContainer}>
        {produto.foto ? (
          <Image source={{ uri: produto.foto }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Sem estoque</Text>
          </View>
        )}
      </View>

      {/* Informações do produto */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.nome} numberOfLines={2}>
            {produto.nome}
          </Text>
          {produto.categoria && (
            <Text style={styles.categoria}>{produto.categoria}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.preco}>R$ {produto.preco.toFixed(2)}</Text>
          {!isOutOfStock && onAddToCart && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e: any) => {
                e.stopPropagation();
                onAddToCart();
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
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
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
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  nome: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  categoria: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preco: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
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
});

