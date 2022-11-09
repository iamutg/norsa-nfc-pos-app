import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuthContext} from '~/context/AuthContext';
import {
  PrintExpense,
  Home,
  Login,
  Splash,
  PrinterConfig,
  SelectMerchantId,
} from '~/screens';
import {RootStackParamList} from '~/types';
import {stackScreenOptions} from './config';
import {routeNames} from './routeNames';

const RootStack = createStackNavigator<RootStackParamList>();

const RootNav = () => {
  const {isLoading, isLoggedIn, merchantIdSelected} = useAuthContext();

  const renderScreens = () => {
    // return (
    //   <>
    //     <RootStack.Screen
    //       name={routeNames.PrintExpense}
    //       component={PrintExpense}
    //     />
    //   </>
    // );

    if (isLoading) {
      return (
        <>
          <RootStack.Screen name={routeNames.Splash} component={Splash} />
        </>
      );
    } else if (!isLoggedIn) {
      return (
        <>
          <RootStack.Screen name={routeNames.Login} component={Login} />
        </>
      );
    } else if (!merchantIdSelected) {
      return (
        <>
          <RootStack.Screen
            name={routeNames.RootSelectMerchantId}
            component={SelectMerchantId}
          />
        </>
      );
    } else {
      return (
        <>
          <RootStack.Screen name={routeNames.Home} component={Home} />
          <RootStack.Screen
            name={routeNames.PrintExpense}
            component={PrintExpense}
          />
          <RootStack.Screen
            name={routeNames.PrinterConfig}
            component={PrinterConfig}
          />
          <RootStack.Screen
            name={routeNames.SelectMerchantId}
            component={SelectMerchantId}
          />
        </>
      );
    }
  };

  return (
    <RootStack.Navigator screenOptions={stackScreenOptions}>
      {renderScreens()}
    </RootStack.Navigator>
  );
};

export default RootNav;
