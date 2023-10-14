import {MMKV} from 'react-native-mmkv';
import {FailureResult, PrinterConfig, SuccessResult} from '~/types';
import {PrinterDefaultConfigObject} from '~/constants';

export type LocalStorageFailureResult = Omit<
  FailureResult<undefined, Error>,
  'code'
>;

export type LocalStorageSetSuccessResult = Omit<SuccessResult<any>, 'data'>;

export type LocalStorageServiceSetResult =
  | LocalStorageSetSuccessResult
  | LocalStorageFailureResult;

export type LocalStorageGetResult<D> =
  | SuccessResult<D>
  | LocalStorageFailureResult;

const GeneralErrorMessage = 'Unable to set/get value to/from Local storage';

const formatErrorMessage = (key: string, type: 'set' | 'get', value?: any) =>
  type === 'get'
    ? `Unable to get for key: ${key}`
    : `Unable to set value: ${value} for key: ${key}`;

const createLocalStorageGetSuccessResult = <D = undefined>(
  result?: Partial<SuccessResult<D>>,
): SuccessResult<D> => ({
  success: true,
  failure: false,
  data: result?.data,
});

const createLocalStorageSetSuccessResult =
  (): LocalStorageSetSuccessResult => ({
    success: true,
    failure: false,
  });

const createStorageFailureResult = (
  result?: Partial<LocalStorageFailureResult>,
): LocalStorageFailureResult => ({
  success: false,
  failure: true,
  message: result?.message ?? GeneralErrorMessage,
  cause: result?.cause,
});

const handleError = (error: unknown, message: string) =>
  createStorageFailureResult({cause: error, message});

const Storage = new MMKV();

enum LocalStorageKey {
  Login = 'app/loginData',
  DailyReportPrintedDate = 'app/dailyReportPrintedDate',
  PrinterDefaultConfig = 'app/printerDefaultConfig',
  PreviousPrintedReceipt = 'app/previousPrintedReceipt',
}

export const LocalStorageService = {
  Keys: LocalStorageKey,
  setString(key: LocalStorageKey, value: string) {
    try {
      Storage.set(key, value);
      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'set', value));
    }
  },
  getString(key: LocalStorageKey) {
    try {
      const stringFromStorage = Storage.getString(key);
      return createLocalStorageGetSuccessResult({data: stringFromStorage});
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'get'));
    }
  },
  setObject<T extends object>(key: LocalStorageKey, value: T) {
    try {
      const objectJson = JSON.stringify(value);
      Storage.set(key, objectJson);

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'set', value));
    }
  },
  getObject<T extends object>(key: LocalStorageKey) {
    try {
      const objectJson = Storage.getString(key);

      if (objectJson) {
        const obj: T = JSON.parse(objectJson);
        return createLocalStorageGetSuccessResult({data: obj});
      } else {
        return createLocalStorageGetSuccessResult();
      }
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'get'));
    }
  },
  clearKey(key: LocalStorageKey) {
    try {
      Storage.delete(key);

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, `Unable to clear key: ${key}`);
    }
  },
  clearAll() {
    try {
      Storage.clearAll();

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, 'Unable to clear all storage');
    }
  },
  getPrinterDefaultConfig(): PrinterConfig {
    const getConfigRes = this.getObject<PrinterConfig>(
      this.Keys.PrinterDefaultConfig,
    );

    return getConfigRes.success
      ? getConfigRes.data ?? PrinterDefaultConfigObject
      : PrinterDefaultConfigObject;
  },
};
