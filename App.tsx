import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme/colors';
import { socketService } from './src/services/socket';
import { getServerConfig } from './src/services/config';
import { updateApiBaseURL } from './src/services/api';

// Screens
import ConfigScreen from './src/screens/ConfigScreen';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import RecepcaoScreen from './src/screens/RecepcaoScreen';
import CardapioScreen from './src/screens/CardapioScreen';
import CarrinhoScreen from './src/screens/CarrinhoScreen';
import KioskWelcomeScreen from './src/screens/KioskWelcomeScreen';
import KioskExtratoScreen from './src/screens/KioskExtratoScreen';
import ProdutoDetalhesScreen from './src/screens/ProdutoDetalhesScreen';
import PedidosScreen from './src/screens/PedidosScreen';
import GovernanceScreen from './src/screens/GovernanceScreen';
import { Produto } from './src/types';

export type RootStackParamList = {
  Config: undefined;
  Login: undefined;
  Menu: undefined;
  CheckIn: undefined;
  Recepcao: undefined;
  Cardapio: undefined;
  Carrinho: undefined;
  KioskWelcome: undefined;
  KioskExtrato: undefined;
  ProdutoDetalhes: { produto: Produto };
  Pedidos: undefined;
  Governance: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Config' | 'Login'>('Config');

  useEffect(() => {
    // Carregar configuração do servidor e verificar se há IP salvo
    const initializeApp = async () => {
      try {
        const config = await getServerConfig();
        
        if (config) {
          // IP configurado: configurar API e Socket
          updateApiBaseURL(config.apiUrl);
          socketService.connect(config.socketUrl);
          console.log('✅ App inicializado com IP:', config.ip);
          
          // Se tiver IP, pode ir direto para Login (ou manter Config se preferir)
          // Por enquanto, mantém Config como inicial para permitir mudança
          setInitialRoute('Config');
        } else {
          // Sem IP configurado: OBRIGATÓRIO ir para Config
          console.log('ℹ️ IP do servidor não configurado. Redirecionando para Config.');
          setInitialRoute('Config');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar app:', error);
        // Em caso de erro, vai para Config para permitir configuração
        setInitialRoute('Config');
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    // Cleanup ao desmontar
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Aguardar inicialização antes de renderizar
  if (!isReady) {
    return null; // Ou um componente de loading se preferir
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Config"
            component={ConfigScreen}
            options={{ title: 'Configuração Inicial' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Acesso da Equipe' }}
          />
          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{ 
              title: 'Menu Principal',
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="CheckIn"
            component={CheckInScreen}
            options={{ 
              title: 'Check-in de Hóspede',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Recepcao"
            component={RecepcaoScreen}
            options={{ 
              title: 'Recepção',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Cardapio"
            component={CardapioScreen}
            options={{ 
              title: 'Cardápio',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Carrinho"
            component={CarrinhoScreen}
            options={{ 
              title: 'Carrinho',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="KioskWelcome"
            component={KioskWelcomeScreen}
            options={{ 
              title: 'Bem-vindo',
              headerShown: false 
            }}
          />
          <Stack.Screen
            name="KioskExtrato"
            component={KioskExtratoScreen}
            options={{ 
              title: 'Meu Extrato',
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="ProdutoDetalhes"
            component={ProdutoDetalhesScreen}
            options={{ title: 'Detalhes do Produto' }}
          />
          <Stack.Screen
            name="Pedidos"
            component={PedidosScreen}
            options={{ 
              title: 'Meus Pedidos (24h)',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Governance"
            component={GovernanceScreen}
            options={{ 
              title: 'Governança / Limpeza',
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
