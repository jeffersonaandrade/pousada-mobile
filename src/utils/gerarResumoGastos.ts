import { Hospede, Pedido } from '../types';

/**
 * Gera um texto formatado com o resumo de gastos do hóspede
 * Formato similar a uma nota fiscal (mas não é cupom fiscal)
 */
export const gerarResumoGastos = (hospede: Hospede, pedidos: Pedido[]): string => {
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Agrupar pedidos por produto e contar quantidade
  const pedidosAgrupados = pedidos.reduce((acc, pedido) => {
    const produtoNome = pedido.produto?.nome || 'Produto desconhecido';
    if (!acc[produtoNome]) {
      acc[produtoNome] = {
        quantidade: 0,
        valorUnitario: pedido.valor,
        valorTotal: 0,
      };
    }
    acc[produtoNome].quantidade += 1;
    acc[produtoNome].valorTotal += pedido.valor;
    return acc;
  }, {} as Record<string, { quantidade: number; valorUnitario: number; valorTotal: number }>);

  // Calcular totais
  const totalGeral = pedidos.reduce((sum, pedido) => sum + pedido.valor, 0);

  // Montar o texto
  let texto = '';
  texto += '═'.repeat(40) + '\n';
  texto += '        RESUMO DE GASTOS\n';
  texto += '═'.repeat(40) + '\n';
  texto += `Data: ${dataFormatada}\n`;
  texto += '─'.repeat(40) + '\n';
  texto += `Cliente: ${hospede.nome}\n`;
  texto += `Tipo: ${hospede.tipo}\n`;
  if (hospede.quarto) {
    texto += `Quarto: ${hospede.quarto}\n`;
  }
  if (hospede.documento) {
    texto += `Documento: ${hospede.documento}\n`;
  }
  texto += `Pulseira: ${hospede.uidPulseira}\n`;
  texto += '─'.repeat(40) + '\n';
  texto += 'ITENS:\n';
  texto += '─'.repeat(40) + '\n';

  // Listar itens agrupados
  Object.entries(pedidosAgrupados).forEach(([produtoNome, dados]) => {
    texto += `${dados.quantidade}x ${produtoNome}\n`;
    texto += `   R$ ${dados.valorUnitario.toFixed(2).replace('.', ',')} (un.)\n`;
    texto += `   Subtotal: R$ ${dados.valorTotal.toFixed(2).replace('.', ',')}\n`;
    texto += '\n';
  });

  texto += '─'.repeat(40) + '\n';
  texto += `TOTAL GERAL: R$ ${totalGeral.toFixed(2).replace('.', ',')}\n`;
  texto += '═'.repeat(40) + '\n';
  texto += '\n';
  texto += 'Este documento não é um cupom fiscal.\n';
  texto += 'É apenas um resumo de consumo.\n';
  texto += '\n';
  texto += 'Obrigado pela preferência!\n';

  return texto;
};

