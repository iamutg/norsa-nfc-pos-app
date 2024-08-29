import {Picker} from '@react-native-picker/picker';
import moment from 'moment';
import React, {FC, useCallback, useEffect, useRef} from 'react';
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
  BalanceDialog,
} from '~/components';
import {useAuthContext} from '~/context/AuthContext';
import {
  doGetDaily10To6Transactions,
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
import {getCurrentUtcTimestamp, getLocalTimestamp, showToast} from '~/utils';
import {printText} from './../core/ReceiptPrinter';

const testCardNumber = 'K-0035';
console.log('Test Card Number: ', testCardNumber);

export interface Props {
  navigation: HomeScreenNavProp;
}

const Home: FC<Props> = ({navigation: {navigate}}) => {
  const {loginData} = useAuthContext();

  const [loading, setLoading] = React.useState(false);
  const [dailyReceiptPrintLoading, setDailyReceiptPrintLoading] =
    React.useState(false);
  const [printPreviousReceiptLoading, setPrintPreviousReceiptLoading] =
    React.useState(false);
  const [daily10To6ReceiptPrintLoading, setDaily10To6ReceiptPrintLoading] =
    React.useState(false);
  const [bottomModalShown, setBottomModalShown] = React.useState(false);
  const [selectPaybackPeriodModalShown, setSelectPaybackPeriodModalShown] =
    React.useState(false);
  const [isRetourDialogShown, openRetourDialog, closeRetourDialog] =
    useModalState();
  const [paybackPeriods, setPaybackPeriods] = React.useState<Array<PickerItem>>(
    [],
  );
  const [selectedPaybackPeriod, setSelectedPaybackPeriod] = React.useState('');
  const [selectedIssuanceHistory, setSelectedIssuanceHistory] =
    React.useState<IssuanceHistory>(null);
  const [scanningStatus, setScanningStatus] =
    React.useState<NfcTagOperationStatus>('scanning');
  const [nfcTagScanningReason, setNfcTagScanningReason] =
    React.useState<NfcTagScanningReason>('expense');
  const [error, setError] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [balanceDialogShown, showBalanceDialog, hideBalanceDialog] =
    useModalState();
  const [loaderLoading, setLoaderLoading] = React.useState(false);

  const issuanceHistoriesRef = useRef<Array<IssuanceHistory> | null>(null);

  useEffect(() => {
    initNfcManager().catch(error =>
      console.log('Error initializing nfc manager', error),
    );
    // shouldPrintDailyReceipt();
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
        'This person has not applied to perform gas station payments, Please contact your dealer',
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
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('expense');
    showBottomModal();
  }, []);

  const onScanNfcForRetourPressed = useCallback(async () => {
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('retour');
    showBottomModal();
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
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('balance');
    showBottomModal();
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

  const onPrintDaily10To6ReceiptPressed = async () => {
    setDaily10To6ReceiptPrintLoading(true);

    const dailyTransactions = await doGetDaily10To6Transactions(loginData.id);

    try {
      if (dailyTransactions.data && dailyTransactions.data.length === 0) {
        showToast('There are no transactions to be printed');
      } else if (dailyTransactions.data) {
        await printDailyReceipt(dailyTransactions.data, loginData?.name);
      } else {
        showToast(dailyTransactions.message);
      }
    } catch (error) {
      console.log('Error printing daily Receipt');
      showToast(error.message);
    }

    setDaily10To6ReceiptPrintLoading(false);
  };

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
        setSelectedIssuanceHistory(issuanceHistory);
        showBalanceDialog();
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

  const onPrintBalancePressed = async () => {
    try {
      const balance = parseFloat(selectedIssuanceHistory?.Balance);

      await printBalance(
        {
          id: selectedIssuanceHistory?.Client_id,
          code: selectedIssuanceHistory?.clientCode,
          name: selectedIssuanceHistory?.clientName,
        },
        cardNumber,
        loginData?.name,
        balance,
        selectedIssuanceHistory?.paybackPeriod ?? 0,
      );
    } catch (error) {
      console.log('Error printing Balance');
      showToast(error.message);
    }
  };

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
          <Button
            title="1. Show Balance"
            style={styles.actionButton}
            onPress={onScanNfcForBalance}
          />
          <Button
            title="2. Expense"
            style={styles.actionButton}
            onPress={onScanNfcPressed}
          />
          {/* <Button
            title="3. Retour"
            style={styles.actionButton}
            onPress={openRetourDialog}
          /> */}
          <Button
            loading={printPreviousReceiptLoading}
            title="3. Print Previous Receipt"
            style={styles.actionButton}
            onPress={onPrintPreviousPrintedReceipt}
          />
          <Button
            loading={dailyReceiptPrintLoading}
            title="4. Print Daily Receipt"
            style={styles.actionButton}
            onPress={onPrintDailyReceiptPressed}
          />
          <Button
            loading={daily10To6ReceiptPrintLoading}
            title="5. Print Daily Receipt 10/6"
            style={styles.actionButton}
            onPress={onPrintDaily10To6ReceiptPressed}
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
        <Dialog.Description style={styles.retourDialogText}>
          This is meant for refund only, do not use for normal transactions.
        </Dialog.Description>
        <Dialog.Button
          label="Cancel"
          color={Colors.red}
          onPress={closeRetourDialog}
        />
        <Dialog.Button label="Continue" onPress={onContinuePressed} />
      </Dialog.Container>
      <BalanceDialog
        visible={balanceDialogShown}
        description={
          <Text>
            {selectedIssuanceHistory?.clientName} Your balance for card number{' '}
            {cardNumber} is :{' '}
            <Text style={styles.balanceText}>
              NAFL{' '}
              {parseFloat(selectedIssuanceHistory?.Balance ?? '0').toFixed(2)}
            </Text>
          </Text>
        }
        negativeButtonText="PRINT"
        posititveButtonText="OK"
        closeDialog={hideBalanceDialog}
        onNegativeButtonPress={onPrintBalancePressed}
      />
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
  actionButton: {
    marginTop: responsiveHeight(3),
    width: '100%',
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
  retourDialogText: {
    color: Colors.red,
  },
  balanceText: {
    fontWeight: 'bold',
    color: Colors.red,
  },
});

export default Home;
