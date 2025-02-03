import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  NativeEventEmitter,
  Switch,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
  BluetoothTscPrinter,
  ALIGN,
} from 'tp-react-native-bluetooth-printer';
import PrintButton from './PrintButton';
import AsyncStorage from '@react-native-community/async-storage';
import {checkPrinterConnected} from '../BluetoothThermalPrinter';
import {base64Image, logoBase64} from '~/assets/images/logoBase64';
import {Button} from '~/components';
import {useNavigation} from '@react-navigation/native';

const {height, width} = Dimensions.get('window');

const PrintReceipt = () => {
  const navigation = useNavigation();

  const [pairedDs, setPairedDs] = useState([]);
  const [foundDs, setFoundDs] = useState([]);
  const [bleOpend, setBleOpend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boundAddress, setBoundAddress] = useState('');
  const [name, setName] = useState('');
  const _listeners = [];

  useEffect(() => {
    const checkBluetoothEnabled = async () => {
      const enabled = await BluetoothManager.isBluetoothEnabled();
      setBleOpend(Boolean(enabled));
      setLoading(false);
    };

    checkBluetoothEnabled();

    const bluetoothManagerEmitter = new NativeEventEmitter(
      BluetoothManager as any,
    );
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        (BluetoothManager as any).EVENT_DEVICE_ALREADY_PAIRED,
        _deviceAlreadPaired,
      ),
    );
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        (BluetoothManager as any).EVENT_DEVICE_FOUND,
        _deviceFoundEvent,
      ),
    );
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        (BluetoothManager as any).EVENT_CONNECTION_LOST,
        () => {
          setName('');
          setBoundAddress('');
        },
      ),
    );

    return () => {
      _listeners.forEach(listener => listener.remove());
    };
  }, []);

  const _testPrint = async () => {
    await checkPrinterConnected().then(async isConnected => {
      if (isConnected) {
        try {
          await BluetoothEscposPrinter.printerInit();
          await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
          await BluetoothEscposPrinter.printText('Merpol\n\r', {});
          await BluetoothEscposPrinter.printText('Hello World\n\r', {});
        } catch (error) {
          // Alert.alert('Error', error.message ?? 'Failed to print');
        }
      }
    });
  };

  const _printLogo = async () => {
    await checkPrinterConnected().then(async isConnected => {
      if (isConnected) {
        try {
          await BluetoothEscposPrinter.printerInit();
          await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
          await BluetoothEscposPrinter.printPic(base64Image, {
            width: 200,
            left: 40,
          });
        } catch (error) {
          // Alert.alert('Error', error.message ?? 'Failed to print');
        }
      }
    });
  };

  const _printLogoMerpol = async () => {
    await checkPrinterConnected().then(async isConnected => {
      if (isConnected) {
        try {
          await BluetoothEscposPrinter.printerInit();
          await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
          await BluetoothEscposPrinter.printPic(logoBase64, {
            width: 200,
            left: 40,
          });
        } catch (error) {
          // Alert.alert('Error', error.message ?? 'Failed to print');
        }
      }
    });
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const dlog = await AsyncStorage.getItem('@dataprinter');
        JSON.parse(dlog, (key, value) => {
          if (key === 'boundAddress') setBoundAddress(value);
          // if (key === 'name') setName(value);
        });
      } catch (e) {
        // alert('Error reading value: ' + e);
      }
    };

    getData();
  }, []);

  const _deviceAlreadPaired = rsp => {
    let ds =
      typeof rsp.devices === 'object'
        ? rsp.devices
        : JSON.parse(rsp.devices || '[]');
    if (ds && ds.length) {
      setPairedDs(prev => [...prev, ...ds]);
    }
  };

  const _deviceFoundEvent = rsp => {
    let r =
      typeof rsp.device === 'object' ? rsp.device : JSON.parse(rsp.device);
    if (r) {
      setFoundDs(prev => {
        if (!prev.some(device => device.address === r.address)) {
          return [...prev, r];
        }
        return prev;
      });
    }
  };

  const _storeData = async data => {
    try {
      const NewData = {
        boundAddress: data.boundAddress,
        name: data.name,
      };
      await AsyncStorage.setItem('@dataprinter', JSON.stringify(NewData));
    } catch (error) {
      // alert('Error saving data: ' + error);
    }
  };

  const _renderRow = rows => {
    return rows.map((row, index) => (
      <TouchableOpacity
        key={index}
        style={styles.wtf}
        onPress={() => {
          setLoading(true);
          (BluetoothManager.connect(row.address) as any)
            .then(() => {
              setLoading(false);
              setBoundAddress(row.address);
              setName(row.name || 'UNKNOWN');
              _storeData({
                boundAddress: row.address,
                name: row.name || 'UNKNOWN',
              });
            })
            .catch(e => {
              setLoading(false);
              // alert(e);
            });
        }}>
        <Text style={styles.name}>{row.name || 'UNKNOWN'}</Text>
        <Text style={styles.address}>{row.address}</Text>
      </TouchableOpacity>
    ));
  };

  const _scan = () => {
    setLoading(true);
    (BluetoothManager.scanDevices() as any)
      .then(s => {
        let found = JSON.parse(s.found || '[]');
        setFoundDs(found);
        setLoading(false);
      })
      .catch(er => {
        setLoading(false);
        // alert('Error: ' + JSON.stringify(er));
      });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text
          style={{
            fontSize: 20,
            textAlign: 'center',
            padding: 20,
            fontWeight: 'bold',
          }}>
          Printer Configuration
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            padding: 20,
            fontWeight: 'bold',
            color: 'red',
          }}>
          Please turn on the bluetooth and pair the printer before using this
          application.
        </Text>
        <View>
          <Switch
            value={bleOpend}
            onValueChange={v => {
              setLoading(true);
              if (!v) {
                (BluetoothManager.disableBluetooth() as any)
                  .then(() => {
                    setBleOpend(false);
                    setLoading(false);
                    setFoundDs([]);
                    setPairedDs([]);
                  })
                  .catch(err => {
                    // alert(err);
                  });
              } else {
                (BluetoothManager.enableBluetooth() as any)
                  .then(r => {
                    let paired = r
                      ? r.map(item => JSON.parse(item)).filter(Boolean)
                      : [];
                    setBleOpend(true);
                    setLoading(false);
                    setPairedDs(paired);
                  })
                  .catch(err => {
                    setLoading(false);
                    // alert(err);
                  });
              }
            }}
          />
          <Button
            style={{marginVertical: 10}}
            disabled={loading || !bleOpend}
            onPress={_scan}
            title="Scan"
          />
        </View>
        <Text style={styles.title}>
          Connected:{' '}
          <Text style={{color: 'blue'}}>{!name ? 'No Devices' : name}</Text>
        </Text>
        <Text style={styles.title}>Found (tap to connect):</Text>
        {loading ? <ActivityIndicator animating={true} /> : null}
        <View style={{flex: 1, flexDirection: 'column'}}>
          {_renderRow(foundDs)}
        </View>
        <Text style={styles.title}>Paired:</Text>
        {loading ? <ActivityIndicator animating={true} /> : null}
        <View style={{flex: 1, flexDirection: 'column'}}>
          {_renderRow(pairedDs)}
        </View>
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 30,
          }}>
          <Button
            title="Back"
            onPress={() => {
              navigation.goBack();
            }}
          />
        </View>
        {/* <View
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 30,
          }}>
          <Button
            style={{marginTop: 10}}
            title="Print Test Logo"
            onPress={_printLogo}
          />
          <Button
            style={{marginTop: 10}}
            title="Print  Merpol Logo"
            onPress={_printLogoMerpol}
          />

          <Button
            style={{marginTop: 10}}
            title="Test Print"
            onPress={_testPrint}
          />
        </View> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    padding: 16,
  },
  title: {
    backgroundColor: '#eee',
    color: '#232323',
    paddingVertical: 8,
    textAlign: 'left',
    marginBottom: 8,
  },
  wtf: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  name: {
    flex: 1,
    textAlign: 'left',
  },
  address: {
    flex: 1,
    textAlign: 'right',
  },
});

export default PrintReceipt;
