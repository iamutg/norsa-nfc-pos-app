import {AppMode, PrinterConfig} from '~/types';

const DEV_BASE_URL = 'https://norsa-backend-demo.herokuapp.com/api/';
const PROD_BASE_URL = 'https://norsabackend.herokuapp.com/api/';

export const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

export const authEndpoints = {
  login: 'auth/login',
};

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
