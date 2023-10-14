import {AxiosError} from 'axios';
import {SuccessResult, FailureResult} from '~/types';
import {HttpMethod} from './constants';

export type ApiRequestConfig<D extends object = {}> = {
  endpoint: string;
  method: HttpMethod;
  data?: D;
  withAuth: boolean;
  accessToken?: string;
};

export type ApiSuccessResult<D> = SuccessResult<D> & {code: number};

export type ApiFailureResult<E = undefined | AxiosError | Error> =
  FailureResult<number, E>;

export type ApiResult<R> = ApiSuccessResult<R> | ApiFailureResult;

export type CustomErrorHandler = (error: unknown) => ApiFailureResult;

export type GeneralApiResponseData = {message?: string};
