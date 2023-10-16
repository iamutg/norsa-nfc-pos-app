import {AxiosError} from 'axios';
import {SuccessResult, FailureResult} from '~/types';
import {HttpMethod} from './constants';
import {LoginData} from '~/state';

type ApiRequestConfigBase = {
  endpoint: string;
  method: HttpMethod;
  withAuth: boolean;
  accessToken?: string;
};

export type ApiRequestConfig<D> = D extends undefined
  ? ApiRequestConfigBase & {data?: D}
  : ApiRequestConfigBase & {data: D};

export type ApiSuccessResult<D> = SuccessResult<D> & {code: number};

export type ApiFailureResult = FailureResult<
  number,
  undefined | AxiosError | Error
>;

export type ApiResult<R> = ApiSuccessResult<R> | ApiFailureResult;

export type CustomErrorHandler = (error: unknown) => ApiFailureResult;

export type GeneralApiResponseData = {message?: string};

export type ApiReqWithNfcCard = {nfcCardId: string};

export type GeneralApiResponse<D = any> = {
  error?: string;
  data?: D;
};

export type LoginApiResponse = GeneralApiResponse<LoginData>;

export type MerchantNameApiResponse = GeneralApiResponse<{Name?: string}>;

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

export type IssuanceHistoryApiResponse = {
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

export type GetIssuanceHistoryApiResponse =
  GeneralApiResponse<IssuanceHistoryApiResponse>;

export type GetMultipleIssuanceHistoriesApiResponse = GeneralApiResponse<
  IssuanceHistoryApiResponse[]
>;
