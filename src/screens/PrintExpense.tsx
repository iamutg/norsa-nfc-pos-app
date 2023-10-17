import React from 'react';
import {Keyboard, StyleSheet, Text, TextInput, View} from 'react-native';
import moment from 'moment';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {BalanceDialog, Button, Header} from '~/components';
import {BottomModal} from '~/components';
import {ApiService, Transaction, TransactionType} from '~/core/api';
import {useModalState} from '~/hooks';
import {Colors} from '~/styles';
import {isValidAmount, showAlert, showToast} from '~/utils';
import {AddItemsScreeProps} from '~/navigation';
import {IssuanceHistory} from '~/core/api';
import {selectLoginData, useGlobalStore} from '~/state';
import {Client} from '~/types';
import {ReceiptPrinter} from '~/core/ReceiptPrinter';

const merchantPinCodeModalText = 'Please Enter the Merchant Pin code';
const defaultPinCodeModalText = 'Please Enter the Pin Code to Verify Nfc Card';

export interface PrintExpenseProps extends AddItemsScreeProps {}

export function PrintExpense({route, navigation}: PrintExpenseProps) {
  const loginData = useGlobalStore(selectLoginData);

  const [expensePrice, setExpensePrice] = React.useState('');
  const [pinCode, setPinCode] = React.useState('');
  const [hasPrintedForMerchant, setHasPrintedForMerchant] =
    React.useState(false);
  const [hasMerchantPincodeVerified, setHasMerchantPincodeVerified] =
    React.useState(false);
  const [hasPinCodeVerified, setHasPinCodeVerified] = React.useState(false);
  const [disableInput, setDisableInput] = React.useState(false);
  const [selectedIssuanceHistory, setSelectedIssuanceHistory] = React.useState<
    IssuanceHistory | undefined
  >();
  const [balanceDialogShown, showBalanceDialog, hideBalanceDialog] =
    useModalState();

  const [loading, setLoading] = React.useState(false);
  const [confirmationModalShown, showConfirmationModal, hideConfirmationModal] =
    useModalState();

  const haveShownBalanceRef = React.useRef(false);

  const client: Client = route.params?.client;
  const maxAmount = route.params?.maxAmount;
  const issuanceHistoryId = route.params?.issuanceHistoryId;
  const pinCodeToVerify = route.params?.pinCode;
  const paybackPeriod = route.params?.paybackPeriod;
  const paymentType = route.params?.paymentType;
  const cardId = route.params?.cardId ?? '';

  const clearAllStates = () => {
    setExpensePrice('');
    setHasPrintedForMerchant(false);
    setDisableInput(false);
    setLoading(false);
  };

  const getModalText = () => {
    if (paymentType === 'retour' && !hasMerchantPincodeVerified) {
      return merchantPinCodeModalText;
    } else {
      return defaultPinCodeModalText;
    }
  };

  const printForMerchant = async (price: number) => {
    setDisableInput(true);
    setLoading(true);

    const transactionType =
      paymentType === 'expense'
        ? TransactionType.Expense
        : TransactionType.Retour;
    const transaction: Transaction = {
      Client_id: client.id,
      ItemDescription: paymentType === 'expense' ? 'Expense' : 'Retour',
      Merchant_ID: loginData?.id ?? '',
      issuancehistoryId: issuanceHistoryId,
      dateTime: moment().utc().toDate().toUTCString(),
      AmountUser: price,
      transactionType,
    };
    console.log('Transaction: ', transaction);

    const createTraxRes = await ApiService.doCreateTransaction(transaction);

    if (createTraxRes.success) {
      ReceiptPrinter.printReceipt({
        price,
        customer: client,
        merchantName: loginData?.name ?? '',
        paymentType: transactionType,
        paybackPeriod,
      });
      setHasPrintedForMerchant(true);
      setLoading(false);
    } else {
      setLoading(false);
      showToast(createTraxRes.message);
      setDisableInput(false);
    }
  };
  const printExpenseReceipt = async (price: number) => {
    if (!hasPinCodeVerified) {
      showConfirmationModal();
      return;
    }

    if (hasPrintedForMerchant) {
      setLoading(true);
      const printRes = await ReceiptPrinter.printReceipt({
        price,
        customer: client,
        merchantName: loginData?.name ?? '',
        paymentType:
          paymentType === 'expense'
            ? TransactionType.Expense
            : TransactionType.Retour,
        paybackPeriod,
      });

      if (printRes.success) {
        clearAllStates();
        navigation.goBack();
        return;
      }

      showAlert('Error', printRes.message);
      setDisableInput(false);
    } else {
      await printForMerchant(price);
    }
  };

  const showBalance = async () => {
    setLoading(true);
    const issuanceHistoriesRes = await ApiService.doGetMultipleIssuaceHistories(
      cardId,
    );
    setLoading(false);

    if (issuanceHistoriesRes.success) {
      const issuanceHistory = issuanceHistoriesRes.data?.find(
        issuanceHistory => issuanceHistory.paybackPeriod === paybackPeriod,
      );
      setSelectedIssuanceHistory(issuanceHistory);
      showBalanceDialog();
    } else {
      showToast(
        `Unable to get payback periods: ${issuanceHistoriesRes.message}`,
      );
    }
  };

  const onHideConfirmationModal = () => {
    setPinCode('');
    hideConfirmationModal();
  };
  const onSubmitButtonPressed = async () => {
    if (paymentType === 'retour' && !hasMerchantPincodeVerified) {
      if (pinCode === loginData?.pinCode) {
        setHasMerchantPincodeVerified(true);
        setPinCode('');
      } else {
        showToast('Pin Code entered is incorrect');
      }
    } else {
      if (pinCode === pinCodeToVerify) {
        setHasPinCodeVerified(true);
        onHideConfirmationModal();

        setLoading(true);
        const price = parseFloat(expensePrice.trim());

        await printForMerchant(price);
      } else {
        showToast('Pin Code entered is incorrect');
      }
    }
  };
  const onPrintExpenseReceipt = (price: number) => {
    if (haveShownBalanceRef.current) {
      printExpenseReceipt(price);
    } else {
      showBalance();
    }
  };
  const onSaveAndPrintReceiptPressed = () => {
    Keyboard.dismiss();

    const _expensePrice = expensePrice.trim();

    if (_expensePrice === '') {
      showAlert('Empty Expense Amount', 'Expense Amount cannot be empty');
      return;
    }

    if (!isValidAmount(_expensePrice) || parseFloat(_expensePrice) === 0) {
      showAlert(
        'Invalid Amount',
        'Expense Amount entered is invalid. Only numbers greater than 0 and upto 2 decimal places are allowed',
      );
      return;
    }

    const price = parseFloat(_expensePrice);

    if (price <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (price > maxAmount) {
      showAlert(
        'Limit Reached',
        'The amount entered exceeds the maximum amount',
      );
      return;
    }

    onPrintExpenseReceipt(price);
  };
  const onContinueTransactionPressed = () => {
    haveShownBalanceRef.current = true;
    printExpenseReceipt(parseFloat(expensePrice.trim()));
  };

  return (
    <>
      <View style={styles.f1}>
        <Header title="Add Items" hasBackButton />
        <View style={[styles.f1, styles.container]}>
          <View>
            <View style={[styles.clientInfoWrapper, styles.clientInfoDivider]}>
              <View style={styles.clientInfoLeftColumn}>
                <Text style={styles.clientInfoLabelText}>Name</Text>
              </View>
              <View style={styles.clientInfoRightColumn}>
                <Text style={styles.clientInfoValueText}>{client.name}</Text>
              </View>
            </View>
            <View style={[styles.clientInfoWrapper, styles.clientInfoDivider]}>
              <View style={styles.clientInfoLeftColumn}>
                <Text style={styles.clientInfoLabelText}>Code</Text>
              </View>
              <View style={styles.clientInfoRightColumn}>
                <Text style={styles.clientInfoValueText}>{client.code}</Text>
              </View>
            </View>
            <View style={[styles.clientInfoWrapper, styles.clientInfoDivider]}>
              <View style={styles.clientInfoLeftColumn}>
                <Text style={styles.clientInfoLabelText}>Payback Period</Text>
              </View>
              <View style={styles.clientInfoRightColumn}>
                <Text style={styles.clientInfoValueText}>
                  {paybackPeriod} (month(s))
                </Text>
              </View>
            </View>
            <TextInput
              editable={!disableInput}
              style={styles.input}
              value={expensePrice}
              placeholder="Amount"
              returnKeyType="done"
              keyboardType="numeric"
              onChangeText={setExpensePrice}
            />
          </View>

          <Button
            title={
              !hasPrintedForMerchant
                ? 'Save and Print Receipt'
                : 'Print for Client'
            }
            style={styles.saveBtn}
            loading={loading}
            onPress={onSaveAndPrintReceiptPressed}
          />
        </View>
      </View>
      <BottomModal
        visible={confirmationModalShown}
        onBackDropPressed={onHideConfirmationModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>{getModalText()}</Text>
          <TextInput
            style={[styles.input, styles.modalInput]}
            value={pinCode}
            secureTextEntry
            placeholder="Pin Code"
            onChangeText={setPinCode}
            keyboardType="numeric"
          />
          <Button
            style={styles.modalButton}
            title="Submit"
            onPress={onSubmitButtonPressed}
          />
        </View>
      </BottomModal>
      <BalanceDialog
        visible={balanceDialogShown}
        negativeButtonText="NO"
        negativeButtonColor={Colors.red}
        posititveButtonText="YES"
        closeDialog={hideBalanceDialog}
        description={
          <Text>
            Current balance is{' '}
            <Text style={styles.balanceText}>
              NAFL
              {parseFloat(selectedIssuanceHistory?.Balance ?? '0').toFixed(2)}
            </Text>
            . Do you wish to continue the transaction?
          </Text>
        }
        onPositiveButtonPress={onContinueTransactionPressed}
      />
    </>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    alignSelf: 'center',
    justifyContent: 'space-between',
    width: '95%',
    paddingBottom: responsiveHeight(3),
    alignItems: 'center',
  },
  listContainer: {
    width: '100%',
  },
  clientInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  clientInfoDivider: {
    borderBottomColor: Colors.border,
    borderBottomWidth: responsiveWidth(0.3),
    paddingVertical: responsiveHeight(1),
  },
  clientInfoLeftColumn: {
    width: '30%',
  },
  clientInfoRightColumn: {
    width: '70%',
  },
  clientInfoLabelText: {
    color: Colors.black,
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
  },
  clientInfoValueText: {
    color: Colors.gray,
    fontSize: responsiveFontSize(2.5),
  },
  input: {
    borderWidth: responsiveWidth(0.3),
    borderColor: Colors.border,
    borderRadius: responsiveWidth(50) / 20,
    marginTop: responsiveHeight(2),
    padding: responsiveFontSize(1.5),
  },
  totalPriceWrapper: {
    paddingVertical: responsiveHeight(1),
  },
  addItemBtn: {
    alignSelf: 'center',
    width: '80%',
    marginTop: responsiveHeight(2),
  },
  saveBtn: {
    width: '80%',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(2),
    elevation: 1,
    backgroundColor: Colors.white,
    borderRadius: responsiveWidth(50) / 40,
  },
  itemRow: {},
  itemLabelText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: responsiveFontSize(1.8),
  },
  itemValueText: {
    color: Colors.gray,
    fontSize: responsiveFontSize(1.8),
    flexWrap: 'wrap',
  },
  deleteItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    paddingVertical: responsiveFontSize(2),
    alignSelf: 'center',
    width: '90%',
  },
  modalText: {
    color: Colors.black,
    textAlign: 'center',
    fontSize: responsiveFontSize(2.5),
  },
  modalInput: {
    marginVertical: responsiveHeight(2),
  },
  modalButton: {
    width: '60%',
    alignSelf: 'center',
  },
  balanceText: {
    fontWeight: 'bold',
    color: Colors.red,
  },
});
