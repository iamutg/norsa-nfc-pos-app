import moment from 'moment';
import React, {FC, useCallback, useState} from 'react';
import {Keyboard, StyleSheet, Text, TextInput, View} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {Button, Header} from '~/components';
import BottomModal from '~/components/BottomModal';
import {useAuthContext} from '~/context/AuthContext';
import {doCreateTrasactionHistory} from '~/core/ApiService';
import {printReceipt} from '~/core/ReceiptPrinter';
import {Colors} from '~/styles';
import {
  AddItemsScreeProps,
  Client,
  Transaction,
  TransactionType,
} from '~/types';
import {isValidAmount, showAlert, showToast} from '~/utils';

const merchantPinCodeModalText = 'Please Enter the Merchant Pin code';
const defaultPinCodeModalText = 'Please Enter the Pin Code to Verify Nfc Card';

export interface Props extends AddItemsScreeProps {}

const PrintExpense: FC<Props> = ({route, navigation}) => {
  const {loginData} = useAuthContext();

  const [expensePrice, setExpensePrice] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [hasPrintedForMerchant, setHasPrintedForMerchant] = useState(false);
  const [hasMerchantPincodeVerified, setHasMerchantPincodeVerified] =
    useState(false);
  const [hasPinCodeVerified, setHasPinCodeVerified] = useState(false);
  const [disableInput, setDisableInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfirmationModalShown, setIsConfirmationModalShown] =
    useState(false);

  const client: Client = route.params?.client;
  const maxAmount = route.params?.maxAmount;
  const issuanceHistoryId = route.params?.issuanceHistoryId;
  const pinCodeToVerify = route.params?.pinCode;
  const paybackPeriod = route.params?.paybackPeriod;
  const paymentType = route.params?.paymentType;

  const getModalText = useCallback(() => {
    if (paymentType === 'retour' && !hasMerchantPincodeVerified) {
      return merchantPinCodeModalText;
    } else {
      return defaultPinCodeModalText;
    }
  }, [hasMerchantPincodeVerified, paymentType]);

  const clearAllStates = useCallback(() => {
    setExpensePrice('');
    setHasPrintedForMerchant(false);
    setDisableInput(false);
    setLoading(false);
  }, []);

  const showConfirmationModal = useCallback(() => {
    setIsConfirmationModalShown(true);
  }, []);

  const hideConfirmationModal = useCallback(() => {
    setPinCode('');
    setIsConfirmationModalShown(false);
  }, []);

  const onExpensePriceTextChanged = useCallback<(text: string) => void>(
    text => {
      setExpensePrice(text);
    },
    [],
  );

  const printForMerchant = async (price: number) => {
    setDisableInput(true);
    setLoading(true);

    const transaction: Transaction = {
      Client_id: client.id,
      ItemDescription: paymentType === 'expense' ? 'Expense' : 'Retour',
      Merchant_ID: loginData?.id,
      issuancehistoryId: issuanceHistoryId,
      dateTime: moment().utc().toDate().toUTCString(),
      AmountUser: price,
      transactionType:
        paymentType === 'expense'
          ? TransactionType.expense
          : TransactionType.retour,
    };
    console.log('Transaction: ', transaction);
    const res = await doCreateTrasactionHistory(transaction);

    if (res.success) {
      await printReceipt(
        price,
        client,
        loginData?.name,
        paymentType === 'expense'
          ? TransactionType.expense
          : TransactionType.retour,
        paybackPeriod,
      );
      setHasPrintedForMerchant(true);
      setLoading(false);
    } else {
      setLoading(false);
      showToast(res.message);
      setDisableInput(false);
    }
  };

  const onSubmitButtonPressed = useCallback(async () => {
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
        hideConfirmationModal();

        setLoading(true);
        const price = parseFloat(expensePrice.trim());

        await printForMerchant(price);
      } else {
        showToast('Pin Code entered is incorrect');
      }
    }
  }, [pinCode, paymentType, hasMerchantPincodeVerified]);

  const onSaveAndPrintReceiptPressed = useCallback(async () => {
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

    try {
      if (!hasPinCodeVerified) {
        showConfirmationModal();
        return;
      }

      if (hasPrintedForMerchant) {
        setLoading(true);

        try {
          await printReceipt(
            price,
            client,
            loginData?.name,
            paymentType === 'expense'
              ? TransactionType.expense
              : TransactionType.retour,
            paybackPeriod,
          );
          const tId = setTimeout(() => {
            clearTimeout(tId);
            clearAllStates();
            navigation.goBack();
          }, 1000);
        } catch (error) {
          console.log('Error printing Receipt');

          showAlert('Error', error.message);
          setDisableInput(false);
        }
      } else {
        await printForMerchant(price);
      }
    } catch (error) {
      console.log('Error printing Receipt: ', error);
      showAlert('Error Printing', error?.message || 'Something went wrong');
    }
  }, [expensePrice, hasPrintedForMerchant, hasPinCodeVerified]);

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
              onChangeText={onExpensePriceTextChanged}
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
        visible={isConfirmationModalShown}
        onBackDropPressed={hideConfirmationModal}>
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
    </>
  );
};

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
});

export default PrintExpense;
