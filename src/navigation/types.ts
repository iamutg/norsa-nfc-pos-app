import type {
  StackNavigationProp,
  StackScreenProps,
} from '@react-navigation/stack';
import type {Client, NfcTagScanningReason} from '~/types';

export enum RouteName {
  Splash = 'Splash',
  Login = 'Login',
  Home = 'Home',
  PrinterConfig = 'PrinterConfig',
  PrintExpense = 'PrintExpense',
}

export type SplashStackParamList = {
  [RouteName.Splash]: undefined;
};

export type AuthStackParamList = {
  [RouteName.Login]: undefined;
};

export type MainStackParamList = {
  [RouteName.Home]: undefined;
  [RouteName.PrinterConfig]: undefined;
  [RouteName.PrintExpense]: {
    client: Client;
    paybackPeriod: number;
    maxAmount: number;
    cardId: string;
    pinCode: string;
    issuanceHistoryId: string;
    paymentType: NfcTagScanningReason;
  };
};

export type RootStackParamList = SplashStackParamList &
  AuthStackParamList &
  MainStackParamList;

export type HomeScreenNavProp = StackNavigationProp<
  MainStackParamList,
  RouteName.Home
>;

export type AddItemsScreeProps = StackScreenProps<
  MainStackParamList,
  RouteName.PrintExpense
>;
