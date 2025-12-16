# Como Rodar o App no Emulador Android

## 📱 Como o Expo Funciona no Emulador

### ⚠️ **IMPORTANTE: Expo Go NÃO cria ícone permanente!**

Quando você roda `npm run android`, o Expo:
1. ✅ Abre o app **automaticamente** no emulador
2. ❌ **NÃO cria** um ícone na tela inicial
3. ✅ O app fica rodando enquanto o servidor Expo estiver ativo

---

## 🚀 Como Rodar no Emulador

### **Opção 1: Comando Direto (Recomendado)**
```bash
npm run android
```

Este comando:
- Inicia o servidor Expo
- Detecta o emulador Android
- Abre o app automaticamente no emulador

### **Opção 2: Passo a Passo**
```bash
# 1. Iniciar o servidor Expo
npm start

# 2. No terminal do Expo, pressione 'a' para abrir no Android
# (ou aguarde detectar automaticamente)
```

---

## 🔍 Como Verificar se Está Rodando

### **1. Verificar se o Emulador está Aberto**
- Abra o Android Studio
- Vá em **Tools → Device Manager**
- Verifique se há um emulador rodando

### **2. Verificar se o App Abriu**
- O app deve abrir **automaticamente** no emulador
- Você verá a tela inicial do app (ConfigScreen)
- Se não abrir, verifique os logs no terminal

### **3. Verificar Logs**
No terminal onde rodou `npm run android`, você verá:
```
› Opening on Android...
› Starting Metro Bundler...
```

---

## 🛠️ Solução de Problemas

### **Problema: App não abre automaticamente**

**Solução 1:** Verificar se o emulador está rodando
```bash
# No Android Studio, inicie um emulador primeiro
# Depois rode: npm run android
```

**Solução 2:** Limpar cache e tentar novamente
```bash
npx expo start --clear --android
```

**Solução 3:** Verificar se o ADB está funcionando
```bash
# No terminal (se tiver ADB instalado)
adb devices
# Deve listar o emulador
```

### **Problema: Não consigo encontrar o app no emulador**

**Isso é normal!** O Expo Go não cria ícone permanente. O app:
- ✅ Abre automaticamente quando você roda `npm run android`
- ✅ Fica rodando enquanto o servidor Expo estiver ativo
- ❌ Não aparece na lista de apps do emulador

### **Problema: App fecha sozinho**

Isso pode acontecer se:
- O servidor Expo parou
- O emulador perdeu conexão com o servidor
- Houve um erro no app

**Solução:** Rode `npm run android` novamente

---

## 📦 Para Criar um App Permanente (Development Build)

Se você quiser um ícone permanente no emulador, precisa fazer um **Development Build**:

### **1. Instalar EAS CLI**
```bash
npm install -g eas-cli
```

### **2. Configurar EAS**
```bash
eas build:configure
```

### **3. Fazer Build de Desenvolvimento**
```bash
eas build --profile development --platform android
```

Isso criará um APK que você pode instalar no emulador e terá um ícone permanente.

**⚠️ Nota:** Isso leva mais tempo e é mais complexo. Para desenvolvimento, usar `npm run android` é suficiente.

---

## ✅ Resumo

- **Para desenvolvimento:** Use `npm run android` - o app abre automaticamente
- **Não precisa de ícone:** O app roda diretamente quando você inicia
- **Se o app não abrir:** Verifique se o emulador está rodando e tente novamente
- **Para ícone permanente:** Faça um Development Build (mais complexo)

---

## 🎯 Dica

Se você quiser sempre ter o app aberto:
1. Rode `npm run android`
2. Deixe o terminal aberto (não feche)
3. O app ficará rodando no emulador
4. Se fechar o app, rode o comando novamente

