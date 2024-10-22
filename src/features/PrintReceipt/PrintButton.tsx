import React from 'react';
import {ToastAndroid, Alert} from 'react-native';
import {ALIGN, BluetoothEscposPrinter} from 'tp-react-native-bluetooth-printer';
import {Button} from '~/components';
import {checkPrinterConnected} from '../BluetoothThermalPrinter';

// Make sure this is a valid Base64 encoded image string

const printReceiptWithImage = async () => {
  try {
    await checkPrinterConnected().then(async isConnected => {
      if (isConnected) {
        ToastAndroid.show('Printing Receipt...', ToastAndroid.SHORT);
        await BluetoothEscposPrinter.printerInit();
        await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
        await BluetoothEscposPrinter.setBold(1);
        await BluetoothEscposPrinter.printText('Merpol\n\n');
        await BluetoothEscposPrinter.setBold(0);
        await BluetoothEscposPrinter.printText('Receipt N.O: 123456\n');
        // Notify of Success
        ToastAndroid.show('Receipt Printed Successfully', ToastAndroid.SHORT);
      }
    });
  } catch (error) {
    console.log('Printing Error: ', error);
    Alert.alert(
      'Error',
      `Failed to Print Receipt: ${error?.message}
      `,
    );
  }
};

// Button to trigger printing
interface PrintButtonProps {
  title: string;
  disabled?: boolean;
}

const PrintButton = ({title, disabled}: PrintButtonProps) => (
  <Button
    style={{
      marginTop: 10,
    }}
    title={title}
    onPress={async () => {
      await printReceiptWithImage();
    }}
    // disabled={disabled}
  />
);

export default PrintButton;
