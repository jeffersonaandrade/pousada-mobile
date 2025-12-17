# Pousada RFID System - Mobile App

Aplicativo mobile desenvolvido com React Native e Expo para gerenciar pedidos e check-in de hóspedes em pousadas e bares utilizando tecnologia RFID/NFC.

## Tecnologias Utilizadas

O aplicativo foi construído com as seguintes tecnologias modernas:

- **React Native** com **Expo** para desenvolvimento cross-platform
- **TypeScript** para desenvolvimento type-safe
- **React Navigation** para navegação entre telas
- **Zustand** para gerenciamento de estado global
- **Axios** para comunicação com a API REST
- **Socket.io Client** para receber eventos em tempo real
- **React Native NFC Manager** para leitura real de pulseiras NFC

## Funcionalidades Principais

O aplicativo oferece três modos de operação distintos, cada um adaptado para diferentes perfis de usuário:

### 1. Modo Recepção

Destinado ao atendimento na recepção da pousada, este modo permite realizar o check-in completo de hóspedes. O recepcionista pode cadastrar novos hóspedes informando tipo (Hóspede, Day Use ou VIP), nome, documento (obrigatório para Day Use), número do quarto (obrigatório para Hóspede) e limite de gasto opcional. A pulseira RFID é associada ao hóspede através da leitura NFC.

### 2. Modo Garçom

Requer autenticação com PIN de 4 dígitos para acesso. Após autenticado, o garçom pode realizar pedidos lendo a pulseira do hóspede e selecionando produtos do cardápio. O sistema valida automaticamente os limites de gasto para clientes Day Use e a disponibilidade de estoque antes de confirmar o pedido.

### 3. Modo Kiosk

Modo de autoatendimento onde os próprios hóspedes podem fazer pedidos. Não requer login, apenas a aproximação da pulseira NFC para identificação. O hóspede visualiza o cardápio, adiciona produtos ao carrinho e finaliza o pedido de forma autônoma.

## Instalação e Configuração

### Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** versão 18 ou superior
- **Expo CLI** instalado globalmente: `npm install -g expo-cli`
- **Expo Go** instalado no dispositivo móvel (disponível na App Store e Google Play)

### Passo 1: Instalar Dependências

Execute o comando abaixo na raiz do projeto mobile:

```bash
npm install
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as configurações da API:

```bash
API_BASE_URL=http://192.168.0.38:3000/api
SOCKET_URL=http://192.168.0.38:3000
API_TIMEOUT=10000
SOCKET_RECONNECTION_DELAY=1000
SOCKET_RECONNECTION_ATTEMPTS=5
```

**Importante:** 
- Substitua `192.168.0.38` pelo IP real da máquina onde o backend está rodando
- Para descobrir seu IP:
  - **Windows:** Execute `ipconfig` no CMD
  - **Linux/Mac:** Execute `ifconfig` ou `ip addr` no terminal
- O arquivo `.env` não é versionado (está no `.gitignore`) por segurança

### Passo 3: Iniciar o Aplicativo

Execute o comando:

```bash
npm start
```

Isso abrirá o Expo DevTools no navegador. Você pode então:

- Escanear o QR Code com o app **Expo Go** no seu celular
- Pressionar `a` para abrir no emulador Android
- Pressionar `i` para abrir no simulador iOS

## Estrutura de Navegação

O aplicativo utiliza React Navigation com as seguintes telas:

| Tela | Rota | Descrição |
|------|------|-----------|
| **ConfigScreen** | `/Config` | Tela inicial para seleção do modo de operação |
| **LoginScreen** | `/Login` | Autenticação com PIN para modo Garçom |
| **MenuScreen** | `/Menu` | Menu principal após login do garçom |
| **CheckInScreen** | `/CheckIn` | Formulário de check-in de hóspedes |
| **CardapioScreen** | `/Cardapio` | Listagem de produtos disponíveis |
| **CarrinhoScreen** | `/Carrinho` | Carrinho de compras e finalização de pedido |

## Gerenciamento de Estado

O aplicativo utiliza **Zustand** para gerenciar o estado global de forma simples e eficiente. O store principal (`appStore.ts`) mantém:

- **modo**: Modo de operação atual (Recepção, Garçom ou Kiosk)
- **usuario**: Dados do garçom autenticado
- **hospedeSelecionado**: Hóspede identificado pela pulseira NFC
- **carrinho**: Lista de produtos selecionados para pedido

### Exemplo de Uso do Store

```typescript
import { useAppStore } from '../store/appStore';

function MeuComponente() {
  const { hospedeSelecionado, setHospedeSelecionado } = useAppStore();
  
  // Usar hospedeSelecionado...
}
```

## Integração com NFC

O aplicativo inclui um hook simulado para leitura NFC (`useNFC.ts`). Para implementação em produção com hardware real, siga as instruções abaixo.

### Instalação do React Native NFC Manager

```bash
npm install react-native-nfc-manager
```

### Configuração Android

Adicione as permissões no arquivo `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

### Configuração iOS

Adicione a descrição de uso no arquivo `ios/[AppName]/Info.plist`:

```xml
<key>NFCReaderUsageDescription</key>
<string>Precisamos acessar o NFC para ler as pulseiras</string>
```

### Implementação Real

Substitua o conteúdo do hook `useNFC.ts` pela implementação real:

```typescript
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

async function lerPulseira() {
  try {
    await NfcManager.start();
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    return tag.id; // UID da pulseira
  } catch (ex) {
    console.warn('Erro ao ler NFC:', ex);
    return null;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}
```

## Comunicação com o Backend

O aplicativo se comunica com o backend através de uma camada de serviços (`src/services/api.ts`) que encapsula todas as chamadas HTTP. Todas as requisições retornam objetos tipados com TypeScript.

### Principais Funções da API

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `autenticarUsuario(pin)` | Autentica garçom por PIN | `Usuario` |
| `buscarHospedePorPulseira(uid)` | Busca hóspede pelo UID da pulseira | `Hospede` |
| `criarHospede(data)` | Realiza check-in de novo hóspede | `Hospede` |
| `listarProdutos(categoria?)` | Lista produtos do cardápio | `Produto[]` |
| `criarPedido(hospedeId, produtoId)` | Cria novo pedido | `Pedido` |
| `listarPedidos(status?)` | Lista pedidos por status | `Pedido[]` |

### Tratamento de Erros

Todas as funções da API lançam exceções em caso de erro, que devem ser tratadas com `try/catch`:

```typescript
try {
  const hospede = await buscarHospedePorPulseira(uid);
  // Sucesso
} catch (error) {
  Alert.alert('Erro', error.message);
}
```

## Estrutura de Pastas

```
pousada-mobile/
├── src/
│   ├── config/
│   │   └── api.ts              # Configuração de URLs da API
│   ├── hooks/
│   │   └── useNFC.ts           # Hook para leitura NFC (hardware real + mock)
│   ├── components/
│   │   └── ScreenWrapper.tsx  # Wrapper responsivo para todas as telas
│   ├── screens/
│   │   ├── ConfigScreen.tsx    # Seleção de modo
│   │   ├── LoginScreen.tsx     # Login com PIN
│   │   ├── MenuScreen.tsx      # Menu principal
│   │   ├── CheckInScreen.tsx   # Check-in de hóspedes
│   │   ├── CardapioScreen.tsx  # Listagem de produtos
│   │   └── CarrinhoScreen.tsx  # Carrinho de compras
│   ├── services/
│   │   └── api.ts              # Camada de comunicação com backend
│   ├── store/
│   │   └── appStore.ts         # Store Zustand
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── assets/                     # Imagens e ícones
├── App.tsx                     # Componente raiz e navegação
├── app.json                    # Configuração do Expo
├── package.json
├── tsconfig.json
└── README.md
```

## Fluxos de Uso

### Fluxo 1: Check-in de Hóspede (Modo Recepção)

1. Abrir o app e selecionar **Recepção**
2. Preencher formulário com dados do hóspede
3. Aproximar pulseira NFC para leitura
4. Confirmar check-in
5. Sistema cria hóspede e associa pulseira

### Fluxo 2: Realizar Pedido (Modo Garçom)

1. Abrir o app e selecionar **Garçom**
2. Digitar PIN de 4 dígitos
3. No menu, selecionar **Fazer Pedido**
4. Aproximar pulseira do hóspede para identificação
5. Selecionar produtos do cardápio
6. Revisar carrinho e finalizar pedido
7. Sistema valida limites e estoque
8. Pedido é enviado para a cozinha via Socket.io

### Fluxo 3: Autoatendimento (Modo Kiosk)

1. Abrir o app e selecionar **Kiosk**
2. Aproximar pulseira para identificação
3. Navegar pelo cardápio
4. Adicionar produtos ao carrinho
5. Finalizar pedido
6. Sistema processa e envia para a cozinha

## Customização e Extensão

### Adicionar Nova Tela

1. Crie o componente em `src/screens/NovaTela.tsx`
2. Adicione o tipo da rota em `App.tsx`:

```typescript
export type RootStackParamList = {
  // ... rotas existentes
  NovaTela: undefined;
};
```

3. Registre a rota no Stack Navigator:

```typescript
<Stack.Screen
  name="NovaTela"
  component={NovaTela}
  options={{ title: 'Nova Tela' }}
/>
```

### Adicionar Novo Campo no Store

Edite `src/store/appStore.ts`:

```typescript
interface AppState {
  // ... campos existentes
  novoCampo: string;
  setNovoCampo: (valor: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ... estado existente
  novoCampo: '',
  setNovoCampo: (valor) => set({ novoCampo: valor }),
}));
```

## Build para Produção

### Android (APK)

```bash
expo build:android
```

### iOS (IPA)

```bash
expo build:ios
```

Para builds nativos sem Expo, consulte a documentação oficial do Expo sobre **Bare Workflow** e **EAS Build**.

## Troubleshooting

### Erro de Conexão com API

Verifique se:
- O backend está rodando e acessível na rede
- O IP configurado em `api.ts` está correto
- O firewall não está bloqueando a porta 3000
- O dispositivo móvel está na mesma rede Wi-Fi

### NFC Não Funciona

Lembre-se que o hook atual é **simulado**. Para testar NFC real:
- Instale `react-native-nfc-manager`
- Configure permissões no Android/iOS
- Implemente a leitura real conforme documentado acima
- Teste em dispositivo físico (emuladores não suportam NFC)

### App Não Atualiza Após Mudanças

- Feche o app completamente e reabra
- No Expo DevTools, pressione `r` para reload
- Limpe o cache: `expo start -c`

## Regras de Negócio

Este documento descreve todas as regras de negócio implementadas no aplicativo mobile. Essas regras garantem a integridade dos dados e a segurança das operações.

### 📋 Check-in de Hóspedes (Modo Recepção)

#### Validações Obrigatórias

1. **Nome Completo**
   - Campo obrigatório para todos os tipos de cliente
   - Não pode estar vazio ou conter apenas espaços

2. **Pulseira NFC**
   - Obrigatória para todos os tipos de cliente
   - Deve ser gravada antes de confirmar o check-in
   - UID único (validado pelo backend)

3. **Documento (CPF)**
   - **Obrigatório** apenas para clientes do tipo `DAY_USE`
   - Opcional para `HOSPEDE` e `VIP`

4. **Quarto**
   - **Obrigatório** apenas para clientes do tipo `HOSPEDE`
   - Deve ser selecionado através do mapa visual de quartos
   - Apenas quartos com status `LIVRE` podem ser selecionados
   - Não aplicável para `DAY_USE` e `VIP`

5. **E-mail**
   - Campo opcional
   - Se fornecido, deve ter formato válido (validação de regex)

#### Regras de Pagamento na Entrada

1. **Pagamento Imediato**
   - Se o switch "Pagamento Imediato?" estiver ativado:
     - O campo "Valor da Entrada" se torna obrigatório
     - O método de pagamento deve ser selecionado (Dinheiro, Pix, Crédito ou Débito)
   - O valor é enviado como `valorEntrada` (número float) e `pagoNaEntrada: true`

2. **Pagamento Fiado (Não Pago)**
   - Se o switch estiver desativado e houver valor de entrada:
     - Sistema exibe confirmação: "Este cliente ficará devendo R$ X. Confirma?"
     - Usuário deve confirmar antes de prosseguir
   - O valor é enviado como `valorEntrada` (número float) e `pagoNaEntrada: false`
   - A dívida será registrada no backend como `dividaAtual`

3. **Conversão de Valores**
   - Valores são convertidos de formato moeda (ex: "R$ 100,00") para número float (ex: 100.00)
   - Vírgulas são substituídas por pontos antes do parse
   - Valores inválidos ou negativos são rejeitados

### 🛒 Gerenciamento de Carrinho

#### Adicionar Produtos ao Carrinho

1. **Modo KIOSK**
   - É **obrigatório** ter hóspede selecionado via pulseira antes de adicionar produtos
   - Sistema bloqueia adição se não houver hóspede identificado

2. **Modo GARCOM**
   - Pode adicionar produtos sem pulseira (usará PIN do cliente no checkout)
   - Leitura de pulseira é opcional

3. **Validação de Estoque**
   - Produtos com `estoque === 0` não podem ser adicionados
   - Se o produto já está no carrinho, verifica se a quantidade total não excede o estoque disponível
   - Exibe mensagem de erro se tentar adicionar além do estoque

4. **Filtro de Visibilidade**
   - Apenas produtos com `visivelCardapio !== false` aparecem no cardápio
   - Produtos internos (como "Day Use") são ocultados automaticamente

#### Controles de Quantidade no Carrinho

1. **Botão Incrementar (+)**
   - Aumenta a quantidade em 1 unidade
   - **Limite**: Não permite incrementar além do estoque disponível do produto
   - Botão fica desabilitado quando quantidade = estoque

2. **Botão Decrementar (-)**
   - Diminui a quantidade em 1 unidade
   - **Limite mínimo**: Trava em 1 unidade (não permite diminuir abaixo de 1)
   - Botão fica desabilitado quando quantidade = 1
   - Para remover completamente, o usuário deve usar o botão de lixeira (🗑️)

3. **Atualização em Tempo Real**
   - Subtotal e total são recalculados automaticamente ao alterar quantidades
   - Valores são exibidos em formato monetário brasileiro (R$ X,XX)

### 🍽️ Finalização de Pedidos

#### Validações Antes de Finalizar

1. **Carrinho Vazio**
   - Não permite finalizar pedido com carrinho vazio
   - Exibe mensagem de erro

2. **Identificação do Hóspede**

   **Modo KIOSK:**
   - É **obrigatório** ter hóspede selecionado via pulseira
   - Sistema bloqueia finalização se não houver hóspede

   **Modo GARCOM:**
   - Pode finalizar com ou sem hóspede identificado
   - Se usar modo MANUAL (sem pulseira), exige PIN de gerente

3. **Validação de Estoque**
   - Verifica se todos os produtos do carrinho têm estoque suficiente
   - Compara `quantidade` do item com `estoque` do produto
   - Exibe erro específico para cada produto sem estoque

4. **Limite de Gasto (Day Use)**
   - Aplica apenas para clientes do tipo `DAY_USE` com `limiteGasto` definido
   - Calcula: `totalComDivida = totalDoCarrinho + dividaAtual`
   - Se `totalComDivida > limiteGasto`:
     - Bloqueia a finalização
     - Exibe mensagem: "Limite de gasto excedido! Disponível: R$ X,XX"
   - Não aplica para `HOSPEDE` ou `VIP`

5. **Rastreamento de Pedidos**
   - Cada pedido criado é associado ao `usuarioId` do garçom logado
   - Campo `usuarioId` é enviado no payload ao criar pedidos
   - Permite rastrear qual funcionário criou cada pedido

#### Regras de Autorização

1. **Pedidos via Pulseira (NFC)**
   - Aprovação automática se houver saldo/estoque
   - Não requer PIN de gerente
   - Envia `uidPulseira` no payload

2. **Pedidos Manuais (Sem Pulseira)**
   - **Obrigatório** solicitar PIN de gerente antes de finalizar
   - Modal de autorização exige PIN de 4 dígitos
   - PIN deve pertencer a usuário com cargo `MANAGER` ou `ADMIN`
   - Garçons comuns (`WAITER`) não podem autorizar pedidos manuais
   - Se PIN inválido ou sem permissão, retorna erro 403
   - Envia `hospedeId` e `managerPin` no payload

3. **Tratamento de Erros**
   - **400 (Bad Request)**: Estoque insuficiente - exibe nome do produto e estoque disponível
   - **403 (Forbidden)**: 
     - Limite de Day Use atingido - orienta ir à recepção
     - PIN de gerente inválido - permite nova tentativa sem fechar modal
   - **404 (Not Found)**: Hóspede ou produto não encontrado

### 🏨 Gerenciamento de Quartos

#### Seleção de Quarto no Check-in

1. **Apenas Quartos Livres**
   - No mapa visual, apenas quartos com status `LIVRE` são selecionáveis
   - Quartos `OCUPADO` mostram nome do hóspede atual e ícone de bloqueio
   - Quartos `LIMPEZA` podem ser liberados diretamente pelo tablet
   - Quartos `MANUTENCAO` não são selecionáveis (bloqueados para manutenção)

2. **Envio de quartoId**
   - Para clientes do tipo `HOSPEDE`, o payload **DEVE** conter:
     - `quartoId`: ID numérico do quarto (obrigatório)
     - `quarto`: Número do quarto em string (compatibilidade)
   - Validação obrigatória: se `tipo === 'HOSPEDE'` e não houver `quartoSelecionado?.id`, exibe erro

3. **Liberação de Quartos em Limpeza**
   - Camareira pode liberar quartos em limpeza diretamente pelo tablet
   - Ao clicar em quarto `LIMPEZA`, sistema pergunta: "Liberar quarto X para uso?"
   - Ao confirmar, atualiza status para `LIVRE` via API

#### Check-out e Limpeza

1. **Marcação Automática para Limpeza**
   - Ao realizar checkout, se o hóspede tinha quarto, o sistema marca automaticamente para `LIMPEZA`
   - Mensagem de sucesso informa: "Quarto X marcado para LIMPEZA"

#### Governança e Manutenção (Modo CLEANER)

1. **Bloqueio para Manutenção (LIVRE → MANUTENCAO)**
   - Camareira pode bloquear quartos livres que apresentam problemas
   - Ao clicar em quarto `LIVRE`, pergunta: "O quarto tem algum problema? Deseja bloquear para manutenção?"
   - Ao confirmar, chama `PATCH /api/quartos/:id/status` com `{ status: 'MANUTENCAO' }`
   - Quarto fica com cor cinza e não pode ser selecionado no check-in

2. **Desbloqueio após Manutenção (MANUTENCAO → LIVRE)**
   - Após concluir a manutenção, camareira pode desbloquear o quarto
   - Ao clicar em quarto `MANUTENCAO`, pergunta: "Manutenção concluída? Deseja liberar o quarto?"
   - Ao confirmar, chama `PATCH /api/quartos/:id/status` com `{ status: 'LIVRE' }`
   - Quarto volta para cor verde e fica disponível para check-in

3. **Liberação de Limpeza (LIMPEZA → LIVRE)**
   - Camareira pode liberar quartos em limpeza diretamente pelo tablet
   - Ao clicar em quarto `LIMPEZA`, pergunta: "Confirmar limpeza e liberar quarto?"
   - Ao confirmar, atualiza status para `LIVRE` via API
   - Atualização é refletida em tempo real na recepção

### 📱 Filtros e Visualização

#### Filtro por Setor no Cardápio

1. **Setores Disponíveis**
   - `COZINHA` → Exibido como "Restaurante/Cozinha"
   - `BAR_PISCINA` → Exibido como "Bar da Piscina"
   - `BOATE` → Exibido como "Boate/Show"
   - `TODOS` → Mostra todos os produtos (padrão)

2. **Filtro Combinado**
   - Filtro por setor funciona em conjunto com filtro por categoria
   - Aplicado antes de renderizar a lista de produtos

#### Filtro de Visibilidade

1. **Produtos Visíveis no Cardápio**
   - Apenas produtos com `visivelCardapio !== false` são exibidos
   - Produtos internos (como "Day Use") são automaticamente ocultados
   - Filtro aplicado ao carregar produtos da API

### 🔐 Segurança e Autenticação

#### Autenticação da Equipe

1. **PIN de 4 Dígitos**
   - Formato: exatamente 4 dígitos numéricos
   - Validação via regex: `/^\d{4}$/`
   - PIN deve existir no banco e usuário deve estar ativo

2. **Redirecionamento por Cargo**
   - Sistema verifica `usuario.cargo` após autenticação
   - Redireciona automaticamente para tela apropriada
   - Perfis não suportados são bloqueados

3. **Modo Garçom/Gerente**
   - Requer autenticação para acessar funcionalidades
   - PIN é enviado no header `X-User-Pin` nas requisições de pedidos
   - Rastreamento de pedidos: cada pedido é associado ao `usuarioId` do criador

4. **Modo Camareira (CLEANER)**
   - Acesso exclusivo à tela de Governança
   - Não tem acesso a funcionalidades de vendas (pedidos, cardápio, carrinho)
   - Proteção de rotas impede acesso manual a telas restritas

#### Saída Segura

1. **Botão de Encerrar Turno**
   - Disponível no modo Garçom, Gerente e Recepção
   - Requer PIN de gerente para autorizar saída
   - Previne saída acidental durante operação

### 📊 Validações de Dados

#### Formato de Valores Monetários

1. **Conversão de Moeda**
   - Entrada: formato brasileiro com vírgula (ex: "100,00")
   - Processamento: converte para float (ex: 100.00)
   - Exibição: formato brasileiro (ex: "R$ 100,00")

2. **Validação de Números**
   - Valores devem ser números positivos
   - Valores inválidos (NaN, negativos) são rejeitados

#### Validação de E-mail

1. **Formato Válido**
   - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Aplicado apenas se e-mail for fornecido (campo opcional)

#### Validação de Quarto no Check-in

1. **quartoId Obrigatório para HOSPEDE**
   - Se `tipo === 'HOSPEDE'`, o payload **DEVE** conter `quartoId` (número inteiro)
   - Validação pré-envio: verifica se `quartoSelecionado?.id` existe
   - Erro se não houver quarto selecionado: "Selecione um quarto válido para Hóspede"

2. **Envio de Dados do Quarto**
   - `quartoId`: ID numérico do quarto (obrigatório para HOSPEDE)
   - `quarto`: Número do quarto em string (compatibilidade)
   - Apenas enviados quando `tipo === 'HOSPEDE'`

#### Validação de Quarto no Check-in

1. **quartoId Obrigatório para HOSPEDE**
   - Se `tipo === 'HOSPEDE'`, o payload **DEVE** conter `quartoId` (número inteiro)
   - Validação pré-envio: verifica se `quartoSelecionado?.id` existe
   - Erro se não houver quarto selecionado: "Selecione um quarto válido para Hóspede"

2. **Envio de Dados do Quarto**
   - `quartoId`: ID numérico do quarto (obrigatório para HOSPEDE)
   - `quarto`: Número do quarto em string (compatibilidade)
   - Apenas enviados quando `tipo === 'HOSPEDE'`

### 👥 Acesso da Equipe (Unificado)

#### Ponto de Entrada Único

1. **Botão "Equipe" na Tela Inicial**
   - Substitui o botão "Garçom" por "Equipe" (ou "Acesso Staff")
   - Ícone genérico (👥) para representar todos os funcionários
   - Mantém "Recepção" e "Kiosk" como modos de terminal fixo

#### Redirecionamento Automático por Cargo

1. **WAITER (Garçom)**
   - Após login, redireciona para `Menu` (tela de pedidos)
   - Pode fazer pedidos e ver seus próprios pedidos das últimas 24h

2. **MANAGER (Gerente)**
   - Após login, redireciona para `Menu` (tela de pedidos)
   - Tem poderes extras (pode autorizar pedidos manuais, cancelar pedidos)
   - Vê seus próprios pedidos das últimas 24h

3. **CLEANER (Camareira)**
   - Após login, redireciona para `Governance` (tela de governança)
   - Acesso exclusivo ao mapa de quartos para gerenciar limpeza e manutenção
   - **Não tem acesso** a telas de pedidos (Menu, Pedidos, Cardápio, Carrinho)

4. **ADMIN (Administrador)**
   - Após login, redireciona para `Menu` (acesso completo)
   - Pode ver todos os pedidos (sem filtro de 24h)

5. **Outros Perfis**
   - Exibe alerta: "Perfil não suportado no mobile"
   - Bloqueia acesso ao aplicativo

#### Proteção de Rotas

1. **CLEANER Bloqueado**
   - Se CLEANER tentar acessar `Menu` ou `Pedidos` manualmente, é redirecionado para `Governance`
   - Exibe alerta informativo antes de redirecionar

### 🧹 Tela de Governança (CLEANER)

#### Funcionalidades

1. **Visualização do Mapa de Quartos**
   - Mapa visual com todos os quartos em formato de grid
   - Cores indicam status: Verde (Livre), Vermelho (Ocupado), Amarelo (Limpeza), Cinza (Manutenção)

2. **Gerenciamento de Limpeza**
   - Clicar em quarto `LIMPEZA` (amarelo) → confirma limpeza → libera para `LIVRE`
   - Atualização refletida em tempo real na recepção

3. **Gerenciamento de Manutenção**
   - Clicar em quarto `LIVRE` (verde) → pergunta se tem problema → bloqueia para `MANUTENCAO`
   - Clicar em quarto `MANUTENCAO` (cinza) → pergunta se manutenção concluída → libera para `LIVRE`
   - Quartos em manutenção não podem ser selecionados no check-in

4. **Informações de Quartos Ocupados**
   - Clicar em quarto `OCUPADO` (vermelho) → mostra nome do hóspede atual
   - Apenas visualização, sem ações disponíveis

### 📋 Listagem de Pedidos

#### Filtro por Funcionário

1. **Pedidos das Últimas 24h**
   - Garçons (WAITER) veem apenas seus próprios pedidos das últimas 24h
   - Gerentes (MANAGER) veem apenas seus próprios pedidos das últimas 24h
   - Administradores (ADMIN) veem todos os pedidos (sem filtro)

2. **Filtros Aplicados**
   - `usuarioId`: ID do funcionário logado (para WAITER e MANAGER)
   - `recente: true`: Apenas pedidos das últimas 24h
   - Título da tela: "Meus Pedidos (24h)"

### 🔄 Estados e Transições

#### Status de Quartos

1. **LIVRE**: Disponível para check-in, selecionável no mapa (cor verde)
2. **OCUPADO**: Com hóspede atual, mostra nome e bloqueado para seleção (cor vermelha)
3. **LIMPEZA**: Aguardando limpeza, pode ser liberado pelo tablet (cor amarela)
4. **MANUTENCAO**: Bloqueado para manutenção, não selecionável no check-in (cor cinza)

#### Status de Pedidos

1. **PENDENTE**: Pedido criado, aguardando preparo
2. **PREPARANDO**: Em preparação na cozinha
3. **PRONTO**: Pronto para entrega
4. **ENTREGUE**: Entregue ao hóspede
5. **CANCELADO**: Cancelado (requer PIN de gerente)

### ⚠️ Mensagens de Aviso

#### Avisos Proativos

1. **Limite de Gasto Próximo**
   - Quando `totalComDivida > limiteGasto * 0.9` (90% do limite)
   - Exibe aviso: "⚠️ Atenção: Você está próximo do limite de gasto"

2. **Estoque Baixo**
   - Produtos com `estoque > 0 && estoque <= 5` são marcados como "baixo"
   - Exibido no cardápio: "X em estoque (baixo)"

## Próximos Passos

Após configurar o app mobile, você pode:

1. **Testar os fluxos completos** em um dispositivo real
2. **Integrar NFC real** seguindo as instruções acima
3. **Customizar o design** editando os estilos em cada tela
4. **Adicionar novas funcionalidades** como histórico de pedidos, relatórios, etc.

## Boas Práticas e Regras Técnicas

### Responsividade e Layout

#### ScreenWrapper Component

O componente `ScreenWrapper` é usado em todas as telas para garantir:
- Respeito às áreas seguras (notch/franjas) via `SafeAreaView`
- Prevenção de sobreposição do teclado via `KeyboardAvoidingView`
- Scroll automático quando necessário via `ScrollView`

**IMPORTANTE - Regra de FlatList:**
- **NUNCA** coloque `FlatList` dentro de `ScrollView` (causa warnings e problemas de performance)
- Para telas com `FlatList`, use: `<ScreenWrapper scrollEnabled={false}>`
- O `FlatList` controla sua própria rolagem internamente
- Telas que usam `FlatList`:
  - `CardapioScreen` - Lista de produtos
  - `PedidosScreen` - Lista de pedidos
  - `CarrinhoScreen` - Itens do carrinho

#### Exemplo Correto:
```typescript
// ✅ CORRETO: FlatList sem ScrollView
<ScreenWrapper scrollEnabled={false}>
  <FlatList data={items} renderItem={...} />
</ScreenWrapper>

// ✅ CORRETO: Conteúdo normal com ScrollView
<ScreenWrapper>
  <View>...</View>
  <Input ... />
</ScreenWrapper>
```

### Leitura NFC

#### Hardware Real vs Mock

O hook `useNFC` prioriza hardware NFC real quando disponível:
- Verifica suporte via `NfcManager.isSupported()`
- Se suportado: usa leitura real com janela nativa do Android
- Se não suportado: usa mock automático como fallback
- Sempre cancela requisição NFC no `finally` para evitar travamentos

**Comportamento:**
- Dispositivo com NFC: Abre janela nativa "Aproxime a pulseira"
- Dispositivo sem NFC: Usa simulação automática
- Cancelamento: Tratado adequadamente sem erros

## Suporte

Para dúvidas sobre Expo e React Native, consulte:

- [Documentação do Expo](https://docs.expo.dev/)
- [Documentação do React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

O aplicativo foi projetado para ser facilmente extensível, seguindo as melhores práticas de desenvolvimento React Native e TypeScript.
