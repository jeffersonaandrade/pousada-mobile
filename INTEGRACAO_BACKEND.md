# Informações de Integração com Backend

## ✅ Status: Backend 100% Compatível!

O backend está totalmente preparado e compatível com o frontend. Todas as informações abaixo foram confirmadas.

---

## 📋 Informações Básicas de Conexão

### 1. Endereço da API
- **URL Base da API**: `http://IP:PORTA/api` (ex: `http://192.168.1.100:3000/api`)
- **URL do Socket.io**: `http://IP:PORTA` (ex: `http://192.168.1.100:3000`)
- **Porta padrão**: `3000` (configurável via variável de ambiente `PORT`)
- **Protocolo**: HTTP (para intranet)

### 2. Estrutura de Resposta da API
✅ **Formato padrão de resposta** (exatamente como o frontend espera):
  ```typescript
  {
    success: boolean;
    data?: T;
    error?: string;
    code?: string; // Código do erro (quando aplicável)
  }
  ```

---

## 🔌 Endpoints Necessários

### **AUTENTICAÇÃO**

#### POST `/api/usuarios/auth`
**Body:**
```json
{
  "pin": "1234"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "pin": "1234",
    "cargo": "WAITER",
    "ativo": true
  }
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/usuarios/auth`
- ✅ PIN é enviado como **string** (4 dígitos)
- ✅ Valores de `cargo`: `"WAITER"`, `"MANAGER"`, `"ADMIN"`

**Resposta de erro (401):**
```json
{
  "success": false,
  "error": "PIN inválido ou usuário inativo"
}
```

---

### **HÓSPEDES**

#### GET `/api/hospedes/pulseira/:uid`
**Parâmetros:**
- `uid`: UID da pulseira NFC (string)

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "HOSPEDE",
    "nome": "Maria Santos",
    "documento": null,
    "quarto": "101",
    "uidPulseira": "NFC123456",
    "limiteGasto": null,
    "dividaAtual": 150.50,
    "ativo": true
  }
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/hospedes/pulseira/:uid`
- ✅ UID é uma **string** (qualquer formato)
- ✅ Retorna 404 se não encontrado

**Resposta de erro (404):**
```json
{
  "success": false,
  "error": "Pulseira não encontrada"
}
```

**Nota**: A resposta inclui o array `pedidos` com os relacionamentos `produto` quando disponível.

---

#### POST `/api/hospedes`
**Body:**
```json
{
  "tipo": "HOSPEDE",
  "nome": "João Silva",
  "documento": "12345678900",
  "quarto": "101",
  "uidPulseira": "NFC123456",
  "limiteGasto": 200.00
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "HOSPEDE",
    "nome": "João Silva",
    "documento": null,
    "quarto": "101",
    "uidPulseira": "NFC123456",
    "limiteGasto": null,
    "dividaAtual": 0,
    "ativo": true
  }
}
```

**Validações implementadas:**
- ✅ **Documento obrigatório** para `tipo: "DAY_USE"`
- ✅ **Quarto obrigatório** para `tipo: "HOSPEDE"`
- ✅ **Pulseira única**: Se já cadastrada, retorna erro 400 com mensagem clara
- ✅ Valores de `tipo`: `"HOSPEDE"`, `"DAY_USE"`, `"VIP"`

**Respostas de erro (400):**
```json
{
  "success": false,
  "error": "Documento é obrigatório para Day Use"
}
```
ou
```json
{
  "success": false,
  "error": "Quarto é obrigatório para Hóspede"
}
```
ou
```json
{
  "success": false,
  "error": "uidPulseira já está em uso",
  "code": "VALIDATION_ERROR"
}
```

---

#### PATCH `/api/hospedes/:id/checkout`

**Descrição:**
- Zera a dívida do hóspede
- Desativa o hóspede (libera a pulseira para reuso)
- Operação de checkout completa

**Parâmetros:**
- `id`: ID do hóspede (number, na URL)

**Exemplo CURL:**
```bash
curl -X PATCH http://localhost:3000/api/hospedes/1/checkout \
  -H "Content-Type: application/json"
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "HOSPEDE",
    "nome": "João Silva",
    "documento": null,
    "quarto": "101",
    "uidPulseira": "NFC123456",
    "limiteGasto": null,
    "dividaAtual": 0.00,
    "ativo": false
  }
}
```

**Validações:**
- ✅ Hóspede existe? → Erro 404 se não encontrado
- ✅ Zera `dividaAtual` para 0.00
- ✅ Define `ativo` como `false` (libera pulseira)

**Resposta de erro (404):**
```json
{
  "success": false,
  "error": "Hóspede não encontrado"
}
```

**Respostas:**
- ✅ Endpoint correto: `PATCH /api/hospedes/:id/checkout`
- ✅ Zera dívida automaticamente
- ✅ Desativa hóspede automaticamente
- ✅ Retorna hóspede atualizado

---

#### GET `/api/hospedes`
**Query Params (opcionais):**
- `ativo`: boolean (true/false)

**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo": "HOSPEDE",
      "nome": "Maria Santos",
      ...
    }
  ]
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/hospedes`
- ✅ Filtro `ativo` suportado (query param como string: `?ativo=true` ou `?ativo=false`)

---

### **PRODUTOS**

#### GET `/api/produtos`
**Query Params (opcionais):**
- `categoria`: string

**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Hambúrguer",
      "preco": 25.90,
      "estoque": 10,
      "foto": "http://...",
      "categoria": "Lanches"
    }
  ]
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/produtos`
- ✅ URL da foto: **string** (pode ser absoluta ou relativa, conforme enviado)
- ✅ Filtro por categoria funciona via query param: `?categoria=Lanches`

---

### **PEDIDOS**

#### POST `/api/pedidos`
**Body:**
```json
{
  "hospedeId": 1,
  "produtoId": 5
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "hospedeId": 1,
    "produtoId": 5,
    "status": "PENDENTE",
    "valor": 25.90,
    "data": "2025-11-30T12:00:00Z"
  }
}
```

**Validações automáticas:**
- ✅ **Estoque**: Verifica e decrementa automaticamente
- ✅ **Limite de gasto**: Valida para Day Use automaticamente
- ✅ **Hóspede ativo**: Verifica se está ativo
- ✅ **Transação atômica**: Se qualquer validação falhar, nada é salvo

**Respostas:**
- ✅ Endpoint correto: `/api/pedidos`
- ✅ Valida estoque automaticamente
- ✅ Valida limite de gasto automaticamente
- ✅ Retorna erro 400 se sem estoque
- ✅ Retorna erro 400 se exceder limite

**Respostas de erro (400):**
```json
{
  "success": false,
  "error": "Produto sem estoque disponível"
}
```
ou
```json
{
  "success": false,
  "error": "Limite de gasto excedido. Limite: R$ 200.00, Dívida atual: R$ 150.50, Valor do pedido: R$ 25.90"
}
```
ou
```json
{
  "success": false,
  "error": "Hóspede inativo"
}
```

**Nota**: A resposta inclui os relacionamentos `hospede` e `produto` completos.

---

#### GET `/api/pedidos`
**Query Params (opcionais):**
- `status`: string (PENDENTE, PREPARANDO, PRONTO, etc.)
- `hospedeId`: number (ID do hóspede)
- `page`: number (página para paginação)
- `limit`: number (itens por página)

**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hospedeId": 1,
      "produtoId": 5,
      "status": "PENDENTE",
      "valor": 25.90,
      "data": "2025-11-30T12:00:00Z",
      "hospede": { ... },
      "produto": { ... }
    }
  ]
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/pedidos`
- ✅ **Relacionamentos incluídos**: `hospede` e `produto` vêm no array
- ✅ Filtro por status: `?status=PENDENTE` (valores: `PENDENTE`, `PREPARANDO`, `PRONTO`, `ENTREGUE`, `CANCELADO`)
- ✅ Filtro por hóspede: `?hospedeId=1`
- ✅ Combinação de filtros: `?hospedeId=1&status=ENTREGUE`
- ✅ Paginação: `?page=1&limit=10`
- ✅ Retorna array vazio se não houver pedidos

---

#### PATCH `/api/pedidos/:id/status`
**Body:**
```json
{
  "status": "PRONTO"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "PRONTO",
    ...
  }
}
```

**Respostas:**
- ✅ Endpoint correto: `/api/pedidos/:id/status`
- ✅ Status válidos: `"PENDENTE"`, `"PREPARANDO"`, `"PRONTO"`, `"ENTREGUE"`, `"CANCELADO"`
- ✅ Retorna o objeto completo do pedido atualizado com relacionamentos

---

## 🔔 Socket.io - Eventos em Tempo Real

### ✅ Eventos que o backend emite:

#### 1. **Novo Pedido Criado**
```javascript
socket.on('novo_pedido', (pedido) => {
  // pedido contém:
  // {
  //   id, hospedeId, produtoId, status, valor, data,
  //   hospede: { id, nome, tipo, ... },
  //   produto: { id, nome, preco, ... }
  // }
});
```

#### 2. **Status do Pedido Atualizado**
```javascript
socket.on('pedido_atualizado', (pedido) => {
  // pedido contém o objeto completo atualizado
});
```

#### 3. **Pedido Cancelado**
```javascript
socket.on('pedido_cancelado', (pedido) => {
  // pedido contém o objeto cancelado
});
```

**Respostas:**
- ✅ Eventos emitidos: `novo_pedido`, `pedido_atualizado`, `pedido_cancelado`
- ✅ Formato: Objeto completo do pedido com relacionamentos (`hospede` e `produto`)
- ⚠️ **Nota**: Os eventos Socket.io estão como `novo_pedido` (não `pedido:novo`)

**Nota**: O backend não emite evento específico de "estoque atualizado", mas o estoque é atualizado automaticamente quando um pedido é criado ou cancelado. O frontend pode consultar o produto novamente se necessário.

---

## ⚠️ Tratamento de Erros

### ✅ Códigos de Status HTTP:

- ✅ **200**: Sucesso
- ✅ **201**: Criado com sucesso
- ✅ **400**: Erro de validação/regra de negócio
- ✅ **401**: Não autorizado
- ✅ **404**: Não encontrado
- ✅ **500**: Erro do servidor

### ✅ Formato das mensagens de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "code": "VALIDATION_ERROR" // Opcional, quando aplicável
}
```

**Exemplos:**
```json
{
  "success": false,
  "error": "PIN inválido ou usuário inativo"
}
```

```json
{
  "success": false,
  "error": "Limite de gasto excedido. Limite: R$ 200.00, Dívida atual: R$ 150.50, Valor do pedido: R$ 25.90"
}
```

---

## 🔐 Segurança e Autenticação

### ✅ Autenticação por PIN

- ✅ **PIN é suficiente** para autenticação básica
- ✅ Não há JWT implementado (adequado para intranet)
- ✅ Para rotas administrativas, há middleware de autenticação via headers:
  - `X-User-Id`: ID do usuário
  - `X-User-Pin`: PIN do usuário

### ✅ CORS

- ✅ CORS configurado e **permitindo todas as origens** por padrão
- ✅ Configurável via variável de ambiente `CORS_ORIGINS` (separado por vírgula)
- ✅ Exemplo: `CORS_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000`

---

## 📝 Validações do Backend

### ✅ Validações Implementadas:

#### 1. **Criar Hóspede:**
- ✅ Pulseira já cadastrada? → Erro 400
- ✅ Documento obrigatório para Day Use? → Erro 400
- ✅ Quarto obrigatório para Hóspede? → Erro 400

#### 2. **Criar Pedido:**
- ✅ Estoque disponível? → Erro 400 se sem estoque
- ✅ Limite de gasto (Day Use)? → Erro 400 se exceder
- ✅ Hóspede ativo? → Erro 400 se inativo
- ✅ Hóspede existe? → Erro 404 se não encontrado
- ✅ Produto existe? → Erro 404 se não encontrado
- ✅ **Transação atômica**: Se qualquer validação falhar, nada é salvo

#### 3. **Autenticação:**
- ✅ PIN válido? → Erro 401 se inválido
- ✅ Usuário ativo? → Erro 401 se inativo

---

## 🎯 Informações Adicionais

### 1. Versão da API
- ❌ Não há versionamento (v1, v2, etc.) - não necessário para este projeto

### 2. Rate Limiting
- ✅ Implementado: **100 requisições por minuto por IP** (configurável)
- ✅ Configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW`

### 3. Timeout
- ⚠️ Não há timeout específico configurado - usar timeout padrão do cliente HTTP (10s no frontend)

### 4. Logs
- ✅ Logs estruturados com Pino
- ✅ Todas as operações críticas são logadas
- ✅ Logs incluem: usuário, IP, operação, detalhes

### 5. Ambiente de Teste
- ✅ Use o mesmo servidor de desenvolvimento
- ✅ Banco SQLite local (`dev.db`)

---

## 📋 Checklist de Informações

- [x] ✅ URL base da API: `http://IP:PORTA/api`
- [x] ✅ Porta do servidor: `3000` (configurável)
- [x] ✅ Protocolo: HTTP
- [x] ✅ Estrutura de resposta padrão: `{ success, data, error }`
- [x] ✅ Endpoints confirmados: TODOS
- [x] ✅ Formato dos dados: JSON
- [x] ✅ Códigos de status HTTP: 200, 201, 400, 401, 404, 500
- [x] ✅ Mensagens de erro: Formatadas e descritivas
- [x] ✅ Validações do backend: TODAS implementadas
- [x] ✅ Eventos Socket.io: `novo_pedido`, `pedido_atualizado`, `pedido_cancelado`
- [x] ✅ Autenticação: Por PIN (sem JWT)
- [x] ✅ CORS configurado: Permitindo todas as origens por padrão

---

## 🚀 Próximos Passos para o Frontend

1. ✅ **Configurar URL da API** em `src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   export const SOCKET_URL = 'http://192.168.1.100:3000';
   ```

2. ✅ **Implementar Socket.io** (se necessário):
   ```typescript
   import io from 'socket.io-client';
   const socket = io('http://192.168.1.100:3000');
   
   socket.on('novo_pedido', (pedido) => { ... });
   socket.on('pedido_atualizado', (pedido) => { ... });
   socket.on('pedido_cancelado', (pedido) => { ... });
   ```

3. ✅ **Ajustar eventos Socket.io**: O backend usa `novo_pedido` (não `pedido:novo`)

4. ✅ **Testar integração completa**

---

## ✅ CONCLUSÃO

**O backend está 100% preparado e compatível com o frontend!**

Todos os endpoints estão implementados, as validações estão funcionando, os eventos Socket.io estão configurados, e o formato de resposta é exatamente o esperado.

**Nenhuma alteração necessária no backend!** 🎉

