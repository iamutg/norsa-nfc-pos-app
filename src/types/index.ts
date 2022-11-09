import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {routeNames} from '~/navigation/routeNames';

// Common

export type PickerItem = {
  title: string;
  value: string;
};

export type PrinterConfig = {
  printerDpi: number;
  printerWidthMM: number;
  printerNbrCharactersPerLine: number;
};

export interface PosPrinterInterface {
  print: (
    textToBePrinted: string,
    printerDpi: number,
    printerWidthMM: number,
    printerNbrCharactersPerLine: number,
  ) => Promise<boolean>;
}

export interface EmptyProps {}

export type NfcTagReadResult = {
  success: boolean;
  error: string;
  text: string;
};

export type NfcTagWriteResult = {
  success: boolean;
  error: string;
};

export type ParseTagResult = {
  success: boolean;
  error: string;
  text: string;
};

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

export type LoginData = {
  id?: string;
  accessToken?: string;
  refreshToken?: string;
  dormantUser?: number;
  isAdmin?: number;
  expiryDate?: number;
  name?: string;
  pinCode?: string;
  Merchant_ID?: string;
  Merchant_Group?: {Name?: string; Id?: string}[];
};

export type LoginApiRequest = {
  email: string;
  password: string;
};

export type LoginApiResponse = {
  result?: string;
  message?: string;
  data?: LoginData;
};

export type LoginSuccessResponse = {
  data?: LoginData;
};

export type MerchantNameApiResponse = {
  Name?: string;
};

export type LoginResponse = LoginSuccessResponse & GeneralFailureResponse;

export type IssuanceHistory = {
  id?: string;
  Client_id?: string;
  Pincode?: string;
  DateTime?: string;
  Amount?: string;
  AmountPaid?: string;
  Balance?: string;
  clientCode?: string;
  clientName?: string;
  paybackPeriod?: number;
};

export type GetIssuanceHistoryApiRequest = {
  nfcCardId: string;
};

export type GetIssuanceHistoryApiResponse = {
  error?: string;
  data?: {
    data?: {
      id?: string;
      Client_id?: string;
      Pincode?: string;
      DateTime?: string;
      Amount?: string;
      AmountPaid?: string;
      Balance?: string;
    };
    clientCodeAndFullName?: {
      Code?: string;
      FullName?: string;
      numberOfMonths?: number;
    };
  };
};

export type GetMultipleIssuanceHistoriesApiResponse = {
  error?: string;
  data?: Array<{
    data?: {
      id?: string;
      Client_id?: string;
      Pincode?: string;
      DateTime?: string;
      Amount?: string;
      AmountPaid?: string;
      Balance?: string;
    };
    clientCodeAndFullName?: {
      Code?: string;
      FullName?: string;
      numberOfMonths?: number;
    };
  }>;
};

export type GetIssuanceHistorySuccessResponse = {
  data?: IssuanceHistory;
};

export type GetIssuanceHistoriesSuccessResponse = {
  data?: Array<IssuanceHistory>;
};

export type GetIssuanceHistoryResponse = GetIssuanceHistorySuccessResponse &
  GeneralFailureResponse;

export type GetMultipleIssuanceHistoriesResponse =
  GetIssuanceHistoriesSuccessResponse & GeneralFailureResponse;

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

export enum TransactionType {
  expense = 1,
  retour = 2,
}

export type Transaction = {
  Client_id: string;
  Merchant_ID: string;
  issuancehistoryId: string;
  ItemDescription: 'Expense' | 'Retour';
  dateTime: string;
  AmountUser: number;
  transactionType: TransactionType;
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

export type DailyTransaction = {
  id?: string;
  Client_id?: string;
  Merchant_ID?: string;
  ItemDescription?: string;
  dateTime?: string;
  AmountUser?: number;
  issuancehistoryId?: string;
  transactionType?: number;
  totalPaybackPeriods?: number;
};

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
  merchantIdSelected: boolean;
  loginData: LoginData | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  onLoginSuccess: (data: LoginData) => Promise<void>;
  onSelectMerchantId: (merchantId: string) => Promise<void>;
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
  [routeNames.SelectMerchantId]: {fromHomeScreen: boolean};
};

export type RootStackParamList = SplashStackParamList &
  AuthStackParamList &
  MainStackParamList & {
    [routeNames.RootSelectMerchantId]: {
      fromHomeScreen?: boolean;
    };
  };

export type SelectMerchantIdScreenProp = StackScreenProps<
  MainStackParamList,
  routeNames.SelectMerchantId
>;

export type HomeScreenProp = StackScreenProps<
  MainStackParamList,
  routeNames.Home
>;

export type AddItemsScreeProps = StackScreenProps<
  MainStackParamList,
  routeNames.PrintExpense
>;
