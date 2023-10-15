import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {routeNames} from '~/navigation/routeNames';

// Common

export interface SuccessResult<D> {
  success: true;
  failure: false;
  data?: D;
}

export interface FailureResult<C, E> {
  success: false;
  failure: true;
  message: string;
  code: C;
  cause?: E | unknown;
}

export type Result<D, C, E> = SuccessResult<D> | FailureResult<C, E>;

export type Nullable<T> = T | null;

export type PickerItem = {
  title: string;
  value: string;
};

export type PrinterConfig = {
  printerDpi: number;
  printerWidthMM: number;
  printerNbrCharactersPerLine: number;
};

export interface PosPrinterModule {
  print: (
    textToBePrinted: string,
    printerDpi: number,
    printerWidthMM: number,
    printerNbrCharactersPerLine: number,
  ) => Promise<boolean>;
}

export interface EmptyProps {}

export type NfcTagOperationStatus = 'scanning' | 'error' | 'success' | 'none';

export type NfcTagScanningReason = 'expense' | 'balance' | 'retour';

export type AppMode = 'expense-retour' | 'expense' | 'retour';

export type PrintBalanceInfo = {
  balance?: number;
  cardNumber?: string;
  customerName?: string;
};

// Api Requests and Responses

export type GeneralFailureResponse = {
  message?: string;
};

export type Merchant = {Name?: string; Id?: string; pinCode?: string};

export type MerchantNameApiResponse = {
  Name?: string;
};

export type LoginResponse = LoginSuccessResponse & GeneralFailureResponse;

export type Client = {
  id: string;
  code: string;
  name: string;
};

export type GetClientApiResponse = Client | null;

export type GetClientSuccessResponse = {
  data?: Client;
};

export type GetClientResponse = GetClientSuccessResponse &
  GeneralFailureResponse;

export type CreateTransactionHistoryApiResponse = {
  message?: string;
};

export type CreateTransactionHistoryResponse = {
  success: boolean;
  message?: string;
};

export type MerchantId = {
  id?: string;
};

export type GetMerchantIdApiResponse = {
  success?: string;
  data?: Array<MerchantId>;
};

export type GetMerchantIdSuccessResponse = {
  data?: string;
};

export type GetMerchantIdResponse = GetMerchantIdSuccessResponse &
  GeneralFailureResponse;

export type GetDailyTransactionsApiResponse = {
  message?: string;
  data?: Array<DailyTransaction>;
};

export type GetDailyTransactionsSuccessResponse = {
  data?: Array<DailyTransaction>;
};

export type GetDailyTransactionsResponse = GetDailyTransactionsSuccessResponse &
  GeneralFailureResponse;

export type GetDailySalesPrintCheckApiSuccessResponse = {
  id?: string;
  status?: number;
  datePrinted?: string;
  merchantId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GetDailySalesPrintCheckApiResponse =
  GetDailySalesPrintCheckApiSuccessResponse | null;

export type GetDailySalesPrintCheckResponse =
  GetDailySalesPrintCheckApiResponse & GeneralFailureResponse;

export type DailySalesPrintCheck = {
  status: boolean;
  datePrinted: string;
};

export type PostDailySalesPrintCheckApiResponse = {
  success?: boolean;
};

export type PostDailySalesPrintCheckResponse =
  PostDailySalesPrintCheckApiResponse & GeneralFailureResponse;

// Context

export type AuthContext = {
  isLoading: boolean;
  isLoggedIn: boolean;
  loginData: LoginData | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  onLoginSuccess: (data: LoginData) => void;
  checkUserSession: () => Promise<void>;
};

export type AuthContextValue = AuthContext | undefined;

// Navigation

export type SplashStackParamList = {
  [routeNames.Splash]: undefined;
};

export type AuthStackParamList = {
  [routeNames.Login]: undefined;
};

export type MainStackParamList = {
  [routeNames.Home]: undefined;
  [routeNames.PrinterConfig]: undefined;
  [routeNames.PrintExpense]: {
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
  routeNames.Home
>;

export type AddItemsScreeProps = StackScreenProps<
  MainStackParamList,
  routeNames.PrintExpense
>;
