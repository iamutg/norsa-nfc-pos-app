import AsyncStorage from '@react-native-async-storage/async-storage';
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

enum LocalStorageKey {
  Login = 'app/loginData',
  DailyReportPrintedDate = 'app/dailyReportPrintedDate',
  PrinterDefaultConfig = 'app/printerDefaultConfig',
  PreviousPrintedReceipt = 'app/previousPrintedReceipt',
}

export const LocalStorageService = {
  Keys: LocalStorageKey,

  async setString(key: LocalStorageKey, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'set', value));
    }
  },
  async getString(key: LocalStorageKey) {
    try {
      const stringFromStorage = await AsyncStorage.getItem(key);
      return createLocalStorageGetSuccessResult({data: stringFromStorage});
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'get'));
    }
  },
  async setObject<T extends object>(key: LocalStorageKey, value: T) {
    try {
      const objectJson = JSON.stringify(value);
      await AsyncStorage.setItem(key, objectJson);

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, formatErrorMessage(key, 'set', value));
    }
  },
  async getObject<T extends object>(key: LocalStorageKey) {
    try {
      const objectJson = await AsyncStorage.getItem(key);

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
  async clearKey(key: LocalStorageKey) {
    try {
      await AsyncStorage.removeItem(key);

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, `Unable to clear key: ${key}`);
    }
  },
  async clearAll() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);

      return createLocalStorageSetSuccessResult();
    } catch (error) {
      return handleError(error, 'Unable to clear all storage');
    }
  },
  async getPrinterDefaultConfig(): Promise<PrinterConfig> {
    const getConfigRes = await this.getObject<PrinterConfig>(
      this.Keys.PrinterDefaultConfig,
    );

    return getConfigRes.success
      ? getConfigRes.data ?? PrinterDefaultConfigObject
      : PrinterDefaultConfigObject;
  },
};
