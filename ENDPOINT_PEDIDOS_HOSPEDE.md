# 📋 Endpoint para Buscar Pedidos de um Hóspede

## 🔌 Endpoint Necessário

### **GET `/api/pedidos?hospedeId=:id`**

**Descrição:**
- Busca todos os pedidos de um hóspede específico
- Usado para gerar o resumo de gastos na tela de checkout

**Query Params:**
- `hospedeId`: ID do hóspede (number, obrigatório)

**Exemplo CURL:**
```bash
curl -X GET "http://localhost:3000/api/pedidos?hospedeId=1" \
  -H "Content-Type: application/json"
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hospedeId": 1,
      "produtoId": 5,
      "status": "ENTREGUE",
      "valor": 25.90,
      "data": "2025-11-30T12:00:00Z",
      "hospede": {
        "id": 1,
        "nome": "João Silva",
        "tipo": "HOSPEDE",
        ...
      },
      "produto": {
        "id": 5,
        "nome": "Hambúrguer",
        "preco": 25.90,
        ...
      }
    },
    {
      "id": 2,
      "hospedeId": 1,
      "produtoId": 3,
      "status": "ENTREGUE",
      "valor": 15.50,
      "data": "2025-11-30T13:00:00Z",
      "hospede": { ... },
      "produto": { ... }
    }
  ]
}
```

**Validações necessárias:**
- ✅ Hóspede existe? → Retorna array vazio se não houver pedidos
- ✅ Relacionamentos incluídos: `hospede` e `produto` devem vir no array

**Resposta quando não há pedidos (200):**
```json
{
  "success": true,
  "data": []
}
```

---

## 🎯 Como Funciona no Frontend

1. **Recepção lê pulseira no modo Check-out**
2. **Sistema busca hóspede** via `GET /api/hospedes/pulseira/:uid`
3. **Sistema busca pedidos** via `GET /api/pedidos?hospedeId=:id`
4. **Botão "Imprimir Resumo" aparece** se houver pedidos
5. **Ao clicar, gera texto formatado** e abre menu de compartilhamento
6. **Usuário pode:**
   - Enviar por WhatsApp
   - Enviar por Email
   - Salvar como arquivo
   - Imprimir (se dispositivo suportar)

---

## ✅ Status

- ✅ **Frontend:** Implementado e pronto
- ⚠️ **Backend:** Precisa aceitar `hospedeId` como query param em `GET /api/pedidos`

---

## 📝 Nota

O frontend está chamando `buscarPedidosPorHospede(hospedeId)` que faz `GET /api/pedidos?hospedeId=:id`.

Se o endpoint tiver outro formato (ex: `GET /api/hospedes/:id/pedidos`), ajuste em `src/services/api.ts`.

