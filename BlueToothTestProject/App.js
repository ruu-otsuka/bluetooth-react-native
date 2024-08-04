import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import { requestPermissions } from "./request_permissions";
import BluetoothSerial from 'react-native-bluetooth-classic';
import DropDownPicker from 'react-native-dropdown-picker';


const App = () => {
  const [devices, setDevices] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);

  // コンボボックス用の状態
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {label: 'デバイスA', value: 'deviceA'},
    {label: 'デバイスB', value: 'deviceB'},
    {label: 'デバイスC', value: 'deviceC'},
    // 必要に応じて他のデバイスを追加
  ]);
  // サンプルデータログ
  const [dataLog, setDataLog] = useState([
    { id: '1', datetime: '2024-08-03 10:00', data1: '25.5', data2: '60', data3: '1013', data4: '5.2', data5: '80' },
    { id: '2', datetime: '2024-08-03 11:00', data1: '26.0', data2: '62', data3: '1012', data4: '5.5', data5: '82' },
    { id: '3', datetime: '2024-08-03 12:00', data1: '26.5', data2: '61', data3: '1011', data4: '5.3', data5: '81' },
    // 必要に応じてデータを追加
  ]);

  useEffect(() => {
    const checkBluetooth = async () => {
      try {
        console.log('Checking Bluetooth Classic deices');
        const enabled = await BluetoothSerial.isBluetoothEnabled();
        setIsEnabled(enabled);
        if (enabled) {
          const bondedDevices = await BluetoothSerial.getBondedDevices();
          console.log(bondedDevices);
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

    checkBluetooth();
    
  }, []);

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
          <Text style={styles.address}>{item.address}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLogItem = ({ item }) => (
    <View style={styles.logItem}>
      <Text style={styles.logText}>{item.datetime}</Text>
      <Text style={styles.logText}>{item.data1}</Text>
      <Text style={styles.logText}>{item.data2}</Text>
      <Text style={styles.logText}>{item.data3}</Text>
      <Text style={styles.logText}>{item.data4}</Text>
      <Text style={styles.logText}>{item.data5}</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.text}>現在時刻：</Text>
          <Text style={styles.text}>YYYY/mm/DD HH:MM</Text>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.dropdownWrapper}>
          <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="水位計のデバイス ID を選択"
              searchable={true}
              searchPlaceholder="デバイス ID を検索..."
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={styles.dropdownContainer}
              containerStyle={styles.dropdownMainContainer}
              zIndex={3000}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => console.log("接続ボタンが押されました")}
          >
            <Text style={styles.buttonText}>接続</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.text}>受信機との接続状況：</Text>
          <Text style={styles.text}>未接続</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.text}>水位計との通信状況：</Text>
          <Text style={{color: "#ff0000" , fontSize: 16}}>●</Text>
        </View>
        <Text style={styles.text}>ログデータを取得したい期間</Text>
        <View style={styles.dateInputContainer}>
          <TextInput
            style={styles.dateInput}
            onChangeText={() => {}}
            value={""}
            placeholder="年/月/日 時:分"
            placeholderTextColor="#888"
          />
          <Text style={styles.textInterInput}>〜</Text>
          <TextInput
            style={styles.dateInput}
            onChangeText={() => {}}
            value={""}
            placeholder="年/月/日 時:分"
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => console.log("uploadボタンが押されました")}
        >
          <Text style={styles.buttonText}>クラウドに Upload</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.logHeader}>
        <Text style={styles.logHeaderText}>日時</Text>
        <Text style={styles.logHeaderText}>データ1</Text>
        <Text style={styles.logHeaderText}>データ2</Text>
        <Text style={styles.logHeaderText}>データ3</Text>
        <Text style={styles.logHeaderText}>データ4</Text>
        <Text style={styles.logHeaderText}>データ5</Text>
      </View>
      <FlatList
        data={dataLog}
        renderItem={renderLogItem}
        keyExtractor={item => item.id}
        style={styles.logList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column", 
    backgroundColor: "#cccccc",
  },
  header: {
    padding: 16,
    flexDirection: "column", 
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0'
  },
  text: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    margin: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 1000, // ドロップダウンが他の要素の上に表示されるようにする
  },
  dropdownWrapper: {
    flex: 1,
    marginRight: 10,
  },
  dropdown: {
    borderColor: '#ccc',
  },
  dropdownMainContainer: {
    height: 40,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownContainer: {
    borderColor: '#ccc',
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "normal",
    color: "#000000",
    textAlign: "center",
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "normal",
    color: "#000000",
    textAlign: "center",
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  textInterInput: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#000000",
    paddingHorizontal: 10,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'stretch',
  },



  list: {
    flex: 1,
  },
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
  statusDot: {
    color: "#ff0000",
    fontSize: 16,
  },
  logHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: "#000000",
  },
  logList: {
    flex: 1,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logText: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    color: "#000000",
  },
});


export default App;
