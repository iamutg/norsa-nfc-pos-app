import React from 'react';
import {Alert, ToastAndroid} from 'react-native';
import {
  ALIGN,
  BluetoothEscposPrinter,
  BluetoothManager,
} from 'tp-react-native-bluetooth-printer';
import AsyncStorage from '@react-native-community/async-storage';

async function checkPrinterConnected(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
      resolve(true);
    } catch (err) {
      await connectRecentlyUsedPrinter();
      resolve(true);
    }
  });
}

const showToastWithGravity = (message: string) => {
  ToastAndroid.showWithGravity(
    message,
    ToastAndroid.SHORT,
    ToastAndroid.CENTER,
  );
};

const enableBluetoothAndConnectFirstPairedPrinter = async () => {
  try {
    await (BluetoothManager.enableBluetooth() as any).then(r => {
      let paired = r ? r.map(item => JSON.parse(item)).filter(Boolean) : [];
      if (paired.length === 0) {
        return showToastWithGravity('No paired printer found');
      } else {
        try {
          const selectedPrinter = paired[0];
          const address = selectedPrinter.address;
          const name = selectedPrinter.name;
          AsyncStorage.setItem('@dataprinter', JSON.stringify({address, name}));
          showToastWithGravity(`Connecting to printer - ${address}`);
          (BluetoothManager.connect(address) as any)
            .then(() => {
              showToastWithGravity('Connected to printer');
            })
            .catch(error => {
              // console.error('Error connecting to printer', error);
              showToastWithGravity('Printer not connected');
            });
        } catch (e) {
          console.log('Error selecting paired device', e);
          return showToastWithGravity('Printer not connected');
        }
      }
    });
  } catch (error) {
    console.log('Error enabling bluetooth', error);
    return showToastWithGravity('Bluetooth not enabled');
  }
};

const connectedLocalStoragePrinter = async () => {
  const printerAddress = await AsyncStorage.getItem('@dataprinter');
  JSON.parse(printerAddress, async (key, value) => {
    if (key === 'address') {
      await (BluetoothManager.connect(value) as any)
        .then(async () => {
          showToastWithGravity('Connected to printer');
        })
        .catch(error => {
          // console.error('Error connecting to printer', error);
          showToastWithGravity('Error connecting to printer');
        });
    } else {
      console.log('Invalid printer address');
      await (BluetoothManager.disableBluetooth() as any).then(async () => {
        await enableBluetoothAndConnectFirstPairedPrinter();
      });
    }
  });
};

export const connectRecentlyUsedPrinter = async () => {
  const enabled = await BluetoothManager.isBluetoothEnabled();
  if (!enabled) {
    enableBluetoothAndConnectFirstPairedPrinter();
  } else connectedLocalStoragePrinter();
};

// export all functions
export {checkPrinterConnected, showToastWithGravity};
