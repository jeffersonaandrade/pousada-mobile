import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/appStore';
import {
  criarPedidos,
  buscarHospedePorPulseira,
  buscarHospedePorQuarto,
  buscarHospedePorNome,
} from '../services/api';
import { Produto, Hospede } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/errorHandler';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import { useNFC } from '../hooks/useNFC';

type CarrinhoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Carrinho'>;
};

type ModoSelecao = 'PULSEIRA' | 'MANUAL';

export default function CarrinhoScreen({ navigation }: CarrinhoScreenProps) {
  const {
    carrinho,
    hospedeSelecionado,
    setHospedeSelecionado,
    removerDoCarrinho,
    incrementarItem,
    decrementarItem,
    limparCarrinho,
    modo,
    usuario,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [modoSelecao, setModoSelecao] = useState<ModoSelecao>('PULSEIRA');
  const [quarto, setQuarto] = useState('');
  const [nome, setNome] = useState('');
  const [hospedeManual, setHospedeManual] = useState<Hospede | null>(null);
  const [buscandoHospede, setBuscandoHospede] = useState(false);
  const [mostrarModalPin, setMostrarModalPin] = useState(false);
  const [pinGerente, setPinGerente] = useState('');
  const { lerPulseira, isReading } = useNFC();

  const calcularTotal = () => {
    return carrinho.reduce(
      (total: number, item: { produto: Produto; quantidade: number }) => total + item.produto.preco * item.quantidade,
      0
    );
  };

  // Buscar hóspede por pulseira
  const handleLerPulseira = async () => {
    const uid = await lerPulseira();
    if (!uid) {
      Alert.alert('Erro', 'Não foi possível ler a pulseira');
      return;
    }

    setBuscandoHospede(true);
    try {
      const hospede = await buscarHospedePorPulseira(uid);
      setHospedeSelecionado(hospede);
      setHospedeManual(null);
      Alert.alert('Sucesso', `Hóspede identificado: ${hospede.nome}`);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setBuscandoHospede(false);
    }
  };

  // Buscar hóspede por quarto
  const handleBuscarPorQuarto = async () => {
    if (!quarto.trim()) {
      Alert.alert('Erro', 'Informe o número do quarto');
      return;
    }

    setBuscandoHospede(true);
    try {
      const hospede = await buscarHospedePorQuarto(quarto.trim());
      setHospedeManual(hospede);
      setHospedeSelecionado(null);
      Alert.alert('Sucesso', `Hóspede encontrado: ${hospede.nome}`);
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
      setHospedeManual(null);
    } finally {
      setBuscandoHospede(false);
    }
  };

  // Buscar hóspede por nome
  const handleBuscarPorNome = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Informe o nome do hóspede');
      return;
    }

    setBuscandoHospede(true);
    try {
      const hospedes = await buscarHospedePorNome(nome.trim());
      if (hospedes.length === 0) {
        Alert.alert('Atenção', 'Nenhum hóspede encontrado com este nome');
        setHospedeManual(null);
      } else if (hospedes.length === 1) {
        setHospedeManual(hospedes[0]);
        setHospedeSelecionado(null);
        Alert.alert('Sucesso', `Hóspede encontrado: ${hospedes[0].nome}`);
      } else {
        // Múltiplos resultados - por enquanto pega o primeiro
        // TODO: Implementar seleção de múltiplos resultados
        setHospedeManual(hospedes[0]);
        setHospedeSelecionado(null);
        Alert.alert(
          'Atenção',
          `Múltiplos hóspedes encontrados. Selecionado: ${hospedes[0].nome}`
        );
      }
    } catch (error: unknown) {
      Alert.alert('Erro', getErrorMessage(error));
      setHospedeManual(null);
    } finally {
      setBuscandoHospede(false);
    }
  };

  const validarLimiteGasto = (): { valido: boolean; mensagem?: string } => {
    const hospede = hospedeSelecionado || hospedeManual;
    if (!hospede) {
      return { valido: false, mensagem: 'Nenhum hóspede selecionado' };
    }

    const total = calcularTotal();
    const dividaAtual = hospede.dividaAtual;
    const totalComDivida = total + dividaAtual;

    // Validar limite de gasto para Day Use
    if (hospede.tipo === 'DAY_USE' && hospede.limiteGasto) {
      if (totalComDivida > hospede.limiteGasto) {
        const disponivel = hospede.limiteGasto - dividaAtual;
        return {
          valido: false,
          mensagem: `Limite de gasto excedido! Disponível: R$ ${disponivel.toFixed(2)}`,
        };
      }
    }

    return { valido: true };
  };

  const finalizarPedido = async () => {
    // No modo KIOSK, é obrigatório ter hóspede selecionado (via pulseira)
    if (modo === 'KIOSK' && !hospedeSelecionado) {
      Alert.alert('Erro', 'Leia a pulseira do hóspede primeiro');
      return;
    }

    // No modo GARCOM
    if (modo === 'GARCOM') {
      if (!usuario || !usuario.pin) {
        Alert.alert('Erro', 'Garçom não autenticado');
        return;
      }

      // Se for modo MANUAL (sem pulseira), precisa de PIN de gerente
      if (modoSelecao === 'MANUAL') {
        const hospede = hospedeManual;
        if (!hospede) {
          Alert.alert('Erro', 'Busque o hóspede pelo quarto ou nome primeiro');
          return;
        }

        // Abrir modal para PIN de gerente
        setMostrarModalPin(true);
        return;
      }

      // Se for modo PULSEIRA mas não tiver hóspede, tentar ler
      if (modoSelecao === 'PULSEIRA' && !hospedeSelecionado) {
        Alert.alert('Atenção', 'Leia a pulseira do hóspede primeiro');
        return;
      }
    }

    if (carrinho.length === 0) {
      Alert.alert('Erro', 'Carrinho vazio');
      return;
    }

    // Validar limite de gasto apenas se houver hóspede selecionado
    const hospedeAtual = hospedeSelecionado || hospedeManual;
    if (hospedeAtual) {
      const validacao = validarLimiteGasto();
      if (!validacao.valido) {
        Alert.alert('Atenção', validacao.mensagem || 'Não foi possível validar o limite de gasto');
        return;
      }
    }

    // Validar estoque
    for (const item of carrinho) {
      if (item.produto.estoque < item.quantidade) {
        Alert.alert(
          'Erro',
          `Estoque insuficiente para ${item.produto.nome}. Disponível: ${item.produto.estoque}`
        );
        return;
      }
    }

    // Esta função será chamada após confirmar o PIN de gerente (se necessário)
    const processarPedido = async (managerPin?: string) => {
      setLoading(true);
      try {
        // Determinar autenticação baseado no modo
        let hospedeId: number | undefined;
        let uidPulseira: string | undefined;
        let pinGarcom: string | undefined;

        if (modo === 'KIOSK') {
          // Modo Kiosk: obrigatório ter hóspede selecionado via pulseira
          if (!hospedeSelecionado) {
            throw new Error('Hóspede não selecionado');
          }
          hospedeId = hospedeSelecionado.id;
          uidPulseira = hospedeSelecionado.uidPulseira;
        } else if (modo === 'GARCOM') {
          // Modo Garçom
          if (modoSelecao === 'PULSEIRA' && hospedeSelecionado) {
            // Via pulseira: não precisa de PIN de gerente
            hospedeId = hospedeSelecionado.id;
            uidPulseira = hospedeSelecionado.uidPulseira;
          } else if (modoSelecao === 'MANUAL' && hospedeManual) {
            // Via manual: precisa de PIN de gerente
            if (!managerPin) {
              throw new Error('PIN de gerente obrigatório para pedidos manuais');
            }
            hospedeId = hospedeManual.id;
          }
          // O PIN do garçom sempre é enviado para autenticação
          pinGarcom = usuario?.pin;
        }

        // Preparar items no formato esperado pelo backend
        const items = carrinho.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        }));

        // Criar todos os pedidos em uma única requisição
        await criarPedidos(items, {
          hospedeId,
          uidPulseira,
          managerPin,
          pinGarcom,
          usuarioId: usuario?.id, // Adicionar ID do garçom logado
        });

        // Limpar carrinho apenas em caso de sucesso
        limparCarrinho();
        setHospedeManual(null);
        setQuarto('');
        setNome('');

        Alert.alert(
          'Sucesso',
          'Pedidos enviados para a cozinha!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } catch (error: unknown) {
        const status = (error as any)?.status || (error as any)?.response?.status;
        const errorData = (error as any)?.response?.data;
        const errorMessage = errorData?.error || getErrorMessage(error);

        // Tratar erro 403: Limite do Day Use atingido
        if (status === 403) {
          // Verificar se é erro de limite ou de PIN de gerente
          if (errorMessage.toLowerCase().includes('limite') || errorMessage.toLowerCase().includes('day use')) {
            Alert.alert(
              'Limite Atingido',
              'Limite do Day Use atingido. Por favor, vá à recepção.',
              [{ text: 'OK', style: 'destructive' }]
            );
          } else {
            // Erro de PIN de gerente
            Alert.alert(
              'Permissão Negada',
              'PIN de Gerente inválido ou sem permissão',
              [{ text: 'OK', style: 'destructive' }]
            );
          }
        } 
        // Tratar erro 400: Estoque insuficiente
        else if (status === 400) {
          // Tentar extrair o nome do produto da mensagem de erro
          const produtoMatch = errorMessage.match(/produto[:\s]+([^.\n]+)/i) || 
                              errorMessage.match(/([^.\n]+)\s+sem\s+estoque/i) ||
                              errorMessage.match(/estoque.*?para\s+([^.\n]+)/i);
          
          if (produtoMatch && produtoMatch[1]) {
            Alert.alert(
              'Estoque Insuficiente',
              `${produtoMatch[1].trim()} está sem estoque disponível.`,
              [{ text: 'OK', style: 'destructive' }]
            );
          } else {
            Alert.alert(
              'Estoque Insuficiente',
              errorMessage || 'Um ou mais produtos estão sem estoque disponível.',
              [{ text: 'OK', style: 'destructive' }]
            );
          }
        } 
        // Outros erros
        else {
          Alert.alert('Erro', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    // Se chegou aqui, é modo pulseira ou kiosk - processar diretamente
    await processarPedido();
  };

  const handleConfirmarPinGerente = async () => {
    if (!pinGerente.trim()) {
      Alert.alert('Erro', 'Informe o PIN do gerente');
      return;
    }

    const pin = pinGerente.trim();
    
    // Processar pedido com PIN de gerente
    setLoading(true);
    try {
      const hospedeAtual = hospedeManual;
      if (!hospedeAtual) {
        throw new Error('Hóspede não selecionado');
      }

      // Validar limite de gasto
      const validacao = validarLimiteGasto();
      if (!validacao.valido) {
        Alert.alert('Atenção', validacao.mensagem || 'Não foi possível validar o limite de gasto');
        setLoading(false);
        return;
      }

      // Validar estoque
      for (const item of carrinho) {
        if (item.produto.estoque < item.quantidade) {
          Alert.alert(
            'Erro',
            `Estoque insuficiente para ${item.produto.nome}. Disponível: ${item.produto.estoque}`
          );
          setLoading(false);
          return;
        }
      }

      const pinGarcom = usuario?.pin;

      // Preparar items no formato esperado pelo backend
      const items = carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      }));

      // Criar todos os pedidos em uma única requisição
      await criarPedidos(items, {
        hospedeId: hospedeAtual.id,
        managerPin: pin,
        pinGarcom,
        usuarioId: usuario?.id, // Adicionar ID do garçom logado
      });

      // Limpar carrinho apenas em caso de sucesso
      limparCarrinho();
      setHospedeManual(null);
      setQuarto('');
      setNome('');

      // Fechar modal apenas se sucesso
      setMostrarModalPin(false);
      setPinGerente('');

      Alert.alert(
        'Sucesso',
        'Pedidos enviados para a cozinha!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: unknown) {
      const status = (error as any)?.status || (error as any)?.response?.status;
      const errorData = (error as any)?.response?.data;
      const errorMessage = errorData?.error || getErrorMessage(error);

      // Tratar erro 403: Limite do Day Use ou PIN de gerente
      if (status === 403) {
        // Limpar PIN e manter modal aberto para nova tentativa
        setPinGerente('');
        
        // Verificar se é erro de limite ou de PIN de gerente
        if (errorMessage.toLowerCase().includes('limite') || errorMessage.toLowerCase().includes('day use')) {
          Alert.alert(
            'Limite Atingido',
            'Limite do Day Use atingido. Por favor, vá à recepção.',
            [
              {
                text: 'OK',
                style: 'destructive',
                onPress: () => {
                  // Fechar modal e voltar
                  setMostrarModalPin(false);
                },
              },
            ]
          );
        } else {
          // Erro de PIN de gerente
          Alert.alert(
            'Permissão Negada',
            'PIN de Gerente inválido ou sem permissão. Tente novamente.',
            [
              {
                text: 'OK',
                style: 'destructive',
                onPress: () => {
                  // Modal permanece aberto para nova tentativa
                },
              },
            ]
          );
        }
      } 
      // Tratar erro 400: Estoque insuficiente
      else if (status === 400) {
        // Limpar PIN e manter modal aberto
        setPinGerente('');
        
        // Tentar extrair o nome do produto da mensagem de erro
        const produtoMatch = errorMessage.match(/produto[:\s]+([^.\n]+)/i) || 
                            errorMessage.match(/([^.\n]+)\s+sem\s+estoque/i) ||
                            errorMessage.match(/estoque.*?para\s+([^.\n]+)/i);
        
        if (produtoMatch && produtoMatch[1]) {
          Alert.alert(
            'Estoque Insuficiente',
            `${produtoMatch[1].trim()} está sem estoque disponível.`,
            [
              {
                text: 'OK',
                style: 'destructive',
                onPress: () => {
                  // Fechar modal
                  setMostrarModalPin(false);
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Estoque Insuficiente',
            errorMessage || 'Um ou mais produtos estão sem estoque disponível.',
            [
              {
                text: 'OK',
                style: 'destructive',
                onPress: () => {
                  // Fechar modal
                  setMostrarModalPin(false);
                },
              },
            ]
          );
        }
      } 
      // Outros erros
      else {
        // Limpar PIN mas manter modal aberto
        setPinGerente('');
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: typeof carrinho[0] }) => {
    const podeIncrementar = item.quantidade < item.produto.estoque;
    const podeDecrementar = item.quantidade > 1;

    return (
      <View style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNome}>{item.produto.nome}</Text>
          <Text style={styles.itemPrecoUnitario}>
            R$ {item.produto.preco.toFixed(2)} cada
          </Text>
          <Text style={styles.itemTotal}>
            R$ {(item.produto.preco * item.quantidade).toFixed(2)}
          </Text>
        </View>
        <View style={styles.itemControles}>
          {/* Botão Diminuir */}
          <TouchableOpacity
            style={[
              styles.controleButton,
              !podeDecrementar && styles.controleButtonDisabled,
            ]}
            onPress={() => decrementarItem(item.produto.id)}
            disabled={!podeDecrementar}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.controleButtonText,
              !podeDecrementar && styles.controleButtonTextDisabled,
            ]}>−</Text>
          </TouchableOpacity>

          {/* Quantidade */}
          <View style={styles.quantidadeContainer}>
            <Text style={styles.quantidadeText}>Qtd: {item.quantidade}</Text>
          </View>

          {/* Botão Aumentar */}
          <TouchableOpacity
            style={[
              styles.controleButton,
              !podeIncrementar && styles.controleButtonDisabled,
            ]}
            onPress={() => incrementarItem(item.produto.id)}
            disabled={!podeIncrementar}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.controleButtonText,
              !podeIncrementar && styles.controleButtonTextDisabled,
            ]}>+</Text>
          </TouchableOpacity>

          {/* Botão Remover */}
          <TouchableOpacity
            style={styles.removerButton}
            onPress={() => removerDoCarrinho(item.produto.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.removerButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (carrinho.length === 0) {
    return (
      <ScreenWrapper contentContainerStyle={styles.emptyContainer}>
        <EmptyState
          icon="🛒"
          title="Carrinho vazio"
          message="Adicione produtos do cardápio ao carrinho"
        />
        <View style={styles.emptyActions}>
          <Button
            title="Voltar ao Cardápio"
            onPress={() => navigation.goBack()}
            variant="primary"
            fullWidth
          />
        </View>
      </ScreenWrapper>
    );
  }

  const hospedeAtual = hospedeSelecionado || hospedeManual;

  return (
    <ScreenWrapper scrollEnabled={false}>
      <View style={styles.container}>
        {/* Tabs de seleção (apenas modo GARCOM) */}
        {modo === 'GARCOM' && (
          <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, modoSelecao === 'PULSEIRA' && styles.tabActive]}
            onPress={() => {
              setModoSelecao('PULSEIRA');
              setHospedeManual(null);
              setQuarto('');
              setNome('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, modoSelecao === 'PULSEIRA' && styles.tabTextActive]}>
              📡 Ler Pulseira
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, modoSelecao === 'MANUAL' && styles.tabActive]}
            onPress={() => {
              setModoSelecao('MANUAL');
              setHospedeSelecionado(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, modoSelecao === 'MANUAL' && styles.tabTextActive]}>
              ⌨️ Digitar Quarto
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Área de busca/leitura */}
      {modo === 'GARCOM' && !hospedeAtual && (
        <View style={styles.buscaContainer}>
          {modoSelecao === 'PULSEIRA' ? (
            <TouchableOpacity
              style={styles.lerPulseiraButton}
              onPress={handleLerPulseira}
              disabled={isReading || buscandoHospede}
            >
              {isReading || buscandoHospede ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.lerPulseiraButtonText}>📱 Ler Pulseira</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.buscaManualContainer}>
              <Input
                label="Número do Quarto"
                value={quarto}
                onChangeText={setQuarto}
                placeholder="Ex: 101, 205"
                keyboardType="default"
                autoCapitalize="none"
              />
              <Button
                title="Buscar por Quarto"
                onPress={handleBuscarPorQuarto}
                disabled={buscandoHospede || !quarto.trim()}
                loading={buscandoHospede}
                variant="primary"
                size="medium"
                fullWidth
                style={styles.buscarButton}
              />
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>
              <Input
                label="Nome do Hóspede"
                value={nome}
                onChangeText={setNome}
                placeholder="Digite o nome"
                keyboardType="default"
                autoCapitalize="words"
              />
              <Button
                title="Buscar por Nome"
                onPress={handleBuscarPorNome}
                disabled={buscandoHospede || !nome.trim()}
                loading={buscandoHospede}
                variant="secondary"
                size="medium"
                fullWidth
                style={styles.buscarButton}
              />
            </View>
          )}
        </View>
      )}

      {/* Info do hóspede */}
      {hospedeAtual && (
        <View style={styles.hospedeCard}>
          <Text style={styles.hospedeNome}>{hospedeAtual.nome}</Text>
          <Text style={styles.hospedeDivida}>
            Dívida atual: R$ {hospedeAtual.dividaAtual.toFixed(2)}
          </Text>
          {hospedeAtual.limiteGasto && (
            <Text style={styles.hospedeLimite}>
              Limite: R$ {hospedeAtual.limiteGasto.toFixed(2)} | 
              Disponível: R$ {(hospedeAtual.limiteGasto - hospedeAtual.dividaAtual).toFixed(2)}
            </Text>
          )}
          {(() => {
            const validacao = validarLimiteGasto();
            const total = calcularTotal();
            const totalComDivida = total + hospedeAtual.dividaAtual;
            if (hospedeAtual.limiteGasto && totalComDivida > hospedeAtual.limiteGasto * 0.9) {
              return (
                <Text style={styles.hospedeAviso}>
                  ⚠️ Atenção: Você está próximo do limite de gasto
                </Text>
              );
            }
            return null;
          })()}
        </View>
      )}

      {/* Lista de itens */}
      <FlatList
        data={carrinho}
        renderItem={renderItem}
        keyExtractor={(item: { produto: Produto; quantidade: number }) => item.produto.id.toString()}
        contentContainerStyle={styles.lista}
        style={styles.flatList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      />

      {/* Resumo e botão de finalizar */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValor}>R$ {calcularTotal().toFixed(2)}</Text>
        </View>

        <Button
          title={loading ? 'Processando...' : 'Continuar'}
          onPress={finalizarPedido}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="large"
          fullWidth
          style={styles.finalizarButton}
        />

        <TouchableOpacity
          style={styles.limparButton}
          onPress={() => {
            Alert.alert(
              'Confirmar',
              'Deseja limpar o carrinho?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Limpar', onPress: limparCarrinho },
              ]
            );
          }}
        >
          <Text style={styles.limparButtonText}>Limpar Carrinho</Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* Modal de PIN de Gerente */}
      <Modal
        visible={mostrarModalPin}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModalPin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Autorização de Supervisor Necessária</Text>
            <Text style={styles.modalMessage}>
              Lançamento manual exige senha de gerente
            </Text>
            <Input
              label="PIN do Gerente"
              value={pinGerente}
              onChangeText={setPinGerente}
              placeholder="Digite o PIN"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setMostrarModalPin(false);
                  setPinGerente('');
                }}
                variant="secondary"
                size="medium"
                style={styles.modalButton}
              />
              <Button
                title="Confirmar"
                onPress={handleConfirmarPinGerente}
                disabled={!pinGerente.trim() || loading}
                loading={loading}
                variant="primary"
                size="medium"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyActions: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  flatList: {
    flex: 1,
  },
  hospedeCard: {
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
  hospedeNome: {
    ...typography.h3,
    color: colors.text,
  },
  hospedeDivida: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hospedeLimite: {
    ...typography.bodySmall,
    color: colors.info,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  hospedeAviso: {
    ...typography.bodySmall,
    color: colors.warning,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  lista: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemNome: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemPrecoUnitario: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemTotal: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itemControles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controleButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controleButtonDisabled: {
    backgroundColor: colors.backgroundDark,
    opacity: 0.5,
  },
  controleButtonText: {
    ...typography.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controleButtonTextDisabled: {
    color: colors.textSecondary,
  },
  quantidadeContainer: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  quantidadeText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  removerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removerButtonText: {
    fontSize: 24,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.text,
  },
  totalValor: {
    ...typography.h1,
    fontWeight: 'bold',
    color: colors.primary,
  },
  finalizarButton: {
    marginBottom: spacing.sm,
  },
  limparButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  limparButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.error,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  buscaContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  buscaManualContainer: {
    gap: spacing.md,
  },
  buscarButton: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
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
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
