import {
  createApiFailureResult,
  doApiRequest,
  doApiRequestWithBody,
  createApiSuccessResult,
} from './common';
import {ApiEndpoints, HttpMethod} from './constants';
import type {
  ApiReqWithNfcCard,
  GetDailyTransactionsApiResponse,
  GetMultipleIssuanceHistoriesApiResponse,
  IssuanceHistory,
  LoginApiResponse,
  MerchantNameApiResponse,
  Transaction,
} from './types';

export const ApiService = {
  doLogin: async (email: string, password: string) => {
    const loginRes = await doApiRequestWithBody<
      {email: string; password: string},
      LoginApiResponse
    >({
      endpoint: ApiEndpoints.Login,
      method: HttpMethod.Post,
      withAuth: false,
      data: {
        email,
        password,
      },
    });

    if (loginRes.failure) {
      loginRes.message = 'Email or password is incorrect';
      return loginRes;
    }

    const merchantNameRes = await doApiRequest<MerchantNameApiResponse>({
      endpoint: ApiEndpoints.MerchantName,
      method: HttpMethod.Get,
      withAuth: true,
      accessToken: loginRes.data?.data?.accessToken,
    });

    if (merchantNameRes.failure) {
      return merchantNameRes;
    }

    if (loginRes.data?.data?.name) {
      loginRes.data.data.name = merchantNameRes.data?.data?.Name;
    }
    return loginRes.data?.data;
  },
  doGetMultipleIssuaceHistories: async (cardId: string) => {
    const multiIssuanceHistoriesRes = await doApiRequestWithBody<
      ApiReqWithNfcCard,
      GetMultipleIssuanceHistoriesApiResponse
    >({
      endpoint: ApiEndpoints.MultipleIssuanceHistories,
      method: HttpMethod.Get,
      withAuth: true,
      data: {
        nfcCardId: cardId,
      },
    });

    if (multiIssuanceHistoriesRes.failure) {
      return createApiFailureResult(multiIssuanceHistoriesRes);
    }

    return createApiSuccessResult<IssuanceHistory[]>({
      data: multiIssuanceHistoriesRes.data?.data?.map(issuanceHistory => ({
        ...issuanceHistory,
        clientCode: issuanceHistory?.clientCodeAndFullName?.Code,
        clientName: issuanceHistory?.clientCodeAndFullName?.FullName,
        paybackPeriod: issuanceHistory?.clientCodeAndFullName?.numberOfMonths,
      })),
    });
  },
  doCreateTransaction: (transaction: Transaction) =>
    doApiRequestWithBody<Transaction>({
      endpoint: ApiEndpoints.CreateTransactionHistory,
      method: HttpMethod.Post,
      withAuth: true,
      data: transaction,
    }),
  doGetDailyTransactions: () =>
    doApiRequest<GetDailyTransactionsApiResponse>({
      endpoint: ApiEndpoints.DailyTransactions,
      method: HttpMethod.Get,
      withAuth: true,
    }),
};
