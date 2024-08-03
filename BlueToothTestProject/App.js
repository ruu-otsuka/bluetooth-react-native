import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { requestPermissions } from "./request_permissions";
import BluetoothSerial from 'react-native-bluetooth-classic';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [devicesConnectable, setDevicesConnectable] = useState([]);
  const [bleDevices, setBleDevices] = useState([]);
  const [bleDevicesConnectable, setBleDevicesConnectable] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const initializeBle = async () => {
      try{
        await requestPermissions();  // パーミッションをリクエスト

        BleManager.start({ showAlert: false });

        const handleDiscoverPeripheral = (peripheral) => {
          console.log('Discovered Peripheral:', peripheral.advertising.serviceUUIDs);
          // console.log('Discovered Peripheral:', peripheral.id);
          setBleDevices(prevDevices => {
            if (prevDevices.find(device => device.id === peripheral.id)) {
              return prevDevices; // すでに存在する場合は追加しない
            }
            return [...prevDevices, peripheral];
          });
        };

        BleManager.start({ showAlert: false }).then(() => {
          BleManager.scan([], 10, true).then(() => {
            console.log('Scanning for BLE devices...');
          }).catch(error => {
            console.log('Scan error:', error);
          });
        });

        BleManager.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        return () => {
          BleManager.remove('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        };
      }catch(e){
        console.error('Error initializing BLE:', e);
      }
    };

    const checkBluetooth = async () => {
      try {
        console.log('Checking Bluetooth Classic deices');
        const enabled = await BluetoothSerial.isBluetoothEnabled();
        setIsEnabled(enabled);

        if (enabled) {
          const bondedDevices = await BluetoothSerial.getBondedDevices();
          console.log('Bluetooth Classic is bonded');
          for (let i=0;i<bondedDevices.length;i++){
            console.log(bondedDevices[i]);
            // console.log(bondedDevices[i].address);
          }
          setDevices(bondedDevices);
        } else {
          console.log('Bluetooth Classic is not enabled');
        }
      } catch (error) {
        console.error('Error checking Bluetooth status:', error);
      }
    };

    initializeBle();
    checkBluetooth();
    
  }, []);

  const sendBLEMessage = async (device, serviceUUID, characteristicUUID, message) => {
    // serviceUUID：心拍数モニタリング、バッテリーレベルの報告、温度センサーなどのサービスに紐づくもの
    // characteristicUUID：心拍数センサーのサービス内に「心拍数」と「接続状態」を表すキャラクタリスティックが含まれているようなイメージ
    try {
      await BleManager.connect(device.id);
      await BleManager.startNotification(device.id, serviceUUID, characteristicUUID);
  
      // メッセージをバッファに変換
      const data = Buffer.from(message, 'utf-8');
      
      // キャラクタリスティックに書き込み
      await BleManager.write(device.id, serviceUUID, characteristicUUID, data);
      console.log('Message sent:', message);
    } catch (error) {
      console.error('Error sending BLE message:', error);
    }
  };

  const sendMessage = async (device, message) => {
    try {
      const isConnected = await BluetoothSerial.isDeviceConnected(device.address);
      if (!isConnected) {
        await BluetoothSerial.connectToDevice(device.address);
      }
      await BluetoothSerial.writeToDevice(device.address,message);
      console.log('Message sent:', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const pairAndConnect = async (device) => {
    try {
      // 既にペアリング済みかを確認
      const isPaired = await BluetoothSerial.isBluetoothAvailable(device.id);
      if (!isPaired) {
        console.log('Pairing with', device.name);
        await BluetoothSerial.pairDevice(device.address);
        console.log('Paired with', device.name);
      } else {
        console.log('Device is already paired:', device.name);
      }
  
      console.log('Connecting to', device.name);
      await BluetoothSerial.connectToDevice(device.address);
      console.log('Connected to', device.name);
      if(!device.advertising){
        // classic device
        console.log('classic device');
        sendMessage(device,"test")
      }else{
        // ble device
        console.log('BLE device');
        sendBLEMessage(device,undefined,undefined,"test")
        // sendBLEMessage(device,peripheral.advertising.serviceUUIDs[0],None,"test")
      }
    } catch (error) {
      console.error('Error during pairing/connecting:', error.message);
      Alert.alert('Connection Error', `Could not connect to ${device.name}: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => {
    const isConnectable = item.advertising ? item.advertising.isConnectable : true; // BLEの場合、Classicは常にtrue
    const textStyle = isConnectable ? styles.connectable : styles.notConnectable;
    return (
      <TouchableOpacity onPress={() => pairAndConnect(item)}>
        <View style={styles.itemContainer}>
          <Text style={textStyle}>{item.name || 'Unnamed Device'}</Text>
          <Text style={styles.id}>{item.id}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bluetooth Classic Devices</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <Text style={styles.text}>BLE Devices</Text>
      <FlatList
        data={bleDevices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#666666",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  item: {
    fontSize: 14,
    color: "#ffffff",  // 明確に文字色を指定
    paddingTop: 10,
    paddingBottom: 0,
  },
  id: {
    fontSize: 16,
    color: "#ffffff",  // 明確に文字色を指定
    paddingTop: 0,
    paddingBottom: 10,
  },
  connectable: {
    color: '#00ff00', // 接続可能なときは緑
  },
  notConnectable: {
    color: '#ff0000', // 接続不可能なときは赤
  },
});


export default App;
