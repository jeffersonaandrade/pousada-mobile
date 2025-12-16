import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { useNFC } from '../hooks/useNFC';
import {
  criarHospede,
  buscarHospedePorPulseira,
  realizarCheckout,
  buscarPedidosPorHospede,
} from '../services/api';
import { TipoCliente, Hospede, Pedido, MetodoPagamento } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Input from '../components/Input';
import Button from '../components/Button';
import { getErrorMessage } from '../utils/errorHandler';
import { aplicarMascaraMoeda, removerMascaraMoeda } from '../utils/validators';
import { gerarResumoGastos } from '../utils/gerarResumoGastos';
import RoomGrid from '../components/RoomGrid';
import { Quarto } from '../types';

type ModoRecepcao = 'CHECKIN' | 'CHECKOUT';

export default function RecepcaoScreen() {
  const [modoRecepcao, setModoRecepcao] = useState<ModoRecepcao>('CHECKIN');
  
  // Estados do Check-in
  const [tipo, setTipo] = useState<TipoCliente>(TipoCliente.HOSPEDE);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [quartoSelecionado, setQuartoSelecionado] = useState<Quarto | null>(null);
  const [mostrarRoomGrid, setMostrarRoomGrid] = useState(false);
  const [valorEntrada, setValorEntrada] = useState('');
  const [pagoNaEntrada, setPagoNaEntrada] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [uidPulseira, setUidPulseira] = useState('');
  const [loadingCheckin, setLoadingCheckin] = useState(false);

  // Estados do Check-out
  const [hospedeCheckout, setHospedeCheckout] = useState<Hospede | null>(null);
  const [pedidosCheckout, setPedidosCheckout] = useState<Pedido[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const { lerPulseira, isReading } = useNFC();

  // Limpar formulário de check-in
  const limparFormularioCheckin = () => {
    setNome('');
    setEmail('');
    setDocumento('');
    setQuartoSelecionado(null);
    setValorEntrada('');
    setPagoNaEntrada(false);
    setMetodoPagamento(null);
    setUidPulseira('');
  };

  // Handler para gravar pulseira no check-in
  const handleGravarPulseira = async () => {
    const uid = await lerPulseira();
    if (!uid) {
      Alert.alert('Erro', 'Não foi possível ler a pulseira NFC');
      return;
    }
    setUidPulseira(uid);
    Alert.alert('Sucesso', `Pulseira gravada: ${uid}`);
  };

  // Handler para ler pulseira no check-out
  const handleLerPulseiraCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const uid = await lerPulseira();
      if (!uid) {
        Alert.alert('Erro', 'Não foi possível ler a pulseira NFC');
        return;
      }

      // Buscar hóspede pela pulseira
      const hospede = await buscarHospedePorPulseira(uid);
      setHospedeCheckout(hospede);

      // Buscar pedidos do hóspede
      try {
        const pedidos = await buscarPedidosPorHospede(hospede.id);
        setPedidosCheckout(pedidos);
      } catch (errorPedidos: unknown) {
        console.warn('Erro ao buscar pedidos:', errorPedidos);
        setPedidosCheckout([]);
      }
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
      setHospedeCheckout(null);
      setPedidosCheckout([]);
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Validar formulário de check-in
  const validarFormularioCheckin = (): boolean => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Nome completo é obrigatório');
      return false;
    }

    if (!uidPulseira.trim()) {
      Alert.alert('Erro', 'É necessário gravar a pulseira NFC');
      return false;
    }

    if (tipo === TipoCliente.DAY_USE && !documento.trim()) {
      Alert.alert('Erro', 'Documento (CPF) é obrigatório para Day Use');
      return false;
    }

    if (tipo === TipoCliente.HOSPEDE && !quartoSelecionado) {
      Alert.alert('Erro', 'Selecione um quarto para Hóspede');
      return false;
    }

    // Validar email se fornecido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Erro', 'E-mail inválido');
      return false;
    }

    // Validar pagamento imediato
    if (pagoNaEntrada) {
      if (!valorEntrada.trim()) {
        Alert.alert('Erro', 'Informe o valor da entrada para pagamento imediato');
        return false;
      }
      if (!metodoPagamento) {
        Alert.alert('Erro', 'Selecione o método de pagamento');
        return false;
      }
    }

    return true;
  };

  // Handler para valor da entrada
  const handleValorEntradaChange = (text: string) => {
    const valorFormatado = aplicarMascaraMoeda(text);
    setValorEntrada(valorFormatado);
  };

  // Função helper para Alert com Promise
  const confirmarAlert = (titulo: string, mensagem: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(titulo, mensagem, [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Confirmar',
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  // Realizar check-in
  const realizarCheckIn = async () => {
    if (!validarFormularioCheckin()) return;

    // Converter valor da entrada de formato moeda para número (float)
    let valorEntradaNumerico: number = 0;
    if (valorEntrada.trim()) {
      // Remove tudo que não é número, vírgula ou ponto, depois substitui vírgula por ponto
      const valorLimpo = valorEntrada.replace(/[^\d,.]/g, '').replace(',', '.');
      valorEntradaNumerico = parseFloat(valorLimpo || '0');
      
      if (isNaN(valorEntradaNumerico) || valorEntradaNumerico < 0) {
        Alert.alert('Erro', 'Valor da entrada inválido');
        return;
      }
    }

    // Se não pagou na entrada e há valor de entrada, mostrar confirmação
    if (!pagoNaEntrada && valorEntradaNumerico > 0) {
      const confirmar = await confirmarAlert(
        'Confirmar Fiado',
        `Este cliente ficará devendo R$ ${valorEntradaNumerico.toFixed(2).replace('.', ',')}. Confirma?`
      );

      if (!confirmar) {
        return;
      }
    }

    setLoadingCheckin(true);
    try {
      // Garantir que pagoNaEntrada seja sempre boolean (nunca undefined)
      const pagoNaEntradaBoolean: boolean = pagoNaEntrada === true;

      const data = {
        tipo,
        nome: nome.trim(),
        email: email.trim() || undefined,
        documento: documento.trim() || undefined,
        quarto: quartoSelecionado?.numero || undefined,
        uidPulseira: uidPulseira.trim(),
        valorEntrada: valorEntradaNumerico > 0 ? valorEntradaNumerico : undefined,
        pagoNaEntrada: pagoNaEntradaBoolean, // Sempre boolean: true ou false
        metodoPagamento: metodoPagamento ? metodoPagamento : undefined,
      };

      // Log do payload antes de enviar
      console.log('PAYLOAD:', JSON.stringify(data, null, 2));
      console.log('Tipo de valorEntrada:', typeof data.valorEntrada, 'Valor:', data.valorEntrada);
      console.log('Tipo de pagoNaEntrada:', typeof data.pagoNaEntrada, 'Valor:', data.pagoNaEntrada);

      await criarHospede(data);
      
      // Mensagem de sucesso baseada no pagamento
      const mensagemSucesso = pagoNaEntradaBoolean
        ? 'Check-in realizado e Entrada Paga!'
        : 'Check-in realizado com sucesso!';
      
      Alert.alert('Sucesso', mensagemSucesso);
      limparFormularioCheckin();
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoadingCheckin(false);
    }
  };

  // Receber pagamento e finalizar checkout
  const receberPagamento = async () => {
    if (!hospedeCheckout) return;

    setProcessandoPagamento(true);
    try {
      await realizarCheckout(hospedeCheckout.id);
      
      // Mensagem de sucesso com informação sobre limpeza
      const mensagemQuarto = hospedeCheckout.quarto
        ? `\n\nQuarto ${hospedeCheckout.quarto} marcado para LIMPEZA.`
        : '';
      
      Alert.alert('Sucesso', `Pagamento recebido! Pulseira liberada.${mensagemQuarto}`);
      
      // Limpar estado e voltar ao início
      setHospedeCheckout(null);
      setPedidosCheckout([]);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setProcessandoPagamento(false);
    }
  };

  // Calcular total a pagar
  const calcularTotal = (): number => {
    if (!hospedeCheckout) return 0;
    
    // Usar dividaAtual do hóspede (já calculada pelo backend)
    // O backend já considera a entrada paga no cálculo da dívida
    return hospedeCheckout.dividaAtual || 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com Abas */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.tab,
            modoRecepcao === 'CHECKIN' && styles.tabActive,
          ]}
          onPress={() => {
            setModoRecepcao('CHECKIN');
            setHospedeCheckout(null);
            setPedidosCheckout([]);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              modoRecepcao === 'CHECKIN' && styles.tabTextActive,
            ]}
          >
            Check-in
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            modoRecepcao === 'CHECKOUT' && styles.tabActive,
          ]}
          onPress={() => {
            setModoRecepcao('CHECKOUT');
            limparFormularioCheckin();
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              modoRecepcao === 'CHECKOUT' && styles.tabTextActive,
            ]}
          >
            Check-out
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {modoRecepcao === 'CHECKIN' ? (
          // TELA DE CHECK-IN
          <View style={styles.checkinContainer}>
            <Text style={styles.sectionTitle}>Dados do Cliente</Text>

            {/* Tipo de Cliente */}
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  tipo === TipoCliente.HOSPEDE && styles.radioButtonActive,
                ]}
                onPress={() => setTipo(TipoCliente.HOSPEDE)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.radioText,
                    tipo === TipoCliente.HOSPEDE && styles.radioTextActive,
                  ]}
                >
                  Hóspede
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  tipo === TipoCliente.DAY_USE && styles.radioButtonActive,
                ]}
                onPress={() => setTipo(TipoCliente.DAY_USE)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.radioText,
                    tipo === TipoCliente.DAY_USE && styles.radioTextActive,
                  ]}
                >
                  Day Use
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nome Completo */}
            <Input
              label="Nome Completo *"
              value={nome}
              onChangeText={setNome}
              placeholder="Digite o nome completo"
              style={styles.inputTablet}
            />

            {/* E-mail */}
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="exemplo@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.inputTablet}
            />

            {/* Documento (CPF) */}
            <Input
              label={tipo === TipoCliente.DAY_USE ? 'CPF *' : 'CPF'}
              value={documento}
              onChangeText={setDocumento}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              style={styles.inputTablet}
            />

            {/* Seleção de Quarto (apenas para Hóspede) */}
            {tipo === TipoCliente.HOSPEDE && (
              <View>
                <Text style={styles.inputLabel}>Quarto *</Text>
                <TouchableOpacity
                  style={styles.quartoButton}
                  onPress={() => setMostrarRoomGrid(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quartoButtonText,
                      !quartoSelecionado && styles.quartoButtonTextPlaceholder,
                    ]}
                  >
                    {quartoSelecionado
                      ? `Quarto ${quartoSelecionado.numero}`
                      : 'Selecionar Quarto'}
                  </Text>
                  <Text style={styles.quartoButtonIcon}>▼</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Valor da Diária/Entrada */}
            <Text style={styles.inputLabel}>Valor da Diária / Entrada (R$)</Text>
            <Input
              value={valorEntrada}
              onChangeText={handleValorEntradaChange}
              placeholder="R$ 0,00"
              keyboardType="numeric"
              style={styles.inputTablet}
            />

            {/* Área de Pagamento Imediato */}
            <View style={[
              styles.pagamentoContainer,
              pagoNaEntrada && styles.pagamentoContainerActive
            ]}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Pagamento Imediato?</Text>
                <Switch
                  value={pagoNaEntrada}
                  onValueChange={(value) => {
                    setPagoNaEntrada(value);
                    if (!value) {
                      setMetodoPagamento(null);
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={pagoNaEntrada ? '#fff' : '#f4f3f4'}
                />
              </View>

              {/* Seleção de Método de Pagamento */}
              {pagoNaEntrada && (
                <View style={styles.metodoContainer}>
                  <Text style={styles.metodoLabel}>Método de Pagamento *</Text>
                  <View style={styles.metodoButtons}>
                    <TouchableOpacity
                      style={[
                        styles.metodoButton,
                        metodoPagamento === MetodoPagamento.DINHEIRO && styles.metodoButtonActive,
                      ]}
                      onPress={() => setMetodoPagamento(MetodoPagamento.DINHEIRO)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.metodoButtonText,
                          metodoPagamento === MetodoPagamento.DINHEIRO && styles.metodoButtonTextActive,
                        ]}
                      >
                        Dinheiro
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.metodoButton,
                        metodoPagamento === MetodoPagamento.PIX && styles.metodoButtonActive,
                      ]}
                      onPress={() => setMetodoPagamento(MetodoPagamento.PIX)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.metodoButtonText,
                          metodoPagamento === MetodoPagamento.PIX && styles.metodoButtonTextActive,
                        ]}
                      >
                        Pix
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.metodoButton,
                        metodoPagamento === MetodoPagamento.CREDITO && styles.metodoButtonActive,
                      ]}
                      onPress={() => setMetodoPagamento(MetodoPagamento.CREDITO)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.metodoButtonText,
                          metodoPagamento === MetodoPagamento.CREDITO && styles.metodoButtonTextActive,
                        ]}
                      >
                        Crédito
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.metodoButton,
                        metodoPagamento === MetodoPagamento.DEBITO && styles.metodoButtonActive,
                      ]}
                      onPress={() => setMetodoPagamento(MetodoPagamento.DEBITO)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.metodoButtonText,
                          metodoPagamento === MetodoPagamento.DEBITO && styles.metodoButtonTextActive,
                        ]}
                      >
                        Débito
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Vínculo NFC */}
            <Text style={styles.sectionTitle}>Vínculo NFC</Text>
            <View style={styles.nfcContainer}>
              {uidPulseira ? (
                <View style={styles.pulseiraGravada}>
                  <Text style={styles.pulseiraLabel}>Pulseira Gravada:</Text>
                  <Text style={styles.pulseiraUID}>{uidPulseira}</Text>
                  <Button
                    title="Regravar Pulseira"
                    onPress={handleGravarPulseira}
                    variant="outline"
                    size="large"
                    loading={isReading}
                    fullWidth
                    style={styles.buttonTablet}
                  />
                </View>
              ) : (
                <Button
                  title="Gravar Pulseira"
                  onPress={handleGravarPulseira}
                  variant="primary"
                  size="large"
                  loading={isReading}
                  fullWidth
                  style={styles.buttonTablet}
                />
              )}
            </View>

            {/* Botão Confirmar Entrada */}
            <Button
              title={pagoNaEntrada ? "Confirmar e Receber" : "Confirmar Entrada"}
              onPress={realizarCheckIn}
              variant="primary"
              size="large"
              loading={loadingCheckin}
              disabled={!uidPulseira}
              fullWidth
              style={styles.buttonTablet}
            />
          </View>
        ) : (
          // TELA DE CHECK-OUT
          <View style={styles.checkoutContainer}>
            {!hospedeCheckout ? (
              // Estado de espera - ler pulseira
              <View style={styles.esperaContainer}>
                <Text style={styles.esperaIcon}>📱</Text>
                <Text style={styles.esperaTitle}>
                  Aproxime a Pulseira para fechar a conta
                </Text>
                <Button
                  title="Ler Pulseira NFC"
                  onPress={handleLerPulseiraCheckout}
                  variant="primary"
                  size="large"
                  loading={loadingCheckout || isReading}
                  fullWidth
                  style={styles.buttonTablet}
                />
              </View>
            ) : (
              // Resumo de conta
              <View style={styles.resumoContainer}>
                <Text style={styles.sectionTitle}>Resumo de Conta</Text>

                {/* Informações do Cliente */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{hospedeCheckout.nome}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>
                    {hospedeCheckout.tipo === TipoCliente.HOSPEDE ? 'Quarto:' : 'Tipo:'}
                  </Text>
                  <Text style={styles.infoValue}>
                    {hospedeCheckout.quarto || hospedeCheckout.tipo}
                  </Text>
                </View>

                {/* Lista de Consumo */}
                {pedidosCheckout.length > 0 && (
                  <View style={styles.consumoContainer}>
                    <Text style={styles.consumoTitle}>Consumo:</Text>
                    {pedidosCheckout.map((pedido) => (
                      <View key={pedido.id} style={styles.consumoItem}>
                        <Text style={styles.consumoProduto}>
                          {pedido.produto?.nome || 'Produto'}
                        </Text>
                        <Text style={styles.consumoValor}>
                          R$ {pedido.valor.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Entrada já paga */}
                {hospedeCheckout.entrada && hospedeCheckout.entrada > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Entrada Paga:</Text>
                    <Text style={styles.infoValue}>
                      R$ {hospedeCheckout.entrada.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                )}

                {/* TOTAL A PAGAR */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
                  <Text style={styles.totalValue}>
                    R$ {calcularTotal().toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {/* Botão Receber Pagamento */}
                <Button
                  title="Receber Pagamento"
                  onPress={receberPagamento}
                  variant="primary"
                  size="large"
                  loading={processandoPagamento}
                  fullWidth
                  style={styles.buttonTablet}
                />

                {/* Botão para ler outra pulseira */}
                <Button
                  title="Ler Outra Pulseira"
                  onPress={() => {
                    setHospedeCheckout(null);
                    setPedidosCheckout([]);
                  }}
                  variant="outline"
                  size="large"
                  fullWidth
                  style={styles.buttonTablet}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Seleção de Quartos */}
      <RoomGrid
        visible={mostrarRoomGrid}
        onClose={() => setMostrarRoomGrid(false)}
        onSelectRoom={(quarto) => {
          setQuartoSelecionado(quarto);
        }}
        allowSelection={tipo === TipoCliente.HOSPEDE}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  checkinContainer: {
    gap: spacing.lg,
  },
  checkoutContainer: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  radioButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  radioText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  inputTablet: {
    fontSize: 20,
    paddingVertical: spacing.lg,
    minHeight: 64,
  },
  inputLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nfcContainer: {
    marginVertical: spacing.md,
  },
  pulseiraGravada: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pulseiraLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pulseiraUID: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  buttonTablet: {
    minHeight: 64,
    paddingVertical: spacing.lg,
  },
  pagamentoContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pagamentoContainerActive: {
    backgroundColor: colors.success + '15', // Verde claro
    borderColor: colors.success,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  metodoContainer: {
    marginTop: spacing.md,
  },
  metodoLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metodoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metodoButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  metodoButtonActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '20',
  },
  metodoButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metodoButtonTextActive: {
    color: colors.success,
    fontWeight: 'bold',
  },
  esperaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  esperaIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  esperaTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  resumoContainer: {
    gap: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  consumoContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  consumoTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  consumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  consumoProduto: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  consumoValor: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  totalContainer: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  totalLabel: {
    ...typography.body,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  totalValue: {
    ...typography.h1,
    color: '#fff',
    fontWeight: 'bold',
  },
  quartoButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  quartoButtonText: {
    ...typography.body,
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  quartoButtonTextPlaceholder: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  quartoButtonIcon: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

