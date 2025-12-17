import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Share } from 'react-native';
import { useNFC } from '../hooks/useNFC';
import {
  criarHospede,
  buscarHospedePorPulseira,
  realizarCheckout,
  buscarPedidosPorHospede,
} from '../services/api';
import { TipoCliente, Hospede, Pedido } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { getErrorMessage } from '../utils/errorHandler';
import { validarNumero, aplicarMascaraMoeda, removerMascaraMoeda } from '../utils/validators';
import { gerarResumoGastos } from '../utils/gerarResumoGastos';
import SecureExitButton from '../components/SecureExitButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppStore } from '../store/appStore';

type ModoRecepcao = 'CHECKIN' | 'CHECKOUT';

export default function CheckInScreen() {
  const { modo: modoApp } = useAppStore();
  const [modoRecepcao, setModoRecepcao] = useState<ModoRecepcao>('CHECKIN');
  const [tipo, setTipo] = useState<TipoCliente>(TipoCliente.HOSPEDE);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [quarto, setQuarto] = useState('');
  const [limiteGasto, setLimiteGasto] = useState('');
  const [uidPulseira, setUidPulseira] = useState('');
  const [hospedeCheckout, setHospedeCheckout] = useState<Hospede | null>(null);
  const [pedidosCheckout, setPedidosCheckout] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingImprimir, setLoadingImprimir] = useState(false);

  const { lerPulseira, isReading } = useNFC();

  const lerPulseiraHandler = async () => {
    const uid = await lerPulseira();
    if (!uid) {
      Alert.alert('Erro', 'Não foi possível ler a pulseira');
      return;
    }

    if (modoRecepcao === 'CHECKIN') {
      // Modo Check-in: apenas armazena o UID
      setUidPulseira(uid);
      Alert.alert('Sucesso', `Pulseira lida: ${uid}`);
    } else {
      // Modo Check-out: busca o hóspede e seus pedidos
      setLoading(true);
      try {
        const hospede = await buscarHospedePorPulseira(uid);
        setHospedeCheckout(hospede);
        setUidPulseira(uid);

        // Buscar pedidos do hóspede para o resumo
        try {
          const pedidos = await buscarPedidosPorHospede(hospede.id);
          setPedidosCheckout(pedidos);
        } catch (errorPedidos: unknown) {
          // Se não conseguir buscar pedidos, continua sem eles
          console.warn('Erro ao buscar pedidos:', errorPedidos);
          setPedidosCheckout([]);
        }
      } catch (error: unknown) {
        Alert.alert('Erro', getErrorMessage(error));
        setHospedeCheckout(null);
        setPedidosCheckout([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const validarFormulario = (): boolean => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return false;
    }

    if (!uidPulseira.trim()) {
      Alert.alert('Erro', 'É necessário ler a pulseira NFC');
      return false;
    }

    if (tipo === TipoCliente.DAY_USE && !documento.trim()) {
      Alert.alert('Erro', 'Documento é obrigatório para Day Use');
      return false;
    }

    if (tipo === TipoCliente.HOSPEDE && !quarto.trim()) {
      Alert.alert('Erro', 'Quarto é obrigatório para Hóspede');
      return false;
    }

    return true;
  };

  const handleLimiteGastoChange = (text: string) => {
    // Aplica máscara de moeda enquanto digita
    const valorFormatado = aplicarMascaraMoeda(text);
    setLimiteGasto(valorFormatado);
  };

  const realizarCheckIn = async () => {
    if (!validarFormulario()) return;

    // Converter limite de gasto de formato moeda para número
    let limiteGastoNumerico: number | undefined = undefined;
    if (limiteGasto.trim()) {
      limiteGastoNumerico = removerMascaraMoeda(limiteGasto);
      if (limiteGastoNumerico <= 0) {
        Alert.alert('Erro', 'Limite de gasto deve ser um valor positivo');
        return;
      }
    }

    setLoading(true);
    try {
      const data = {
        tipo,
        nome: nome.trim(),
        documento: documento.trim() || undefined,
        quarto: quarto.trim() || undefined,
        uidPulseira: uidPulseira.trim(),
        limiteGasto: limiteGastoNumerico,
      };

      await criarHospede(data);
      Alert.alert('Sucesso', 'Check-in realizado com sucesso!');
      
      // Limpar formulário
      setNome('');
      setDocumento('');
      setQuarto('');
      setLimiteGasto('');
      setUidPulseira('');
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const realizarCheckoutHandler = async () => {
    if (!hospedeCheckout) {
      Alert.alert('Erro', 'Nenhum hóspede encontrado. Leia a pulseira primeiro.');
      return;
    }

    if (hospedeCheckout.dividaAtual === 0) {
      Alert.alert('Atenção', 'Este hóspede não possui dívida pendente.');
      return;
    }

    Alert.alert(
      'Confirmar Check-out',
      `Confirmar pagamento de R$ ${hospedeCheckout.dividaAtual.toFixed(2)} para ${hospedeCheckout.nome}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              await realizarCheckout(hospedeCheckout.id);
              Alert.alert(
                'Sucesso',
                `Check-out realizado com sucesso!\nPulseira liberada para ${hospedeCheckout.nome}.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Limpar dados
                      setHospedeCheckout(null);
                      setUidPulseira('');
                    },
                  },
                ]
              );
            } catch (error: unknown) {
              Alert.alert('Erro', getErrorMessage(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const imprimirResumoGastos = async () => {
    if (!hospedeCheckout) {
      Alert.alert('Erro', 'Nenhum hóspede encontrado. Leia a pulseira primeiro.');
      return;
    }

    setLoadingImprimir(true);
    try {
      // Se não tiver pedidos carregados, buscar novamente
      let pedidos = pedidosCheckout;
      if (pedidos.length === 0) {
        pedidos = await buscarPedidosPorHospede(hospedeCheckout.id);
        setPedidosCheckout(pedidos);
      }

      // Gerar texto formatado
      const textoResumo = gerarResumoGastos(hospedeCheckout, pedidos);

      // Compartilhar/Imprimir
      const result = await Share.share({
        message: textoResumo,
        title: `Resumo de Gastos - ${hospedeCheckout.nome}`,
      });

      // Se o usuário cancelou, não é um erro
      if (result.action === Share.dismissedAction) {
        return;
      }
    } catch (error: unknown) {
      // Share.share pode lançar erro em alguns casos
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoadingImprimir(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Header customizado */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>
          {modoRecepcao === 'CHECKIN' ? 'Check-in de Hóspede' : 'Check-out de Hóspede'}
        </Text>
      </View>
      <View style={styles.content}>
          <Text style={styles.title}>
            {modoRecepcao === 'CHECKIN' ? 'Check-in de Hóspede' : 'Check-out de Hóspede'}
          </Text>

          {/* Seletor de Modo */}
          <View style={styles.modoContainer}>
            <TouchableOpacity
              style={[styles.modoButton, modoRecepcao === 'CHECKIN' && styles.modoButtonActive]}
              onPress={() => {
                setModoRecepcao('CHECKIN');
                setHospedeCheckout(null);
                setUidPulseira('');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modoButtonText,
                  modoRecepcao === 'CHECKIN' && styles.modoButtonTextActive,
                ]}
              >
                Check-in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modoButton, modoRecepcao === 'CHECKOUT' && styles.modoButtonActive]}
              onPress={() => {
                setModoRecepcao('CHECKOUT');
                setNome('');
                setDocumento('');
                setQuarto('');
                setLimiteGasto('');
                setUidPulseira('');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modoButtonText,
                  modoRecepcao === 'CHECKOUT' && styles.modoButtonTextActive,
                ]}
              >
                Check-out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formulário de Check-in (apenas no modo CHECKIN) */}
          {modoRecepcao === 'CHECKIN' && (
            <>
              {/* Tipo de Cliente */}
              <Text style={styles.label}>Tipo de Cliente:</Text>
              <View style={styles.tipoContainer}>
                {Object.values(TipoCliente).map((t: TipoCliente) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tipoButton,
                      tipo === t && styles.tipoButtonActive,
                    ]}
                    onPress={() => setTipo(t)}
                  >
                    <Text
                      style={[
                        styles.tipoButtonText,
                        tipo === t && styles.tipoButtonTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nome */}
              <Input
                label="Nome Completo"
                value={nome}
                onChangeText={setNome}
                placeholder="Digite o nome completo"
              />

              {/* Documento (Day Use) */}
              {tipo === TipoCliente.DAY_USE && (
                <Input
                  label="Documento (CPF/RG)"
                  value={documento}
                  onChangeText={setDocumento}
                  placeholder="Digite o documento"
                  keyboardType="numeric"
                />
              )}

              {/* Quarto (Hóspede) */}
              {tipo === TipoCliente.HOSPEDE && (
                <Input
                  label="Quarto"
                  value={quarto}
                  onChangeText={setQuarto}
                  placeholder="Ex: 101, 205"
                />
              )}

              {/* Limite de Gasto (Opcional para Day Use) */}
              {tipo === TipoCliente.DAY_USE && (
                <Input
                  label="Limite de Gasto (Opcional)"
                  value={limiteGasto}
                  onChangeText={handleLimiteGastoChange}
                  placeholder="R$ 0,00"
                  keyboardType="numeric"
                />
              )}
            </>
          )}

          {/* Modo Check-out: Mostrar informações do hóspede */}
          {modoRecepcao === 'CHECKOUT' && hospedeCheckout && (
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutTitle}>Informações do Hóspede</Text>
              <View style={styles.checkoutCard}>
                <Text style={styles.checkoutNome}>{hospedeCheckout.nome}</Text>
                <Text style={styles.checkoutTipo}>Tipo: {hospedeCheckout.tipo}</Text>
                {hospedeCheckout.quarto && (
                  <Text style={styles.checkoutQuarto}>Quarto: {hospedeCheckout.quarto}</Text>
                )}
                <View style={styles.checkoutDividaContainer}>
                  <Text style={styles.checkoutDividaLabel}>Dívida Atual:</Text>
                  <Text style={styles.checkoutDividaValor}>
                    R$ {hospedeCheckout.dividaAtual.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Botão de Imprimir Resumo */}
              {pedidosCheckout.length > 0 && (
                <Button
                  title="📄 Imprimir Resumo de Gastos"
                  onPress={imprimirResumoGastos}
                  disabled={loadingImprimir}
                  loading={loadingImprimir}
                  variant="secondary"
                  size="medium"
                  fullWidth
                  style={styles.imprimirButton}
                />
              )}
            </View>
          )}

          {/* Pulseira NFC */}
          <View style={styles.nfcContainer}>
            <Text style={styles.label}>Pulseira NFC:</Text>
            <TouchableOpacity
              style={[styles.nfcButton, isReading && styles.nfcButtonReading]}
              onPress={lerPulseiraHandler}
              disabled={isReading || loading}
              activeOpacity={0.8}
            >
              {isReading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nfcButtonText}>
                  {uidPulseira ? `✓ ${uidPulseira}` : '📱 Ler Pulseira'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Botão de ação */}
          {modoRecepcao === 'CHECKIN' ? (
            <Button
              title="Realizar Check-in"
              onPress={realizarCheckIn}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
            />
          ) : (
            <Button
              title={
                hospedeCheckout
                  ? `Realizar Check-out - R$ ${hospedeCheckout.dividaAtual.toFixed(2)}`
                  : 'Ler Pulseira para Check-out'
              }
              onPress={realizarCheckoutHandler}
              disabled={loading || !hospedeCheckout || hospedeCheckout.dividaAtual === 0}
              loading={loading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
            />
          )}
        </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  customHeader: {
    backgroundColor: colors.primary,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
    color: colors.text,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  tipoContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipoButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  tipoButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tipoButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tipoButtonTextActive: {
    color: '#FFFFFF',
  },
  nfcContainer: {
    marginBottom: spacing.lg,
  },
  nfcButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  nfcButtonReading: {
    backgroundColor: colors.primaryDark,
    opacity: 0.8,
  },
  nfcButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  modoContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modoButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  modoButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modoButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modoButtonTextActive: {
    color: '#FFFFFF',
  },
  checkoutInfo: {
    marginBottom: spacing.lg,
  },
  checkoutTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
  },
  checkoutCard: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkoutNome: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  checkoutTipo: {
    ...typography.body,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  checkoutQuarto: {
    ...typography.body,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  checkoutDividaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutDividaLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  checkoutDividaValor: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.primary,
  },
  imprimirButton: {
    marginTop: spacing.md,
  },
});
