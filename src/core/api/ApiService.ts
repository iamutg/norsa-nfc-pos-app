import {
  createApiFailureResult,
  doApiRequest,
  doApiRequestWithBody,
  createApiSuccessResult,
} from './common';
import {ApiEndpoints, HttpMethod} from './constants';
import type {LoginApiResponse, MerchantNameApiResponse} from './types';

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
  // doLogin: async (email: string, password: string) => {
  //   const loginRes = await doApiRequest<{email: string; password: string}>({
  //     endpoint: ApiEndpoints.Login,
  //     method: HttpMethod.Post,
  //     withAuth: false,
  //     data: {email, password},
  //   })();
  //   if (loginRes.failure) {
  //     return createApiFailureResult({
  //       ...loginRes,
  //       message:
  //         loginRes.code === 400
  //           ? 'Email or password is incorrect'
  //           : loginRes.message,
  //     });
  //   }
  //   const merchantNameRes = await doApiRequest({
  //     endpoint: ApiEndpoints.MerchantName,
  //     method: HttpMethod.Get,
  //     withAuth: true,
  //     accessToken: loginRes.data?.accessToken,
  //   })();
  //   if (merchantNameRes.failure) {
  //     return createApiFailureResult(merchantNameRes);
  //   }
  //   return createApiSuccessResult({data: loginRes.data});
  // },
  //   doGetIssuanceHistory: async (cardId: string) => {
  //     const issuanceHistoryRes = await doApiRequest<
  //       GetIssuanceHistoryApiResponse,
  //       ApiReqWithNfcCard
  //     >({
  //       endpoint: ApiEndpoints.IssuanceHistory,
  //       method: HttpMethod.Get,
  //       withAuth: true,
  //       data: {nfcCardId: cardId},
  //     })();
  //     if (issuanceHistoryRes.failure) {
  //       return createApiFailureResult(issuanceHistoryRes);
  //     }
  //     return createApiSuccessResult<IssuanceHistory>({
  //       data: {
  //         ...issuanceHistoryRes.data?.data,
  //         clientCode: issuanceHistoryRes.data?.data?.clientCodeAndFullName?.Code,
  //         clientName:
  //           issuanceHistoryRes.data?.data?.clientCodeAndFullName?.FullName,
  //         paybackPeriod:
  //           issuanceHistoryRes.data?.data?.clientCodeAndFullName?.numberOfMonths,
  //       },
  //     });
  //   },
  //   doGetMultipleIssuaceHistories: async (cardId: string) => {
  //     const multiIssuanceHistoriesRes = await doApiRequest<
  //       GetMultipleIssuanceHistoriesApiResponse,
  //       ApiReqWithNfcCard
  //     >({
  //       endpoint: ApiEndpoints.MultipleIssuanceHistories,
  //       method: HttpMethod.Get,
  //       withAuth: true,
  //       data: {
  //         nfcCardId: cardId,
  //       },
  //     })();
  //     if (multiIssuanceHistoriesRes.failure) {
  //       return createApiFailureResult(multiIssuanceHistoriesRes);
  //     }
  //     return createApiSuccessResult<IssuanceHistory[]>({
  //       data: multiIssuanceHistoriesRes.data?.data?.map(issuanceHistory => ({
  //         ...issuanceHistory,
  //         clientCode: issuanceHistory?.clientCodeAndFullName?.Code,
  //         clientName: issuanceHistory?.clientCodeAndFullName?.FullName,
  //         paybackPeriod: issuanceHistory?.clientCodeAndFullName?.numberOfMonths,
  //       })),
  //     });
  //   },
  //   doCreateTransaction: (transaction: Transaction) =>
  //     doApiRequest<undefined, Transaction>({
  //       endpoint: ApiEndpoints.CreateTransactionHistory,
  //       method: HttpMethod.Post,
  //       withAuth: true,
  //       data: transaction,
  //     }),
  //   doGetDailyTransactions: doApiRequest<Da>(),
};
