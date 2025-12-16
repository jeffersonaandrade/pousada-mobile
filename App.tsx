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
import ProdutoDetalhesScreen from './src/screens/ProdutoDetalhesScreen';
import PedidosScreen from './src/screens/PedidosScreen';
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
  ProdutoDetalhes: { produto: Produto };
  Pedidos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Carregar configuração do servidor e conectar
    const initializeApp = async () => {
      try {
        const config = await getServerConfig();
        
        if (config) {
          // Configurar API e Socket com o IP salvo
          updateApiBaseURL(config.apiUrl);
          socketService.connect(config.socketUrl);
          console.log('✅ App inicializado com IP:', config.ip);
        } else {
          // Sem IP configurado, a tela de Config vai permitir configurar
          console.log('ℹ️ IP do servidor não configurado. Use a tela de Config para definir.');
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar app:', error);
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
          initialRouteName="Config"
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
            options={{ title: 'Login - Garçom' }}
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
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
