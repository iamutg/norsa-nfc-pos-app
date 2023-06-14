import AsyncStorage from '@react-native-async-storage/async-storage';
import {asyncStorageKeys} from '../constants/index';
import {LoginData, PrinterConfig} from '~/types';
import {printerDefaultConfig} from '~/utils';

export const getPrinterDefaultConfig: () => Promise<PrinterConfig> =
  async () => {
    try {
      const configJson = await AsyncStorage.getItem(
        asyncStorageKeys.printerDefaultConfig,
      );

      if (configJson) {
        const config: PrinterConfig = JSON.parse(configJson);
        return config;
      } else {
        return printerDefaultConfig;
      }
    } catch (error) {
      console.log('Error getting config data from async storage', error);
      return printerDefaultConfig;
    }
  };

export const setPrinterDefaultConfig: (
  config: PrinterConfig,
) => Promise<void> = async config => {
  try {
    await AsyncStorage.setItem(
      asyncStorageKeys.printerDefaultConfig,
      JSON.stringify(config),
    );
  } catch (error) {
    console.log('Error setting config data', error);
  }
};

export const getLoginData: () => Promise<LoginData | null> = async () => {
  try {
    const loginDataJson = await AsyncStorage.getItem(
      asyncStorageKeys.loginData,
    );

    if (loginDataJson) {
      const loginData = JSON.parse(loginDataJson) as LoginData;
      return loginData;
    } else {
      return null;
    }
  } catch (error) {
    console.log('Error getting login data from async storage', error);
    return null;
  }
};

export const getAuthToken: () => Promise<string> = async () => {
  const loginData = await getLoginData();

  return loginData.accessToken ?? '';
};

export const setLoginData: (
  loginData: LoginData,
) => Promise<void> = async loginData => {
  try {
    await AsyncStorage.setItem(
      asyncStorageKeys.loginData,
      JSON.stringify(loginData),
    );
  } catch (error) {
    console.log('Error setting login data', error);
  }
};

export const setDailyReportPrintedDate: (
  date: string,
) => Promise<void> = async date => {
  try {
    await AsyncStorage.setItem(asyncStorageKeys.dailyReportPrintedDate, date);
  } catch (error) {
    console.log('Error setting daily report printed date', error);
  }
};

export const getDailyReportPrintedDate: () => Promise<
  string | null
> = async () => {
  try {
    const date = await AsyncStorage.getItem(
      asyncStorageKeys.dailyReportPrintedDate,
    );

    return date;
  } catch (error) {
    console.log('Error getting daily report printed date', error);

    return null;
  }
};

export const getPreviousPrintedReceipt: () => Promise<
  string | null
> = async () => {
  try {
    const previousPrintedReceipt = await AsyncStorage.getItem(
      asyncStorageKeys.previousPrintedReceipt,
    );

    return previousPrintedReceipt;
  } catch (error) {
    console.log('Error getting previous printed receipt', error);

    return null;
  }
};

export const setPreviousPrintedReceipt: (
  previousPrintedReceipt: string,
) => Promise<void> = async previousPrintedReceipt => {
  try {
    await AsyncStorage.setItem(
      asyncStorageKeys.previousPrintedReceipt,
      previousPrintedReceipt,
    );
  } catch (error) {
    console.log('Error setting previous printed receipt', error);
  }
};

export const clearLoginData: () => Promise<void> = async () => {
  try {
    await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
  } catch (error) {
    console.log('Error clearing login data', error);
  }
};
