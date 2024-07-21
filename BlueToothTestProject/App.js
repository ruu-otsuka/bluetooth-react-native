import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

const CONNECT_TIMEOUT = 10000; // 10秒
const MAX_RETRIES = 3;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectWithTimeout = async (device, timeout = CONNECT_TIMEOUT) => {
  return Promise.race([
    device.connect(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), timeout)
    )
  ]);
};

const safeConnect = async (device) => {
  try {
    await device.cancelConnection();
  } catch (e) {
    // 既に切断されている場合はエラーを無視
  }
  return connectWithTimeout(device);
};

const getDeviceName = async (device, retries = 0) => {
  if (retries >= MAX_RETRIES) {
    console.log(`Max retries reached for device ${device.id}`);
    return null;
  }

  try {
    console.log(`Attempting to connect to device ${device.id} (Attempt ${retries + 1})`);
    const connectedDevice = await connectWithTimeout(device);
    console.log(`Connected to device ${device.id}`);
    
    const deviceName = await connectedDevice.name();
    console.log(`Retrieved name for device ${device.id}: ${deviceName}`);
    
    await connectedDevice.cancelConnection();
    console.log(`Disconnected from device ${device.id}`);
    
    return deviceName;
  } catch (error) {
    console.log(`Error getting device name for ${device.id}:`, error);
    if (error.message === 'Connection timeout') {
      console.log(`Connection timed out, retrying... (Attempt ${retries + 1})`);
      await wait(1000); // Wait 1 second before retrying
      return getDeviceName(device, retries + 1);
    }
    return null;
  }
};


const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanAndConnect();
      }
    }, true);
    return () => subscription.remove();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) { // Android 12以降
        const grantedBLEScan = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Bluetooth Scan Permission",
            message: "This app needs Bluetooth scan permission",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        const grantedBLEConnect = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Bluetooth Connect Permission",
            message: "This app needs Bluetooth connect permission",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return (
          grantedBLEScan === PermissionsAndroid.RESULTS.GRANTED &&
          grantedBLEConnect === PermissionsAndroid.RESULTS.GRANTED
        );
      } else if (Platform.Version >= 23) { // Android 6.0以降、12未満
        const grantedFineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location for Bluetooth scanning",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return grantedFineLocation === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS or Android < 6.0
  };

  const safeConnect = async (device) => {
    try {
      await device.cancelConnection();
    } catch (e) {
      // 既に切断されている場合はエラーを無視
    }
    return connectWithTimeout(device);
  };

  const scanAndConnect = async () => {
    setIsScanning(true);
    setDevices([]);
  
    manager.startDeviceScan(null, { allowDuplicates: false }, async (error, device) => {
      if (error) {
        console.log('Scanning error:', error);
        setIsScanning(false);
        return;
      }
  
      if (device) {
        let deviceName = device.name;
        if (!deviceName) {
          deviceName = await getDeviceName(device);
        }
  
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, { 
              ...device, 
              name: deviceName || 'Unknown Device',
              id: device.id
            }];
          }
          return prevDevices;
        });
      }
    });
  
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
      console.log('Scan completed');
    }, 30000); // 30秒間スキャン
  };

  const connectToDevice = (device) => {
    setIsConnecting(true);
    manager.stopDeviceScan();
    manager.connectToDevice(device.id)
      .then((device) => {
        setConnectedDevice(device);
        console.log('Connected to', device.name);
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        console.log('Discovery completed:', device.name);
        // ここで必要な特性の読み取りや書き込みを行うことができます
      })
      .catch((error) => {
        console.log('Connection error:', error);
      })
      .finally(() => {
        setIsConnecting(false);
      });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => connectToDevice(item)} style={styles.deviceItem}>
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
      {item.manufacturerData && (
        <Text style={styles.manufacturerData}>
          Manufacturer Data: {item.manufacturerData}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button
        title={isScanning ? 'スキャン中...' : 'スキャン開始'}
        onPress={scanAndConnect}
        disabled={isScanning || isConnecting}
      />
      {isScanning && <ActivityIndicator style={styles.activityIndicator} />}
      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyList}>
            {isScanning ? 'デバイスを探しています...' : 'デバイスが見つかりません'}
          </Text>
        )}
      />
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>接続中...</Text>
        </View>
      )}
      {connectedDevice && (
        <View style={styles.connectedDevice}>
          <Text>接続済みデバイス: {connectedDevice.name || connectedDevice.id}</Text>
        </View>
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  connectedDevice: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e6ffe6',
    borderRadius: 5,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
  },
  connectingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  activityIndicator: {
    marginTop: 10,
  },
});

export default App;