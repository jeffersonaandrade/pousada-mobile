# ⚠️ Endpoint de Checkout Necessário no Backend

## 📋 Funcionalidade Implementada no Frontend

O frontend já está preparado para fazer checkout, mas **precisa do endpoint no backend**.

---

## 🔌 Endpoint Necessário

### **PATCH `/api/hospedes/:id/checkout`**

**Descrição:**
- Zera a dívida do hóspede
- Desativa/desvincula a pulseira (ou marca como disponível para reuso)
- Retorna o hóspede atualizado

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

**Validações necessárias:**
- ✅ Hóspede existe? → Erro 404 se não encontrado
- ✅ Hóspede já está com dívida zerada? → Pode retornar sucesso ou aviso
- ✅ Pulseira deve ser desvinculada ou marcada como disponível

**Resposta de erro (404):**
```json
{
  "success": false,
  "error": "Hóspede não encontrado"
}
```

---

## 🎯 Como Funciona no Frontend

1. **Recepção seleciona modo "Check-out"**
2. **Lê a pulseira NFC** → Busca hóspede via `GET /api/hospedes/pulseira/:uid`
3. **Mostra informações:**
   - Nome do hóspede
   - Tipo (HOSPEDE, DAY_USE, VIP)
   - Quarto (se aplicável)
   - **Dívida atual em destaque**
4. **Confirma checkout** → Chama `PATCH /api/hospedes/:id/checkout`
5. **Pulseira é liberada** para reuso

---

## ✅ Status

- ✅ **Frontend:** Implementado e pronto
- ⚠️ **Backend:** Endpoint precisa ser criado

---

## 🔄 Alternativa (se o endpoint não existir)

Se o backend não tiver esse endpoint específico, pode usar:

1. **PATCH `/api/hospedes/:id`** com body:
   ```json
   {
     "dividaAtual": 0,
     "ativo": false
   }
   ```

2. Ou criar um endpoint específico de checkout que faz tudo de uma vez.

---

## 📝 Nota

O frontend está chamando `realizarCheckout(hospedeId)` que faz `PATCH /api/hospedes/:id/checkout`.

Se o endpoint tiver outro nome ou formato, ajuste em `src/services/api.ts`.

