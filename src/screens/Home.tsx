import {Picker} from '@react-native-picker/picker';
import moment from 'moment';
import React, {FC, useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Dialog from 'react-native-dialog';
import {logo} from '~/assets/images';
import {
  Button,
  Header,
  Icons,
  Loader,
  ScreenContainer,
  BottomModal,
} from '~/components';
import {appModes} from '~/constants';
import {useAuthContext} from '~/context/AuthContext';
import {
  doGetDailyTransactions,
  doGetMultipleIssuanceHistories,
} from '~/core/ApiService';
import {
  getDailyReportPrintedDate,
  getPreviousPrintedReceipt,
  setDailyReportPrintedDate,
} from '~/core/LocalStorageService';
import {
  checkIfNfcEnabled,
  cleanUpReadingListners,
  initNfcManager,
  readNfcTag,
} from '~/core/NfcReaderWriter';
import {printBalance, printDailyReceipt} from '~/core/ReceiptPrinter';
import {useModalState} from '~/hooks';
import {routeNames} from '~/navigation/routeNames';
import {Colors} from '~/styles';
import {
  HomeScreenNavProp,
  IssuanceHistory,
  NfcTagOperationStatus,
  NfcTagScanningReason,
  PickerItem,
} from '~/types';
import {
  getCurrentUtcTimestamp,
  getLocalTimestamp,
  showPrintBalanceAlert,
  showToast,
} from '~/utils';
import {printText} from './../core/ReceiptPrinter';

const testCardNumber = '0002';
console.log('Test Card Number: ', testCardNumber);

export interface Props {
  navigation: HomeScreenNavProp;
}

const Home: FC<Props> = ({navigation: {navigate}}) => {
  const {loginData} = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [dailyReceiptPrintLoading, setDailyReceiptPrintLoading] =
    useState(false);
  const [printPreviousReceiptLoading, setPrintPreviousReceiptLoading] =
    useState(false);
  const [bottomModalShown, setBottomModalShown] = useState(false);
  const [selectPaybackPeriodModalShown, setSelectPaybackPeriodModalShown] =
    useState(false);
  const [isRetourDialogShown, openRetourDialog, closeRetourDialog] =
    useModalState();
  const [paybackPeriods, setPaybackPeriods] = useState<Array<PickerItem>>([]);
  const [selectedPaybackPeriod, setSelectedPaybackPeriod] = useState('');
  const [scanningStatus, setScanningStatus] =
    useState<NfcTagOperationStatus>('scanning');
  const [nfcTagScanningReason, setNfcTagScanningReason] =
    useState<NfcTagScanningReason>('expense');
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loaderLoading, setLoaderLoading] = useState(false);

  const issuanceHistoriesRef = useRef<Array<IssuanceHistory> | null>(null);

  useEffect(() => {
    initNfcManager().catch(error =>
      console.log('Error initializing nfc manager', error),
    );
    shouldPrintDailyReceipt();
  }, []);

  useEffect(() => {
    if (scanningStatus === 'success') {
      onReadNfcTagSuccess();
    }
  }, [scanningStatus]);

  const shouldPrintDailyReceipt = async () => {
    const _printDate = await getDailyReportPrintedDate();
    console.log('Daily report printDate: ', _printDate);

    if (_printDate) {
      const printDate = moment(_printDate);
      const currentDate = moment();
      const time = moment('00:00:00', 'HH:mm:ss');

      if (
        currentDate.isAfter(printDate, 'day') &&
        currentDate.isSameOrAfter(time, 'second')
      ) {
        await printDailyReport();
      }
    }
  };

  const readTag = useCallback(async () => {
    try {
      setScanningStatus('scanning');
      const scanningResult = await readNfcTag();
      console.log('Nfc Tag Result', scanningResult);

      if (scanningResult.success) {
        console.log('cardNumber', scanningResult.text);
        setCardNumber(scanningResult.text);
        setScanningStatus('success');
      } else {
        setError(scanningResult.error);
        setScanningStatus('error');
      }
    } catch (error) {
      console.log('Error Reading Nfc', error);
    }
  }, []);

  const onReadNfcTagSuccess = useCallback(async () => {
    clearAllStates();
    setLoaderLoading(true);

    const issuanceHistoriesRes = await doGetMultipleIssuanceHistories(
      cardNumber,
    );
    console.log('Issucance Histories: ', issuanceHistoriesRes?.data);

    setLoaderLoading(false);

    if (issuanceHistoriesRes.message) {
      showToast(issuanceHistoriesRes?.message);
    } else if (issuanceHistoriesRes?.data?.length === 0) {
      showToast(
        'This person has not applied to perform payments, Please contact your dealer',
      );
    } else {
      const paybackPickerItems: Array<PickerItem> =
        issuanceHistoriesRes?.data?.map(issuanceHistory => ({
          title: `${issuanceHistory.paybackPeriod} month${
            issuanceHistory?.paybackPeriod > 1 ? 's' : ''
          }`,
          value: `${issuanceHistory?.paybackPeriod}`,
        }));

      const smallestPaybackPeriod = `${
        issuanceHistoriesRes?.data
          ?.map?.(item => item.paybackPeriod)
          ?.sort?.((a, b) => a - b)?.[0]
      }`;

      issuanceHistoriesRef.current = issuanceHistoriesRes?.data;
      setSelectedPaybackPeriod(smallestPaybackPeriod);
      setPaybackPeriods(paybackPickerItems);
      showSelectPaybackPeriodModal();
    }
  }, [cardNumber]);

  const showBottomModal = useCallback(async () => {
    try {
      setLoading(true);
      const isEnabled = await checkIfNfcEnabled();
      setLoading(false);
      if (isEnabled) {
        setBottomModalShown(true);
        readTag();
      } else {
        Alert.alert(
          'NFC Disabled',
          'Nfc is disabled. Please enable Nfc and try again',
        );
      }
    } catch (error) {
      console.log('Error checking nfc status', error);
    }
  }, []);

  const showSelectPaybackPeriodModal = useCallback(() => {
    setSelectPaybackPeriodModalShown(true);
  }, []);

  const hideSelectPaybackPeriodModal = useCallback(() => {
    setSelectedPaybackPeriod('');
    setSelectPaybackPeriodModalShown(false);
  }, []);

  const clearAllStates = () => {
    setLoading(false);
    setDailyReceiptPrintLoading(false);
    setBottomModalShown(false);
    setSelectPaybackPeriodModalShown(false);
    setScanningStatus('scanning');
    setError('');
    setLoaderLoading(false);
  };

  const hideBottomModal = useCallback(() => {
    cleanUpReadingListners();
    setBottomModalShown(false);
  }, []);

  const onScanNfcPressed = useCallback(async () => {
    setNfcTagScanningReason('expense');
    setCardNumber(testCardNumber);
    setScanningStatus('success');
    // showBottomModal();
  }, []);

  const onScanNfcForRetourPressed = useCallback(async () => {
    setNfcTagScanningReason('retour');
    setCardNumber(testCardNumber);
    setScanningStatus('success');
    // showBottomModal();
  }, []);

  const onPrintPreviousPrintedReceipt = useCallback(async () => {
    setPrintPreviousReceiptLoading(true);

    try {
      const previousReceipt = await getPreviousPrintedReceipt();

      if (previousReceipt !== null) {
        await printText(previousReceipt);
      } else {
        showToast('There is no previous receipt');
      }
    } catch (error) {
      console.log('Error printing previous printed receipt');
      showToast(error.message);
    }

    setPrintPreviousReceiptLoading(false);
  }, []);

  const onScanNfcForBalance = useCallback(async () => {
    setCardNumber(testCardNumber);
    setNfcTagScanningReason('balance');
    setScanningStatus('success');
    // showBottomModal();
  }, []);

  const printDailyReport = useCallback(async () => {
    setDailyReceiptPrintLoading(true);

    const apiResponse = await doGetDailyTransactions();

    if (apiResponse.data) {
      const currentTimestamp = getLocalTimestamp(getCurrentUtcTimestamp());

      if (apiResponse.data.length === 0) {
        showToast('There are no transactions to be printed');
        setDailyReceiptPrintLoading(false);
        setDailyReportPrintedDate(currentTimestamp.toString());
        return;
      }

      try {
        await printDailyReceipt(apiResponse.data, loginData?.name);
        setDailyReportPrintedDate(currentTimestamp.toString());
      } catch (error) {
        console.log('Error printing daily Receipt');
        showToast(error.message);
      }
    } else {
      showToast(apiResponse.message);
    }

    setDailyReceiptPrintLoading(false);
  }, []);

  const onPrintDailyReceiptPressed = useCallback(async () => {
    await printDailyReport();
  }, []);

  const onPaybackPeriodSelected = useCallback(
    (itemValue: string, indexIndex: number) => {
      setSelectedPaybackPeriod(itemValue);
    },
    [],
  );

  const onContinuePressed = useCallback(() => {
    closeRetourDialog();
    onScanNfcForRetourPressed();
  }, []);

  const gotoExpenseScreen = useCallback(
    (issuanceHistory: IssuanceHistory) => {
      navigate(routeNames.PrintExpense, {
        client: {
          id: issuanceHistory?.Client_id,
          code: issuanceHistory?.clientCode,
          name: issuanceHistory?.clientName,
        },
        paybackPeriod: issuanceHistory?.paybackPeriod,
        maxAmount: parseFloat(
          nfcTagScanningReason === 'expense'
            ? issuanceHistory?.Balance
            : issuanceHistory?.Amount,
        ),
        cardId: cardNumber,
        pinCode: issuanceHistory?.Pincode,
        issuanceHistoryId: issuanceHistory?.id,
        paymentType: nfcTagScanningReason,
      });
    },
    [cardNumber, nfcTagScanningReason, navigate],
  );

  const onSelectPaybackPeriodNextButtonPressed = useCallback(() => {
    if (selectedPaybackPeriod && selectedPaybackPeriod !== 'none') {
      const paybackPeriodIndex = issuanceHistoriesRef.current?.findIndex(
        issuanceHistory =>
          `${issuanceHistory.paybackPeriod}` === selectedPaybackPeriod,
      );
      const issuanceHistory = issuanceHistoriesRef.current[paybackPeriodIndex];
      hideSelectPaybackPeriodModal();

      if (nfcTagScanningReason === 'balance') {
        const balance = parseFloat(issuanceHistory?.Balance);

        showPrintBalanceAlert(
          {balance, cardNumber, customerName: issuanceHistory?.clientName},
          async () => {
            try {
              await printBalance(
                {
                  id: issuanceHistory?.Client_id,
                  code: issuanceHistory?.clientCode,
                  name: issuanceHistory?.clientName,
                },
                cardNumber,
                loginData?.name,
                balance,
                issuanceHistory?.paybackPeriod ?? 0,
              );
            } catch (error) {
              console.log('Error printing Balance');

              showToast(error.message);
            }
          },
        );
      } else {
        gotoExpenseScreen(issuanceHistory);
      }
    } else {
      showToast('Please select payback period');
    }
  }, [selectedPaybackPeriod, nfcTagScanningReason, cardNumber]);

  const onTryAgainPressed = useCallback(() => {
    readTag();
  }, []);

  const renderNfcScanning = useCallback(() => {
    return (
      <View style={styles.nfcContentContainer}>
        <ActivityIndicator animating color={Colors.primary} size="large" />
        <Text style={styles.scanningNfcText}>Scanning Nearby NFC card</Text>
      </View>
    );
  }, []);

  const renderTryAgain = useCallback(() => {
    return (
      <View style={styles.nfcContentContainer}>
        <Text style={styles.tryAgainText}>{error}</Text>
        <Button title="Try Again" onPress={onTryAgainPressed} />
      </View>
    );
  }, [error]);

  const renderModalContent = useCallback(() => {
    if (scanningStatus === 'scanning') {
      return renderNfcScanning();
    } else {
      return renderTryAgain();
    }
  }, [scanningStatus]);

  const renderButtons = useCallback(() => {
    if (appModes === 'expense-retour') {
      return (
        <>
          <Button
            title="Expense"
            style={styles.scanNfcBtn}
            loading={loading}
            onPress={onScanNfcPressed}
          />
          <Button
            title="Retour"
            style={styles.scanNfcBtn}
            onPress={openRetourDialog}
          />
        </>
      );
    } else if (appModes === 'expense') {
      return (
        <>
          <Button
            title="Expense"
            style={styles.scanNfcBtn}
            loading={loading}
            onPress={onScanNfcPressed}
          />
        </>
      );
    } else {
      return (
        <>
          <Button
            title="Retour"
            style={styles.scanNfcBtn}
            onPress={onScanNfcForRetourPressed}
          />
        </>
      );
    }
  }, []);

  const renderPaybackPeriodItems = useCallback(
    () =>
      paybackPeriods.map((paybackPeriod, index) => (
        <Picker.Item
          key={index}
          label={paybackPeriod.title}
          value={paybackPeriod.value}
          color={Colors.black}
        />
      )),
    [paybackPeriods],
  );

  return (
    <ScreenContainer>
      <Header title="Home" hasLogoutButton hasSettingsButton />
      <View style={styles.f1}>
        <View style={styles.contentContainer}>
          <Image source={logo} style={styles.logo} />
          {renderButtons()}
          <Button
            loading={printPreviousReceiptLoading}
            title="Print Previous Receipt"
            style={styles.scanNfcBtn}
            onPress={onPrintPreviousPrintedReceipt}
          />
          <Button
            title="Show Balance"
            style={styles.scanNfcBtn}
            onPress={onScanNfcForBalance}
          />
          <Button
            loading={dailyReceiptPrintLoading}
            title="Print Daily Receipt"
            style={styles.scanNfcBtn}
            onPress={onPrintDailyReceiptPressed}
          />
        </View>
      </View>
      <BottomModal visible={bottomModalShown}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeBottomModalBtn}
            onPress={hideBottomModal}>
            <Icons.MaterialIcons
              name="close"
              color={Colors.black}
              size={responsiveFontSize(4)}
            />
          </TouchableOpacity>
          {renderModalContent()}
        </View>
      </BottomModal>
      <BottomModal visible={selectPaybackPeriodModalShown}>
        <View
          style={[
            styles.modalContainer,
            styles.selectPaybackPeriodModalContainer,
          ]}>
          <TouchableOpacity
            style={styles.closeBottomModalBtn}
            onPress={hideSelectPaybackPeriodModal}>
            <Icons.MaterialIcons
              name="close"
              color={Colors.black}
              size={responsiveFontSize(4)}
            />
          </TouchableOpacity>
          <Text style={styles.selectPaybackPeriodLabelText}>
            Please select a payback period
          </Text>
          <Picker
            style={styles.paybackPeriodPicker}
            mode="dropdown"
            selectedValue={selectedPaybackPeriod}
            onValueChange={onPaybackPeriodSelected}>
            <Picker.Item
              label="Select Payback Period"
              value="none"
              color={Colors.gray}
            />
            {renderPaybackPeriodItems()}
          </Picker>
          <Button
            title="Next"
            style={styles.selectPaybackPeriodModalNextBtn}
            onPress={onSelectPaybackPeriodNextButtonPressed}
          />
        </View>
      </BottomModal>
      <Loader visible={loaderLoading} />
      <Dialog.Container visible={isRetourDialogShown}>
        <Dialog.Title>
          <Text style={styles.retourDialogTitleText}>Retour</Text>
        </Dialog.Title>
        <Dialog.Description style={{color: 'red'}}>
          This is meant for refund only,do not use for normal transactions.
        </Dialog.Description>
        <Dialog.Button
          label="Cancel"
          color={Colors.red}
          onPress={closeRetourDialog}
        />
        <Dialog.Button label="Continue" onPress={onContinuePressed} />
      </Dialog.Container>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  contentContainer: {
    alignSelf: 'center',
    marginTop: responsiveHeight(5),
    alignItems: 'center',
    width: '80%',
  },
  nfcIconWrapper: {
    borderWidth: responsiveWidth(0.3),
    borderColor: Colors.primary,
    borderRadius: responsiveWidth(50) / 20,
    padding: responsiveWidth(2),
  },
  logo: {
    height: responsiveWidth(40),
    width: responsiveWidth(40),
  },
  scanNfcBtn: {
    marginTop: responsiveHeight(4),
    width: '80%',
  },
  modalContainer: {
    alignSelf: 'center',
    width: '90%',
    paddingVertical: responsiveHeight(2),
  },
  selectPaybackPeriodModalContainer: {
    alignItems: 'center',
  },
  closeBottomModalBtn: {
    alignSelf: 'flex-end',
  },
  nfcContentContainer: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(2),
  },
  scanningNfcText: {
    color: Colors.black,
    marginVertical: responsiveHeight(2),
    fontSize: responsiveFontSize(2.5),
  },
  tryAgainText: {
    color: Colors.black,
    marginBottom: responsiveHeight(3),
    textAlign: 'center',
    fontSize: responsiveFontSize(2.5),
  },
  userIdText: {
    color: Colors.black,
    fontSize: responsiveFontSize(2.5),
  },
  input: {
    borderWidth: responsiveWidth(0.3),
    borderColor: Colors.border,
    width: '100%',
    borderRadius: responsiveWidth(50) / 8,
    padding: responsiveFontSize(1.5),
  },
  inputUserIdText: {
    color: Colors.black,
    marginVertical: responsiveHeight(2),
    fontSize: responsiveFontSize(2.5),
  },
  printDailyReceiptButton: {
    marginTop: responsiveHeight(2),
    width: '60%',
  },
  submitPinCodeBtn: {
    marginTop: responsiveHeight(2),
    width: '60%',
  },
  selectPaybackPeriodLabelText: {
    fontSize: responsiveFontSize(2.5),
    color: Colors.black,
  },
  paybackPeriodPicker: {
    width: '80%',
  },
  selectPaybackPeriodModalNextBtn: {
    width: '60%',
  },
  retourDialogTitleText: {
    color: Colors.black,
  },
});

export default Home;
