import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

type ScreenWrapperProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  /**
   * Se false, não renderiza ScrollView (útil para telas com FlatList)
   * @default true
   */
  scrollEnabled?: boolean;
};

/**
 * Componente wrapper reutilizável para telas que:
 * - Respeita SafeAreaView (notch/franjas)
 * - Evita que o teclado cubra inputs (KeyboardAvoidingView)
 * - Permite scroll se o conteúdo for maior que a tela (ScrollView)
 * 
 * IMPORTANTE: Para telas com FlatList, use scrollEnabled={false} para evitar
 * warnings do React Native sobre FlatList dentro de ScrollView.
 */
export default function ScreenWrapper({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
}: ScreenWrapperProps) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {scrollEnabled ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.scrollContent, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

