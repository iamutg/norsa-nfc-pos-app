export interface SuccessResult<D> {
  success: true;
  failure: false;
  data?: D;
}

export interface FailureResult<C, E> {
  success: false;
  failure: true;
  message: string;
  code: C;
  cause?: E | unknown;
}

export type Result<D, C, E> = SuccessResult<D> | FailureResult<C, E>;

export type Nullable<T> = T | null;

export type PickerItem = {
  title: string;
  value: string;
};

export interface EmptyProps {}

export type NfcTagOperationStatus = 'scanning' | 'error' | 'success' | 'none';

export type NfcTagScanningReason = 'expense' | 'balance' | 'retour';

export type AppMode = 'expense-retour' | 'expense' | 'retour';

export type Client = {
  id: string;
  code: string;
  name: string;
};
