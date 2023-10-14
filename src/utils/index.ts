import moment from 'moment';
import {Alert, ToastAndroid} from 'react-native';
import {PrintBalanceInfo, PrinterConfig} from '~/types';

const floatNumberRegex = /^(\d+(\.\d+)?)$|^(.?\d+)$/;
const twoDecimalPlaceRegex = /^[0-9]*.?[0-9]{1,2}$/;
const intNumberRegex = /^[0-9]+$/;
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export const noop = () => {};

export function isError(error: unknown): error is Error & {message?: string} {
  return error instanceof Error;
}

export const showToast: (message: string, duration?: number) => void = (
  message,
  duration = ToastAndroid.SHORT,
) => {
  ToastAndroid.show(message, duration);
};

export const flatListKeyExtractor: (item: any, index: number) => string = (
  _,
  idx,
) => `${idx}-${Math.random()}`;

export const isValidFloatNumber: (value: string) => boolean = value =>
  floatNumberRegex.test(value);

export const isValidAmount: (value: string) => boolean = value =>
  twoDecimalPlaceRegex.test(value);

export const isValidIntNumber: (value: string) => boolean = value =>
  intNumberRegex.test(value);

export const isEmailValid: (email: string) => boolean = email =>
  emailRegex.test(email);

export const showAlert: (title: string, message: string) => void = (
  title,
  message,
) => {
  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: noop,
    },
  ]);
};

export const showPrintDailyReportAlert = () => {
  showAlert('Print Daily Report', 'Please print daily report first');
};

export const showPrintBalanceAlert: (
  printBalanceInfo: PrintBalanceInfo,
  onPrintPress: () => void,
) => void = ({balance, cardNumber, customerName}, onPrintPress) => {
  Alert.alert(
    'Balance',
    `${customerName} Your balance for card number ${cardNumber} is : NAFL ${balance.toFixed(
      2,
    )}`,
    [
      {
        text: 'Print',
        onPress: onPrintPress,
      },
      {
        text: 'OK',
        onPress: noop,
      },
    ],
  );
};

export const showAlertWithTwoButtons: (
  title: string,
  message: string,
  firstButtonText: string,
  secondButtonText: string,
  onFirstButtonPressed: () => void,
  secondButtonPressed: () => void,
) => void = (
  title,
  message,
  firstButtonText,
  secondButtonText,
  onFirstButtonPressed,
  onSecondButtonPressed,
) => {
  Alert.alert(title, message, [
    {text: firstButtonText, onPress: onFirstButtonPressed},
    {text: secondButtonText, onPress: onSecondButtonPressed},
  ]);
};

export const getCurrentUtcTimestamp = () => moment.utc().toISOString();

export const getLocalTimestamp = (utcTimestamp: string) =>
  moment
    .utc(utcTimestamp)
    .utcOffset(moment().utcOffset())
    .format('YYYY-MM-DDTHH:mm:ssZ');

export const generateReceiptNumber = () => moment().format('DDMMYYYYHHmmss');
