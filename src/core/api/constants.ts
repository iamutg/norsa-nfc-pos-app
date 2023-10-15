import {AppEnv, SelectedAppEnv} from '~/constants';

const BaseUrls = {
  [AppEnv.Staging]: 'https://norsa-backend-demo.herokuapp.com/api/',
  [AppEnv.Prod]: 'https://norsabackend.herokuapp.com/api/',
};

export enum ApiErrorMessage {
  General = 'Something went wrong',
  Network = 'Network error',
  RequestAlreadyExists = 'Request already exists',
  UnableToSendRequest = 'Unable to send request',
  BadRequest = 'The data entered is invalid',
}

export enum HttpMethod {
  Get = 'Get',
  Post = 'Post',
  Put = 'Put',
  Patch = 'Patch',
  Delete = 'Delete',
}

export enum ApiState {
  Idle = 'Idle',
  Pending = 'Pending',
  Success = 'Success',
  Failure = 'Failure',
}

export const mainEndpoints = {
  getDailyTransactions: 'transactionHistory/getMerchantsTodaysTransactions',
  getMerchantName: 'merchants/getMerchantNameByUserId',
  getDailySalesPrintCheck: (merchantId: string) =>
    `dailySalesPrintCheck/getByMerchantId/${merchantId}`,
  postDailySalesPrintCheck: (merchantId: string) =>
    `dailySalesPrintCheck/update/${merchantId}`,
};

export const ApiEndpoints = {
  Login: 'auth/login',
  MerchantName: 'merchants/getMerchantNameByUserId',
  IssuanceHistory: 'issuancehistory/OnNfcAndPinCode',
  MultipleIssuanceHistories: 'issuancehistory/OnNfcAndPinCodeMI',
  CreateTransactionHistory: 'transactionHistory/createTransactionHistory',
};

export const BaseUrl = BaseUrls[SelectedAppEnv];
