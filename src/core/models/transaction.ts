export enum TransactionType {
  Expense = 1,
  Retour = 2,
}

export type Transaction = {
  Client_id: string;
  Merchant_ID: string;
  issuancehistoryId: string;
  ItemDescription: 'Expense' | 'Retour';
  dateTime: string;
  AmountUser: number;
  transactionType: TransactionType;
};

export type DailyTransaction = {
  id?: string;
  Client_id?: string;
  Merchant_ID?: string;
  ItemDescription?: string;
  dateTime?: string;
  AmountUser?: number;
  issuancehistoryId?: string;
  transactionType?: number;
  totalPaybackPeriods?: number;
};
