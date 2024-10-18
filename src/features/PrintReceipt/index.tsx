import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  DeviceEventEmitter,
  NativeEventEmitter,
  Switch,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
  BluetoothTscPrinter,
} from 'tp-react-native-bluetooth-printer';
import PrintButton from './PrintButton';
import AsyncStorage from '@react-native-community/async-storage';

const {height, width} = Dimensions.get('window');

const PrintReceipt = () => {
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

    const bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
        _deviceAlreadPaired,
      ),
    );
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_FOUND,
        _deviceFoundEvent,
      ),
    );
    _listeners.push(
      bluetoothManagerEmitter.addListener(
        BluetoothManager.EVENT_CONNECTION_LOST,
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

  useEffect(() => {
    const getData = async () => {
      try {
        const dlog = await AsyncStorage.getItem('@dataprinter');
        JSON.parse(dlog, (key, value) => {
          if (key === 'boundAddress') setBoundAddress(value);
          if (key === 'name') setName(value);
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
          BluetoothManager.connect(row.address)
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
    BluetoothManager.scanDevices()
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
        <Text style={styles.title}>
          Bluetooth Opened: {bleOpend ? 'true' : 'false'}
          <Text> Open BLE Before Scanning</Text>
        </Text>
        <View>
          <Switch
            value={bleOpend}
            onValueChange={v => {
              setLoading(true);
              if (!v) {
                BluetoothManager.disableBluetooth()
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
                BluetoothManager.enableBluetooth()
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
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 30,
          }}>
          <PrintButton
            disabled={loading || !(bleOpend && boundAddress.length > 0)}
            title="Test Print Receipt"
          />
        </View>
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
