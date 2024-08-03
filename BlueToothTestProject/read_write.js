// read_write.js
import BleManager from 'react-native-ble-manager';

export const readData = (id, serviceUUID, characteristicUUID) => {
  BleManager.read(id, serviceUUID, characteristicUUID)
    .then((data) => {
      console.log('Read data:', data);
    })
    .catch((error) => {
      console.error('Read error', error);
    });
};

export const writeData = (id, serviceUUID, characteristicUUID, data) => {
  BleManager.write(id, serviceUUID, characteristicUUID, data)
    .then(() => {
      console.log('Write data success');
    })
    .catch((error) => {
      console.error('Write error', error);
    });
};
