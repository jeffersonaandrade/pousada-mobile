# Ícones Necessários para o App

## 📱 Ícones que o Expo estava reclamando:

### 1. **icon.png** (Ícone Principal)
- **Localização:** `./assets/icon.png`
- **Dimensões:** 1024x1024 pixels
- **Formato:** PNG
- **Uso:** Ícone principal do app (aparece na tela inicial do dispositivo)
- **Onde aparece:** 
  - Tela inicial do celular (iOS e Android)
  - App Store / Google Play Store
  - Notificações

### 2. **splash.png** (Tela de Splash/Inicialização)
- **Localização:** `./assets/splash.png`
- **Dimensões:** 1242x2436 pixels (recomendado) ou proporcional
- **Formato:** PNG
- **Uso:** Imagem que aparece quando o app está carregando
- **Onde aparece:** 
  - Primeira tela ao abrir o app
  - Durante o carregamento inicial

### 3. **adaptive-icon.png** (Ícone Adaptativo Android)
- **Localização:** `./assets/adaptive-icon.png`
- **Dimensões:** 1024x1024 pixels
- **Formato:** PNG
- **Uso:** Ícone específico para Android (versões 8.0+)
- **Onde aparece:**
  - Tela inicial do Android
  - Menu de apps do Android
  - Permite animações e máscaras

### 4. **favicon.png** (Ícone Web)
- **Localização:** `./assets/favicon.png`
- **Dimensões:** 48x48 ou 96x96 pixels
- **Formato:** PNG ou ICO
- **Uso:** Ícone quando o app roda no navegador
- **Onde aparece:**
  - Aba do navegador
  - Favoritos

---

## ✅ Status Atual

**TODOS OS ÍCONES FORAM REMOVIDOS TEMPORARIAMENTE** do `app.json` para permitir que o app rode sem erros.

O app funcionará normalmente, mas:
- ❌ Não terá ícone personalizado (usará ícone padrão do Expo)
- ❌ Não terá tela de splash personalizada (usará cor de fundo branca)
- ✅ Funciona perfeitamente para desenvolvimento e testes

---

## 🎨 Como Adicionar os Ícones Depois

### Opção 1: Criar Manualmente
1. Crie as imagens nas dimensões especificadas
2. Salve na pasta `assets/`
3. Atualize o `app.json` com os caminhos

### Opção 2: Usar Ferramenta Online
- **Expo Icon Generator:** https://www.appicon.co/
- **Icon Kitchen (Android):** https://icon.kitchen/
- **Favicon Generator:** https://realfavicongenerator.net/

### Opção 3: Usar Expo CLI (Recomendado)
```bash
# Instalar ferramenta
npm install -g @expo/image-utils

# Gerar ícones automaticamente (precisa de uma imagem base 1024x1024)
npx expo-asset-generator
```

---

## 📝 Exemplo de app.json Completo (quando tiver os ícones)

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## 💡 Dicas

1. **Para desenvolvimento:** Não é necessário ter os ícones agora
2. **Para produção:** Você precisará criar os ícones antes de publicar
3. **Design:** Use cores e elementos que representem sua pousada
4. **Teste:** Sempre teste como o ícone aparece em diferentes dispositivos

