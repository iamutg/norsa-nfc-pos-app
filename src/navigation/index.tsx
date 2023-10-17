import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import {PrintExpense, Home, Login, Splash, PrinterConfig} from '~/screens';
import {stackScreenOptions} from './config';
import {selectLoggedIn, selectSplashLodaing, useGlobalStore} from '~/state';
import {RootStackParamList, RouteName} from './types';

const RootStack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const splashLoading = useGlobalStore(selectSplashLodaing);
  const loggedIn = useGlobalStore(selectLoggedIn);

  const renderScreens = () => {
    if (splashLoading) {
      return (
        <>
          <RootStack.Screen name={RouteName.Splash} component={Splash} />
        </>
      );
    } else if (loggedIn) {
      return (
        <>
          <RootStack.Screen name={RouteName.Home} component={Home} />
          <RootStack.Screen
            name={RouteName.PrintExpense}
            component={PrintExpense}
          />
          <RootStack.Screen
            name={RouteName.PrinterConfig}
            component={PrinterConfig}
          />
        </>
      );
    } else {
      return (
        <>
          <RootStack.Screen name={RouteName.Login} component={Login} />
        </>
      );
    }
  };

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={stackScreenOptions}>
        {renderScreens()}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export * from './types';
