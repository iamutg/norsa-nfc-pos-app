import Axios, {AxiosError, AxiosInstance, AxiosResponse} from 'axios';
import {authEndpoints, BASE_URL, mainEndpoints} from '~/constants';
import {
  CreateTransactionHistoryApiResponse,
  CreateTransactionHistoryResponse,
  DailySalesPrintCheck,
  GetClientApiResponse,
  GetClientResponse,
  GetDailySalesPrintCheckApiResponse,
  GetDailySalesPrintCheckResponse,
  GetDailyTransactionsApiResponse,
  GetDailyTransactionsResponse,
  GetIssuanceHistoryApiRequest,
  GetIssuanceHistoryApiResponse,
  GetIssuanceHistoryResponse,
  GetMerchantIdApiResponse,
  GetMerchantIdResponse,
  GetMultipleIssuanceHistoriesApiResponse,
  GetMultipleIssuanceHistoriesResponse,
  IssuanceHistory,
  LoginApiRequest,
  LoginApiResponse,
  LoginResponse,
  MerchantNameApiResponse,
  PostDailySalesPrintCheckApiResponse,
  PostDailySalesPrintCheckResponse,
  Transaction,
} from '~/types';
import {getAuthToken} from './LocalStorageService';

const axios = Axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': ' application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

const getAxiosInstanceWithAuthHeader: () => Promise<AxiosInstance> =
  async () => {
    const authToken = await getAuthToken();

    const _axios = Axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': ' application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      timeout: 15000,
    });

    return _axios;
  };

export const doLogin = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<
      LoginApiResponse,
      AxiosResponse<LoginApiResponse, LoginApiRequest>,
      LoginApiRequest
    >(authEndpoints.login, {email, password});

    const merchantNameApiRes = await axios.get<
      MerchantNameApiResponse,
      AxiosResponse<MerchantNameApiResponse>
    >(mainEndpoints.getMerchantName, {
      headers: {
        Authorization: `Bearer ${response.data?.data?.accessToken}`,
      },
    });

    const data = response.data?.data;
    data.name = merchantNameApiRes.data?.Name;

    return {
      data,
    };
  } catch (error) {
    if (Axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<LoginApiResponse, LoginApiRequest>;
      console.log('Axios error: ', axiosError?.response?.data ?? axiosError);

      if (axiosError.response.status === 400) {
        return {
          message: 'email or password is incorrect',
        };
      }

      return {
        message: axiosError?.response?.data?.message ?? 'Something went wrong',
      };
    } else {
      console.log('Error Sending login request: ', error);

      return {
        message: error?.message ?? 'Something went wrong',
      };
    }
  }
};

export const doGetIssuanceHistory: (
  cardId: string,
) => Promise<GetIssuanceHistoryResponse> = async cardId => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.post<
      GetIssuanceHistoryApiResponse,
      AxiosResponse<
        GetIssuanceHistoryApiResponse,
        GetIssuanceHistoryApiRequest
      >,
      GetIssuanceHistoryApiRequest
    >(mainEndpoints.getIssuanceHistory, {
      nfcCardId: cardId,
    });

    if (response.data?.data) {
      const issuanceHistory: IssuanceHistory = {
        ...response.data.data.data,
        clientCode: response.data.data?.clientCodeAndFullName?.Code,
        clientName: response.data.data?.clientCodeAndFullName?.FullName,
        paybackPeriod:
          response.data.data?.clientCodeAndFullName?.numberOfMonths,
      };

      return {
        data: issuanceHistory,
      };
    }
  } catch (error) {
    console.log('Error Getting Issuance Histroy: ', error);

    if (Axios.isAxiosError(error)) {
      const _error = error as AxiosError<GetIssuanceHistoryApiResponse>;

      return {
        message: _error.response.data?.error || 'Something went wrong',
      };
    }

    return {
      message: 'Something went wrong',
    };
  }
};

export const doGetMultipleIssuanceHistories: (
  cardId: string,
) => Promise<GetMultipleIssuanceHistoriesResponse> = async cardId => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.post<
      GetMultipleIssuanceHistoriesApiResponse,
      AxiosResponse<
        GetMultipleIssuanceHistoriesApiResponse,
        GetIssuanceHistoryApiRequest
      >,
      GetIssuanceHistoryApiRequest
    >(mainEndpoints.getMultipleIssuanceHistories, {
      nfcCardId: cardId,
    });

    if (response.data?.data) {
      const issuanceHistories: Array<IssuanceHistory> = response.data.data.map(
        data => ({
          ...data.data,
          clientCode: data?.clientCodeAndFullName?.Code,
          clientName: data?.clientCodeAndFullName?.FullName,
          paybackPeriod: data?.clientCodeAndFullName?.numberOfMonths,
        }),
      );

      return {
        data: issuanceHistories,
      };
    }
  } catch (error) {
    console.log('Error Getting Issuance Histroy: ', error);

    if (Axios.isAxiosError(error)) {
      const _error = error as AxiosError<GetIssuanceHistoryApiResponse>;

      return {
        message: _error.response.data?.error || 'Something went wrong',
      };
    }

    return {
      message: 'Something went wrong',
    };
  }
};

export const doGetClient: (
  clientId: string,
) => Promise<GetClientResponse> = async clientId => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.get<
      GetClientApiResponse,
      AxiosResponse<GetClientApiResponse>
    >(mainEndpoints.getClient(clientId));

    return {
      data: response.data,
    };
  } catch (error) {
    console.log('Error Getting Client: ', error);

    return {
      message: 'Something went wrong',
    };
  }
};

export const doGetMerchantId: (
  userId: string,
) => Promise<GetMerchantIdResponse> = async userId => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.get<
      GetMerchantIdApiResponse,
      AxiosResponse<GetMerchantIdApiResponse>
    >(mainEndpoints.getMerchantId(userId));

    if (response.data?.data?.length > 0) {
      return {
        data: response.data.data[0]?.id,
      };
    } else {
      return {
        message: 'Something went wrong',
      };
    }
  } catch (error) {
    console.log('Error getting merchant id', error);

    return {
      message: 'Something went wrong',
    };
  }
};

export const doCreateTrasactionHistory: (
  transaction: Transaction,
) => Promise<CreateTransactionHistoryResponse> = async transaction => {
  try {
    console.log(transaction);
    const axios = await getAxiosInstanceWithAuthHeader();

    const apiResponse = await axios.post<
      CreateTransactionHistoryApiResponse,
      AxiosResponse<CreateTransactionHistoryApiResponse, Transaction>,
      Transaction
    >(mainEndpoints.createTransactionHistory, transaction);

    return {
      success: true,
      message: apiResponse.data.message,
    };
  } catch (error) {
    console.log('Error creating transaction history', error);

    if (Axios.isAxiosError(error)) {
      const _error = error as AxiosError<CreateTransactionHistoryApiResponse>;

      console.log(_error.response.data);
      return {
        success: false,
        message: _error.response.data?.message || 'Something went wrong',
      };
    }

    return {
      success: false,
      message: 'Something went wrong',
    };
  }
};

export const doGetDailyTransactions: () => Promise<GetDailyTransactionsResponse> =
  async () => {
    try {
      const axios = await getAxiosInstanceWithAuthHeader();

      const response = await axios.get<
        GetDailyTransactionsApiResponse,
        AxiosResponse<GetDailyTransactionsApiResponse>
      >(mainEndpoints.getDailyTransactions);

      if (response.data?.message === 'success') {
        return {
          data: response.data?.data,
        };
      } else {
        return {
          message: 'Something went wrong',
        };
      }
    } catch (error) {
      console.log('Error getting daily transactions', error);

      return {
        message: 'Something went wrong',
      };
    }
  };

export const doGetDailySalesPrintCheck: (
  merchantId: string,
) => Promise<GetDailySalesPrintCheckResponse> = async merchantId => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.get<GetDailySalesPrintCheckApiResponse>(
      mainEndpoints.getDailySalesPrintCheck(merchantId),
    );

    return response?.data;
  } catch (error) {
    console.log('Error getting daily sales print check: ', error);

    return {
      message: 'Something went wrong',
    };
  }
};

export const doPostDailySalesPrintCheck: (
  merchantId: string,
  dailySalesPrintCheck: DailySalesPrintCheck,
) => Promise<PostDailySalesPrintCheckResponse> = async (
  merchantId,
  dailySalesPrintCheck,
) => {
  try {
    const axios = await getAxiosInstanceWithAuthHeader();

    const response = await axios.post<
      PostDailySalesPrintCheckApiResponse,
      AxiosResponse<PostDailySalesPrintCheckApiResponse, DailySalesPrintCheck>,
      DailySalesPrintCheck
    >(mainEndpoints.postDailySalesPrintCheck(merchantId), dailySalesPrintCheck);

    return {
      success: response.data?.success,
    };
  } catch (error) {
    console.log('Error posting daily sales print check: ', error);

    return {
      message: 'Something went wrong',
    };
  }
};
