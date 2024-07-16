import React, {FC, useCallback, useState, useEffect} from 'react';
import moment from 'moment';
import {StyleSheet, Text, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {Button, Header, Loader, ScreenContainer} from '~/components';
import {print, printWithConfig} from '~/native_modules/PosPrinter';
import {Colors} from '~/styles';
import {isValidFloatNumber, printerDefaultConfig, showAlert} from '~/utils';
import {
  getPrinterDefaultConfig,
  setPrinterDefaultConfig,
} from '~/core/LocalStorageService';
import {PrinterConfig as TPrinterConfig} from '~/types';
import {showToast} from './../utils/index';

export interface Props {}

const PrinterConfig: FC<Props> = ({}) => {
  const [loading, setLoading] = useState(true);
  const [printerDpi, setPrinterDpi] = useState('');
  const [printerWidthMM, setPrinterWidthMM] = useState('');
  const [printerNbrCharactersPerLine, setPrinterNbrCharactersPerLine] =
    useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    (async () => {
      const config = await getPrinterDefaultConfig();
      setConfig(config);
      setLoading(false);
    })();
  }, []);

  const setConfig = useCallback((config: TPrinterConfig) => {
    setPrinterDpi(config.printerDpi.toString());
    setPrinterWidthMM(config.printerWidthMM.toString());
    setPrinterNbrCharactersPerLine(
      config.printerNbrCharactersPerLine.toString(),
    );
  }, []);

  const onPrintPressed = useCallback(async () => {
    const _dpi = printerDpi.trim();
    const _widthMM = printerWidthMM.trim();
    const _charactersPerLine = printerNbrCharactersPerLine.trim();
    const _expenseAmount = expenseAmount.trim() || 100;

    if (_dpi === '' || !isValidFloatNumber(_dpi) || parseFloat(_dpi) === 0) {
      showAlert('Invalid', 'Dpi is invalid');
      return;
    }
    if (
      _widthMM === '' ||
      !isValidFloatNumber(_widthMM) ||
      parseFloat(_widthMM) === 0
    ) {
      showAlert('Invalid', 'Width MM is invalid');
      return;
    }
    if (
      _charactersPerLine === '' ||
      !isValidFloatNumber(_charactersPerLine) ||
      parseFloat(_charactersPerLine) === 0
    ) {
      showAlert('Invalid', 'Nbr Characters Per Line is invalid');
      return;
    }

    const textToPrinted =
      "[C]<u><font size='big'>Merpol</font></u>\n" +
      '[L]\n' +
      `[C]Receipt N.O: ${(Math.random() * 1000).toFixed(0)}\n` +
      `[C]${moment().format('DD/MM/YYYY hh:mm:ss A')}\n` +
      `[L]\n` +
      '[C]================================\n' +
      '[L]\n' +
      `[L]Sale Amount :[R]NAFL ${_expenseAmount}\n` +
      '[L]\n' +
      '[C]================================\n' +
      '[L]\n' +
      "[L]<font size='tall'>Merchant :</font>\n" +
      '[L]Jake Gill\n' +
      "[L]<font size='tall'>Customer :</font>\n" +
      `[L]${'Max'} ${'Norton'}\n` +
      `[L]${'123'}\n` +
      `[L]\n` +
      `[L]\n` +
      "[L]<font size='tall'>Signature :</font>\n" +
      `[L]\n` +
      `[L]\n` +
      `[L]--------------------------------\n` +
      `[L]\n` +
      `[L]Thank you for your purchase\n` +
      `[L]For questions or inquiries call customer service : +5999 767-1563`;

    try {
      const dpi = parseFloat(_dpi);
      const widthMM = parseFloat(_widthMM);
      const nbrCharactersPerLine = parseFloat(_charactersPerLine);
      const config: TPrinterConfig = {
        printerDpi: dpi,
        printerWidthMM: widthMM,
        printerNbrCharactersPerLine: nbrCharactersPerLine,
      };

      console.log('Text', textToPrinted);
      await printWithConfig(textToPrinted, config);
    } catch (error) {
      console.log('Error Printing', error);
      showAlert('Error', error.message);
    }
  }, [printerDpi, printerWidthMM, printerNbrCharactersPerLine, expenseAmount]);

  const onSaveConfigPressed = useCallback(async () => {
    const _dpi = printerDpi.trim();
    const _widthMM = printerWidthMM.trim();
    const _charactersPerLine = printerNbrCharactersPerLine.trim();

    if (_dpi === '' || !isValidFloatNumber(_dpi) || parseFloat(_dpi) === 0) {
      showAlert('Invalid', 'Dpi is invalid');
      return;
    }
    if (
      _widthMM === '' ||
      !isValidFloatNumber(_widthMM) ||
      parseFloat(_widthMM) === 0
    ) {
      showAlert('Invalid', 'Width MM is invalid');
      return;
    }
    if (
      _charactersPerLine === '' ||
      !isValidFloatNumber(_charactersPerLine) ||
      parseFloat(_charactersPerLine) === 0
    ) {
      showAlert('Invalid', 'Nbr Characters Per Line is invalid');
      return;
    }

    const dpi = parseFloat(_dpi);
    const widthMM = parseFloat(_widthMM);
    const nbrCharactersPerLine = parseFloat(_charactersPerLine);

    setLoading(true);
    await setPrinterDefaultConfig({
      printerDpi: dpi,
      printerWidthMM: widthMM,
      printerNbrCharactersPerLine: nbrCharactersPerLine,
    });
    showToast('Printer settings saved');
    setLoading(false);
  }, [printerDpi, printerWidthMM, printerNbrCharactersPerLine]);

  const onResetButtonPressed = useCallback(async () => {
    setLoading(true);
    setConfig(printerDefaultConfig);
    setExpenseAmount('');
    setPrinterDefaultConfig(printerDefaultConfig);
    showToast('Printer config reset');
    setLoading(false);
  }, []);

  return (
    <ScreenContainer>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        <Header hasBackButton title="Printer Config" />
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.seprator} />
          <Text style={styles.titleText}>Printer Dpi</Text>
          <Text style={styles.desc}>DPI of the connected printer</Text>
          <View style={styles.seprator} />
          <TextInput
            value={printerDpi}
            onChangeText={setPrinterDpi}
            style={styles.input}
            placeholder="Dpi"
            keyboardType="numeric"
          />
          <View style={styles.seprator} />
          <Text style={styles.titleText}>Printer Width MM</Text>
          <Text style={styles.desc}>
            Printing width in millimeters (can be in decimal points)
          </Text>
          <View style={styles.seprator} />
          <TextInput
            value={printerWidthMM}
            onChangeText={setPrinterWidthMM}
            style={styles.input}
            placeholder="Width MM"
            keyboardType="numeric"
          />
          <View style={styles.seprator} />
          <Text style={styles.titleText}>Nbr Characters Per Line</Text>
          <Text style={styles.desc}>
            The maximum number of medium sized characters that can be printed on
            a line
          </Text>
          <View style={styles.seprator} />
          <TextInput
            value={printerNbrCharactersPerLine}
            onChangeText={setPrinterNbrCharactersPerLine}
            style={styles.input}
            placeholder="Nbr Characters Per Line"
            keyboardType="numeric"
          />
          <View style={styles.seprator} />
          <Text style={styles.titleText}>Amount</Text>
          <View style={styles.seprator} />
          <TextInput
            value={expenseAmount}
            onChangeText={setExpenseAmount}
            style={styles.input}
            placeholder="Default value: 100"
            keyboardType="numeric"
          />
          <View style={styles.seprator} />
          <Button
            style={styles.button}
            title="Print"
            onPress={onPrintPressed}
          />
          <View style={styles.seprator} />
          <Button
            style={styles.button}
            title="Save Config"
            onPress={onSaveConfigPressed}
          />
          <View style={styles.seprator} />
          <Button
            style={styles.button}
            title="Reset"
            onPress={onResetButtonPressed}
          />
        </KeyboardAwareScrollView>
        <Loader visible={loading} />
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
  },
  input: {
    borderWidth: responsiveWidth(0.3),
    borderColor: Colors.border,
    borderRadius: responsiveWidth(50) / 8,
    width: '100%',
    padding: responsiveFontSize(1.5),
  },
  scroll: {
    width: '90%',
    alignSelf: 'center',
    paddingBottom: responsiveHeight(2),
  },
  scrollContentContainer: {},
  titleText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: responsiveFontSize(2.5),
  },
  desc: {
    marginTop: responsiveHeight(0.5),
    color: Colors.border,
    fontSize: responsiveFontSize(1.8),
  },
  seprator: {
    marginVertical: responsiveHeight(1.2),
  },
  button: {
    width: '80%',
    alignSelf: 'center',
  },
});

export default PrinterConfig;
