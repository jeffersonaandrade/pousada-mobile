import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import RoomGrid from '../components/RoomGrid';
import ScreenWrapper from '../components/ScreenWrapper';
import SecureExitButton from '../components/SecureExitButton';
import { colors, spacing, typography } from '../theme/colors';

type GovernanceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Governance'>;
};

export default function GovernanceScreen({ navigation }: GovernanceScreenProps) {
  return (
    <ScreenWrapper scrollEnabled={false}>
      {/* Header com título e botão sair seguro */}
      <View style={styles.header}>
        <Text style={styles.title}>Governança / Limpeza</Text>
        <SecureExitButton modo="GARCOM" />
      </View>

      {/* RoomGrid em modo CLEANING */}
      <View style={styles.content}>
        <RoomGrid mode="CLEANING" />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.sm,
  },
});

