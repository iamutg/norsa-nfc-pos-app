import moment from 'moment';
import {print} from '~/native_modules/PosPrinter';
import {Client, DailyTransaction, TransactionType} from '~/types';
import {generateReceiptNumber} from '~/utils';
import {setPreviousPrintedReceipt} from './LocalStorageService';

export const printText: (
  textToBePrinted: string | null,
) => Promise<void> = async textToBePrinted => {
  console.log(textToBePrinted);
  await print(textToBePrinted);
};

export const printReceipt: (
  price: number,
  customer: Client,
  merchantName: string,
  paymentType: TransactionType,
  paybackPeriod: number,
) => Promise<void> = async (
  price,
  customer,
  merchantName,
  paymentType,
  paybackPeriod,
) => {
  const textToBePrinted =
    "[C]<u><font size='big'>Norsa N.V.</font></u>\n" +
    '[L]\n' +
    `[C]Receipt N.O: ${generateReceiptNumber()}\n` +
    `[C]${moment().format('DD/MM/YYYY hh:mm:ss A')}\n` +
    `[L]\n` +
    '[C]==============================\n' +
    '[L]\n' +
    `[L]${
      paymentType === TransactionType.expense ? 'Sale' : 'Retour'
    } Amount :[R]NAFL ${price.toFixed(2)}\n` +
    '[L]\n' +
    '[C]==============================\n' +
    '[L]\n' +
    "[L]<font size='tall'>Payback period (months):</font>\n" +
    `[L]${paybackPeriod}\n` +
    "[L]<font size='tall'>Merchant :</font>\n" +
    `[L]${merchantName}\n` +
    "[L]<font size='tall'>Customer :</font>\n" +
    `[L]${customer.name}\n` +
    `[L]${customer.code}\n` +
    `[L]\n` +
    `[L]\n` +
    "[L]<font size='tall'>Signature :</font>\n" +
    `[L]\n` +
    `[L]\n` +
    `[C]------------------------------\n` +
    `[L]\n` +
    `[L]Thank you for your purchase\n` +
    `[L]For questions or inquiries call customer service:\n` +
    '[L]+5999 767-1563';

  console.log(textToBePrinted);
  await setPreviousPrintedReceipt(textToBePrinted);

  await print(textToBePrinted);
};

export const printDailyReceipt: (
  dailyTransactions: Array<DailyTransaction>,
  merchantName: string,
) => Promise<void> = async (dailyTransactions, merchantName) => {
  const listOfExpenses = dailyTransactions
    .sort(
      (a, b) =>
        new Date(a?.dateTime).getTime() - new Date(b?.dateTime).getTime(),
    )
    .reduce((prev, curr) => {
      return (
        prev +
        `[L]${curr.Client_id}: [R]NAFL ${
          curr?.transactionType === TransactionType.retour ? '-' : ' '
        }${curr.AmountUser.toFixed(2)}\n` +
        `[L]Payback period (months): [R]     ${
          curr?.totalPaybackPeriods ?? 0
        }\n`
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

  const textToBePrinted =
    "[C]<u><font size='big'>Norsa N.V.</font></u>\n" +
    '[L]\n' +
    `[C]Receipt N.O: ${generateReceiptNumber()}\n` +
    `[C]${moment().format('DD/MM/YYYY hh:mm:ss A')}\n` +
    `[L]\n` +
    '[C]------------------------------\n' +
    `[L]\n` +
    `[C]<b>Daily sales</b>\n` +
    `[L]\n` +
    '[C]==============================\n' +
    '[L]\n' +
    listOfExpenses +
    '[L]\n' +
    '[C]==============================\n' +
    '[L]\n' +
    `[R]<b>Total :</b>[R]NAFL ${totalExpense}\n` +
    "[L]<font size='tall'>Merchant :</font>\n" +
    `[L]${merchantName}\n` +
    `[L]\n` +
    `[L]\n` +
    "[L]<font size='tall'>Signature :</font>\n" +
    `[L]\n` +
    `[L]\n` +
    `[C]------------------------------\n` +
    `[L]\n` +
    `[L]Thank you for your purchase\n` +
    `[L]For questions or inquiries call customer service:\n` +
    '[L]+5999 767-1563';

  console.log(textToBePrinted);

  await print(textToBePrinted);
};

export const printBalance: (
  client: Client,
  cardNumber: string,
  merchantName: string,
  balance: number,
  paybackPeriod: number,
) => Promise<void> = async (
  customer,
  cardNumber,
  merchantName,
  balance,
  paybackPeriod,
) => {
  const textToBePrinted =
    "[C]<u><font size='big'>Norsa N.V.</font></u>\n" +
    '[L]\n' +
    `[C]Receipt N.O: ${generateReceiptNumber()}\n` +
    `[C]${moment().format('DD/MM/YYYY hh:mm:ss A')}\n` +
    `[L]\n` +
    '[C]==============================\n' +
    '[L]\n' +
    `[L]Balance :[R]NAFL ${balance.toFixed(2)}\n` +
    `[L]Card Number :[R]     ${cardNumber}\n` +
    '[L]\n' +
    '[C]==============================\n' +
    '[L]\n' +
    "[L]<font size='tall'>Payback period (months):</font>\n" +
    `[L]${paybackPeriod}\n` +
    "[L]<font size='tall'>Merchant :</font>\n" +
    `[L]${merchantName}\n` +
    "[L]<font size='tall'>Customer :</font>\n" +
    `[L]${customer.name}\n` +
    `[L]${customer.code}\n` +
    `[L]\n` +
    `[L]\n` +
    "[L]<font size='tall'>Signature :</font>\n" +
    `[L]\n` +
    `[L]\n` +
    `[C]------------------------------\n` +
    `[L]\n` +
    `[L]Thank you for your purchase\n` +
    `[L]For questions or inquiries call customer service:\n` +
    '[L]+5999 767-1563';

  console.log(textToBePrinted);

  await print(textToBePrinted);
};
