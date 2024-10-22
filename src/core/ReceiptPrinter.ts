import moment from 'moment';
import {
  BluetoothEscposPrinter,
  ALIGN,
  PrintTextOptions,
} from 'tp-react-native-bluetooth-printer';
import {Client, DailyTransaction, TransactionType} from '~/types';
import {generateReceiptNumber} from '~/utils';
import {setPreviousPrintedReceipt} from './LocalStorageService';
import {CustomerServiceContactNumber} from '~/constants';
import {checkPrinterConnected} from '~/features/BluetoothThermalPrinter';
import {Alert} from 'react-native';

export const printText = async (
  textToBePrinted: string | null,
  options?: PrintTextOptions,
) => {
  try {
    await BluetoothEscposPrinter.printText(
      textToBePrinted,
      options ?? {
        encoding: 'GBK',
      },
    );
  } catch (error) {
    console.error('Printing Error: ', error);
  }
};

export const printReceipt = async (
  price: number,
  customer: Client,
  merchantName: string,
  paymentType: TransactionType,
  paybackPeriod: number,
) => {
  checkPrinterConnected().then(async isConnected => {
    if (isConnected) {
      try {
        await BluetoothEscposPrinter.printerInit();
        await BluetoothEscposPrinter.printerLeftSpace(0);
        await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);

        const receiptNumber = generateReceiptNumber();
        const dateTime = moment().format('DD/MM/YYYY hh:mm:ss A');

        // Print receipt line by line
        await BluetoothEscposPrinter.setBold(1);
        await printText('Merpol\n', {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 3,
          heigthtimes: 3,
          fonttype: 1,
        });
        await BluetoothEscposPrinter.setBold(0);
        await printText('Receipt N.O: ' + receiptNumber + '\n');
        await printText(dateTime + '\n');
        await printText('==============================\n');
        await printText(
          paymentType === TransactionType.expense
            ? 'Sale Amount: '
            : 'Retour Amount: ',
        );
        await printText('NAFL ' + price.toFixed(2) + '\n');
        await printText('==============================\n');
        await printText('Payback period (months): ' + paybackPeriod + '\n');
        await printText('Merchant: ' + merchantName + '\n');
        await printText('Customer: ' + customer.name + '\n');
        await printText(customer.code + '\n\n');
        await printText('Signature:\n\n\n');
        await printText('Thank you for your purchase\n');
        await printText('For questions or inquiries call customer service:\n');
        await printText(CustomerServiceContactNumber + '\n');

        console.log('Receipt printed successfully');
        await setPreviousPrintedReceipt(receiptNumber);
      } catch (error) {
        console.log('Printing Error: ', error);
        Alert.alert('Error', error.message ?? 'Failed to print');
      }
    }
  });
};

export const printDailyReceipt = async (
  dailyTransactions: Array<DailyTransaction>,
  merchantName: string,
) => {
  checkPrinterConnected().then(async isConnected => {
    if (isConnected) {
      try {
        await BluetoothEscposPrinter.printerInit();
        await BluetoothEscposPrinter.printerLeftSpace(0);
        await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);

        const listOfExpenses = dailyTransactions
          .sort(
            (a, b) =>
              new Date(a?.dateTime).getTime() - new Date(b?.dateTime).getTime(),
          )
          .reduce((prev, curr) => {
            return (
              prev +
              curr.Client_id +
              ': ' +
              'NAFL ' +
              (curr.transactionType === TransactionType.retour ? '-' : ' ') +
              curr.AmountUser.toFixed(2) +
              '\n' +
              'Payback period (months): ' +
              (curr?.totalPaybackPeriods ?? 0) +
              '\n'
            );
          }, '');

        const totalExpense = dailyTransactions
          .map(trx => trx?.AmountUser)
          .reduce(
            (prev, curr, idx) =>
              dailyTransactions[idx].transactionType === TransactionType.expense
                ? prev + curr
                : prev - curr,
            0,
          )
          .toFixed(2);

        const receiptNumber = generateReceiptNumber();
        const dateTime = moment().format('DD/MM/YYYY hh:mm:ss A');

        // Print daily receipt line by line
        await BluetoothEscposPrinter.setBold(1);
        await printText('Merpol\n', {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 3,
          heigthtimes: 3,
          fonttype: 1,
        });
        await BluetoothEscposPrinter.setBold(0);
        await printText('Receipt N.O: ' + receiptNumber + '\n');
        await printText(dateTime + '\n');
        await printText('------------------------------\n');
        await printText('Daily sales\n');
        await printText('==============================\n');
        await printText(listOfExpenses);
        await printText('==============================\n');
        await printText('Total: NAFL ' + totalExpense + '\n\n');
        await printText('Merchant: ' + merchantName + '\n\n');
        await printText('Signature:\n\n\n');
        await printText('Thank you for your purchase\n');
        await printText('For questions or inquiries call customer service:\n');
        await printText(CustomerServiceContactNumber + '\n');

        console.log('Daily receipt printed successfully');
      } catch (error) {
        console.log('Printing Error: ', error);
        Alert.alert('Error', error.message ?? 'Failed to print');
      }
    }
  });
};

export const printBalance = async (
  customer: Client,
  cardNumber: string,
  merchantName: string,
  balance: number,
  paybackPeriod: number,
) => {
  checkPrinterConnected().then(async isConnected => {
    if (isConnected) {
      try {
        await BluetoothEscposPrinter.printerInit();
        await BluetoothEscposPrinter.printerLeftSpace(0);
        await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
        const receiptNumber = generateReceiptNumber();
        const dateTime = moment().format('DD/MM/YYYY hh:mm:ss A');
        // Print balance receipt line by line
        await BluetoothEscposPrinter.setBold(1);
        await printText('Merpol\n');
        await BluetoothEscposPrinter.setBold(0);
        await printText('Receipt N.O: ' + receiptNumber + '\n');
        await printText(dateTime + '\n');
        await printText('==============================\n');
        await printText('Balance: NAFL ' + balance.toFixed(2) + '\n');
        await printText('Card Number: ' + cardNumber + '\n');
        await printText('==============================\n');
        await printText('Payback period (months): ' + paybackPeriod + '\n');
        await printText('Merchant: ' + merchantName + '\n');
        await printText('Customer: ' + customer.name + '\n');
        await printText(customer.code + '\n\n');
        await printText('Signature:\n\n\n');
        await printText('Thank you for your purchase\n');
        await printText('For questions or inquiries call customer service:\n');
        await printText(CustomerServiceContactNumber + '\n');

        console.log('Balance printed successfully');
      } catch (error) {
        console.log('Printing Error: ', error);
        Alert.alert('Error', error.message ?? 'Failed to print');
      }
    }
  });
};
