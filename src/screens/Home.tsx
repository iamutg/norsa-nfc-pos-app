import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
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
import {SelectedAppMode} from '~/constants';
import {ApiService, IssuanceHistory} from '~/core/api';
import {LocalStorageService} from '~/core/LocalStorageService';
import {NfcReaderWriter} from '~/core/NfcReaderWriter';
import {ReceiptPrinter} from '~/core/ReceiptPrinter';
import {useModalState} from '~/hooks';
import {HomeScreenNavProp, RouteName} from '~/navigation';
import {Colors} from '~/styles';
import {
  AppMode,
  NfcTagOperationStatus,
  NfcTagScanningReason,
  PickerItem,
} from '~/types';
import {DateUtils, showToast} from '~/utils';
import {selectLoginData, useGlobalStore} from '~/state';

const testCardNumber = 'K-0035';
console.log('Test Card Number: ', testCardNumber);

export interface HomeProps {
  navigation: HomeScreenNavProp;
}

export function Home({navigation: {navigate}}: HomeProps) {
  const loginData = useGlobalStore(selectLoginData);

  const [loading, setLoading] = React.useState(false);
  const [dailyReceiptPrintLoading, setDailyReceiptPrintLoading] =
    React.useState(false);
  const [printPreviousReceiptLoading, setPrintPreviousReceiptLoading] =
    React.useState(false);
  const [scanTagModalShown, showScanTagModal, hideScanTagModal] =
    useModalState();
  const [
    selectPaybackPeriodModalShown,
    showSelectPaybackPeriodModal,
    hideSelectPaybackPeriodModal,
  ] = useModalState();
  const [retourDialogShown, showRetourDialog, hideRetourDialog] =
    useModalState();
  const [paybackPeriods, setPaybackPeriods] = React.useState<Array<PickerItem>>(
    [],
  );
  const [selectedPaybackPeriod, setSelectedPaybackPeriod] = React.useState('');
  const [selectedIssuanceHistory, setSelectedIssuanceHistory] = React.useState<
    IssuanceHistory | undefined
  >();
  const [scanningStatus, setScanningStatus] =
    React.useState<NfcTagOperationStatus>('scanning');
  const [nfcTagScanningReason, setNfcTagScanningReason] =
    React.useState<NfcTagScanningReason>('expense');
  const [error, setError] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [balanceDialogShown, showBalanceDialog, hideBalanceDialog] =
    useModalState();
  const [loaderLoading, setLoaderLoading] = React.useState(false);

  const issuanceHistoriesRef = React.useRef<Array<IssuanceHistory> | null>(
    null,
  );

  React.useEffect(() => {
    NfcReaderWriter.initNfcManager().then(
      initialized =>
        !initialized && showToast('Unable to prepare device to scan nfc tag'),
    );
    shouldPrintDailyReceipt();
  }, []);

  const clearAllStates = () => {
    setLoading(false);
    setDailyReceiptPrintLoading(false);
    hideScanTagModal();
    hideSelectPaybackPeriodModal();
    setScanningStatus('scanning');
    setError('');
    setLoaderLoading(false);
  };

  const shouldPrintDailyReceipt = async () => {
    const printDateRes = await LocalStorageService.getString(
      LocalStorageService.Keys.DailyReportPrintedDate,
    );
    console.log('Daily report printDate: ', printDateRes);

    if (printDateRes.success && DateUtils.shouldPrintDailyReceipt()) {
      printDailyReport();
    }
  };

  const printDailyReport = async () => {
    setDailyReceiptPrintLoading(true);
    const dailyTranxRes = await ApiService.doGetDailyTransactions();

    if (dailyTranxRes.success) {
      if (dailyTranxRes.data?.data?.length === 0) {
        showToast('There are no transactions to be printed');
        setDailyReceiptPrintLoading(false);
        LocalStorageService.setString(
          LocalStorageService.Keys.DailyReportPrintedDate,
          DateUtils.currentDateTimeString(),
        );
        return;
      }

      const printRes = await ReceiptPrinter.printDailyReceipt(
        dailyTranxRes.data?.data ?? [],
        loginData?.name ?? '',
      );
      setDailyReceiptPrintLoading(false);

      if (printRes.success) {
        LocalStorageService.setString(
          LocalStorageService.Keys.DailyReportPrintedDate,
          currentTimestamp.toString(),
        );
      } else {
        console.log('Error printing daily transactions', printRes.cause);
        showToast(printRes.message);
      }
    } else {
      showToast(dailyTranxRes.message);
    }
  };

  const readTag = async () => {
    setScanningStatus('scanning');
    const tagScanRes = await NfcReaderWriter.readNfcTag();
    console.log('Nfc Tag Result', tagScanRes);

    if (tagScanRes.success) {
      console.log('cardNumber', tagScanRes.data);
      setCardNumber(tagScanRes.data);
      setScanningStatus('success');
      onReadTagSuccess(tagScanRes.data);
    } else {
      setScanningStatus('error');
      setError(tagScanRes.message);
    }
  };

  const gotoExpenseScreen = (issuanceHistory?: IssuanceHistory) => {
    navigate(RouteName.PrintExpense, {
      client: {
        id: issuanceHistory?.Client_id ?? '',
        code: issuanceHistory?.clientCode ?? '',
        name: issuanceHistory?.clientName ?? '',
      },
      paybackPeriod: issuanceHistory?.paybackPeriod ?? 0,
      maxAmount: parseFloat(
        nfcTagScanningReason === 'expense'
          ? issuanceHistory?.Balance ?? '0'
          : issuanceHistory?.Amount ?? '0',
      ),
      cardId: cardNumber,
      pinCode: issuanceHistory?.Pincode ?? '',
      issuanceHistoryId: issuanceHistory?.id ?? '',
      paymentType: nfcTagScanningReason,
    });
  };

  const onReadTagSuccess = async (cardNumber: string) => {
    clearAllStates();
    setLoaderLoading(true);

    const issuanceHistoriesRes = await ApiService.doGetMultipleIssuaceHistories(
      cardNumber,
    );

    setLoaderLoading(false);

    if (issuanceHistoriesRes.failure) {
      showToast(issuanceHistoriesRes.message);
    } else if (issuanceHistoriesRes?.data?.length === 0) {
      showToast(
        'This person has not applied to perform payments, Please contact your dealer',
      );
    } else if (issuanceHistoriesRes.data) {
      const paybackPickerItems = issuanceHistoriesRes?.data?.map(
        issuanceHistory => ({
          title: `${issuanceHistory.paybackPeriod} month${
            issuanceHistory?.paybackPeriod ?? 0 > 1 ? 's' : ''
          }`,
          value: `${issuanceHistory?.paybackPeriod}`,
        }),
      );

      const smallestPaybackPeriod = `${
        issuanceHistoriesRes?.data
          ?.map?.(item => item.paybackPeriod)
          ?.sort?.((a, b) => (a ?? 0) - (b ?? 0))?.[0]
      }`;

      issuanceHistoriesRef.current = issuanceHistoriesRes?.data;
      setSelectedPaybackPeriod(smallestPaybackPeriod);
      setPaybackPeriods(paybackPickerItems);
      showSelectPaybackPeriodModal();
    }
  };
  const onScanNfcTagForExpensePressed = async () => {
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('expense');
    onShowScanTagModal();
  };
  const onScanTagForRetourPressed = async () => {
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('retour');
    onShowScanTagModal();
  };
  const onPrintPreviousPrintedReceipt = async () => {
    setPrintPreviousReceiptLoading(true);

    const prevReceiptRes = await LocalStorageService.getString(
      LocalStorageService.Keys.PreviousPrintedReceipt,
    );

    if (prevReceiptRes.success && prevReceiptRes.data) {
      await ReceiptPrinter.print(prevReceiptRes.data).then(
        res => res.failure && showToast(res.message),
      );
    } else {
      showToast('There is no previous receipt');
    }

    setPrintPreviousReceiptLoading(false);
  };

  const onScanNfcForBalance = async () => {
    // setCardNumber(testCardNumber);
    // setScanningStatus('success');
    setNfcTagScanningReason('balance');
    onShowScanTagModal();
  };
  const onPrintDailyReceiptPressed = async () => {
    await printDailyReport();
  };
  const onShowScanTagModal = async () => {
    setLoading(true);
    const enabled = await NfcReaderWriter.checkIfNfcEnabled();
    setLoading(false);
    if (enabled) {
      showScanTagModal();
    } else {
      Alert.alert(
        'NFC Disabled',
        'Nfc is disabled. Please enable Nfc and try again',
      );
    }
  };
  const onHideScanTagModal = () => {
    hideScanTagModal();
    NfcReaderWriter.cleanUpReadingListners();
  };
  const onHideSelectPaybackPeriodModal = () => {
    setSelectedPaybackPeriod('');
    hideSelectPaybackPeriodModal();
  };
  const onContinueToRetourPressed = () => {
    hideRetourDialog();
    onScanTagForRetourPressed();
  };
  const onSelectPaybackPeriodNextButtonPressed = () => {
    if (selectedPaybackPeriod && selectedPaybackPeriod !== 'none') {
      const paybackPeriodIndex = issuanceHistoriesRef.current?.findIndex(
        issuanceHistory =>
          `${issuanceHistory.paybackPeriod}` === selectedPaybackPeriod,
      );
      const issuanceHistory =
        issuanceHistoriesRef.current?.[paybackPeriodIndex ?? 0];
      onHideSelectPaybackPeriodModal();

      if (nfcTagScanningReason === 'balance') {
        setSelectedIssuanceHistory(issuanceHistory);
        showBalanceDialog();
      } else {
        gotoExpenseScreen(issuanceHistory);
      }
    } else {
      showToast('Please select payback period');
    }
  };
  const onPrintBalancePressed = async () => {
    const balance = parseFloat(selectedIssuanceHistory?.Balance ?? '0');
    ReceiptPrinter.printBalance({
      balance,
      customer: {
        id: selectedIssuanceHistory?.Client_id ?? '',
        code: selectedIssuanceHistory?.clientCode ?? '',
        name: selectedIssuanceHistory?.clientName ?? '',
      },
      cardNumber,
      merchantName: loginData?.name ?? '',
      paybackPeriod: selectedIssuanceHistory?.paybackPeriod ?? 0,
    }).then(res => {
      if (res.failure) {
        console.log('Error printing balance', res.cause);
        showToast(res.message);
      }
    });
  };

  const ButtonsMap: {[key in AppMode]: React.ReactNode} = {
    'expense-retour': (
      <>
        <Button
          title="Expense"
          style={styles.scanNfcBtn}
          loading={loading}
          onPress={onScanNfcTagForExpensePressed}
        />
        <Button
          title="Retour"
          style={styles.scanNfcBtn}
          onPress={showRetourDialog}
        />
      </>
    ),
    expense: (
      <Button
        title="Expense"
        style={styles.scanNfcBtn}
        loading={loading}
        onPress={onScanNfcTagForExpensePressed}
      />
    ),
    retour: (
      <Button
        title="Retour"
        style={styles.scanNfcBtn}
        onPress={showRetourDialog}
      />
    ),
  };

  const renderNfcScanning = () => {
    return (
      <View style={styles.nfcContentContainer}>
        <ActivityIndicator animating color={Colors.primary} size="large" />
        <Text style={styles.scanningNfcText}>Scanning Nearby NFC card</Text>
      </View>
    );
  };
  const renderTryAgain = () => {
    return (
      <View style={styles.nfcContentContainer}>
        <Text style={styles.tryAgainText}>{error}</Text>
        <Button title="Try Again" onPress={readTag} />
      </View>
    );
  };
  const renderModalContent = () => {
    if (scanningStatus === 'scanning') {
      return renderNfcScanning();
    } else if (scanningStatus === 'error') {
      return renderTryAgain();
    } else {
      return null;
    }
  };
  const renderPaybackPeriodItems = () =>
    paybackPeriods.map((paybackPeriod, index) => (
      <Picker.Item
        key={index}
        label={paybackPeriod.title}
        value={paybackPeriod.value}
        color={Colors.black}
      />
    ));

  return (
    <ScreenContainer>
      <Header title="Home" hasLogoutButton hasSettingsButton />
      <View style={styles.f1}>
        <View style={styles.contentContainer}>
          <Image source={logo} style={styles.logo} />
          {ButtonsMap[SelectedAppMode]}
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
      <BottomModal visible={scanTagModalShown}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeBottomModalBtn}
            onPress={onHideScanTagModal}>
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
            onPress={onHideSelectPaybackPeriodModal}>
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
            onValueChange={setSelectedPaybackPeriod}>
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
      <Dialog.Container visible={retourDialogShown}>
        <Dialog.Title>
          <Text style={styles.retourDialogTitleText}>Retour</Text>
        </Dialog.Title>
        <Dialog.Description style={styles.retourDialogText}>
          This is meant for refund only,do not use for normal transactions.
        </Dialog.Description>
        <Dialog.Button
          label="Cancel"
          color={Colors.red}
          onPress={hideRetourDialog}
        />
        <Dialog.Button label="Continue" onPress={onContinueToRetourPressed} />
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
}

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
  retourDialogText: {
    color: Colors.red,
  },
  balanceText: {
    fontWeight: 'bold',
    color: Colors.red,
  },
});
