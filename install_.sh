##################################################
# react-native の install
##################################################

# react-native の install
nvm install --lts
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

##################################################
# react-native の javascript 版 project 作成
##################################################

# プロジェクト作成
npx react-native init BlueToothTestProject2 --pm npm --install-pods true
cd BlueToothTestProject2

# typescript から javascript へ
mv App.tsx App.js
# App.js 内の型アノテーションを削除
echo 'import React from "react";' > App.js
echo 'import { View, Text, StyleSheet } from "react-native";' >> App.js
echo '' >> App.js
echo 'const App = () => {' >> App.js
echo '  return (' >> App.js
echo '    <View style={styles.container}>' >> App.js
echo '      <Text style={styles.text}>Hello World!</Text>' >> App.js
echo '    </View>' >> App.js
echo '  );' >> App.js
echo '};' >> App.js
echo '' >> App.js
echo 'const styles = StyleSheet.create({' >> App.js
echo '  container: {' >> App.js
echo '    flex: 1,' >> App.js
echo '    justifyContent: "center",' >> App.js
echo '    alignItems: "center",' >> App.js
echo '    backgroundColor: "#F5FCFF",' >> App.js
echo '  },' >> App.js
echo '  text: {' >> App.js
echo '    fontSize: 24,' >> App.js
echo '    fontWeight: "bold",' >> App.js
echo '    color: "#333",' >> App.js
echo '  },' >> App.js
echo '});' >> App.js
echo '' >> App.js
echo 'export default App;' >> App.js
# tsconfig.json と jest.config.js を削除
rm tsconfig.json
rm jest.config.js
# package.json から TypeScript 関連の依存関係を削除
npm uninstall @types/react @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript @types/react-test-renderer @types/react-test-renderer

# index.js → 認証
# App.tsx → メインの typescript

##################################################
# plugin installatioin (npm install --save-dev で install)
##################################################

# bluetooth プラグインのインストール
npm install --save-dev react-native-ble-manager
npm install --save-dev react-native-bluetooth-classic


##################################################
# build & run
##################################################

npx react-native start --verbose