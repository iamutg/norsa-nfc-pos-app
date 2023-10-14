import {AppMode, PrinterConfig} from '~/types';

export enum AppEnv {
  Staging = 'Staging',
  Prod = 'Prod',
}

export const SelectedAppEnv = __DEV__ ? AppEnv.Staging : AppEnv.Prod;

export const mainEndpoints = {
  getIssuanceHistory: 'issuancehistory/OnNfcAndPinCode',
  getMultipleIssuanceHistories: 'issuancehistory/OnNfcAndPinCodeMI',
  getClient: (clientId: string) => `clients/getClientById/${clientId}`,
  createTransactionHistory: 'transactionHistory/createTransactionHistory',
  getMerchantId: (userId: string) =>
    `auth/getMerchantIdForLoggedInUser/${userId}`,
  getDailyTransactions: 'transactionHistory/getMerchantsTodaysTransactions',
  getMerchantName: 'merchants/getMerchantNameByUserId',
  getDailySalesPrintCheck: (merchantId: string) =>
    `dailySalesPrintCheck/getByMerchantId/${merchantId}`,
  postDailySalesPrintCheck: (merchantId: string) =>
    `dailySalesPrintCheck/update/${merchantId}`,
};

export const PrinterDefaultConfigObject: PrinterConfig = {
  printerDpi: 150,
  printerWidthMM: 48,
  printerNbrCharactersPerLine: 30,
};

export const appModes: AppMode = 'expense-retour';
