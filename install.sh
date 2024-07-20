# node 環境必須
# react-native の install
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
npm install -g react-native@latest
npm install -g react-native-cli

# プロジェクト作成
npx react-native@latest init BlueToothTestProject
cd BlueToothTestProject

# bluetooth プラグインのインストール
npm install react-native-ble-plx # Bluetooth

# index.js → 認証
# App.tsx → メインの typescript

##################################################
# ios 開発 (Mac のみ可能)
##################################################

npm install --save-dev @react-native-community/cli-platform-ios # ios 関係の依存関係

# Ruby のインストール
sudo snap install ruby --classic

# CocoaPods のインストール
gem install cocoapods

# CocoaPods の Updates (古い場合)
sudo gem update cocoapods

# pod のパスを確認
find ~/.gem -name pod -type f

# pod リポジトリ更新
/home/tnishino/.gem/bin/pod repo update
cd ios
/home/tnishino/.gem/bin/pod install
cd ..

npx react-native run-ios

##################################################
# web 開発
##################################################

npx react-native start

##################################################
# Android 開発
##################################################

# Android Studio をインストールし、Android SDKをセットアップする必要あり
sudo snap install android-studio --classic
export ANDROID_STUDIO="/snap/bin/android-studio"

# Android Studio → SDK Manager (Tools > SDK Manager) → SDK Tools タブから以下をインストール
    # Android SDK Platform-Tools 34 (または最新版)
    # Android SDK Build-Tools
    # Android SDK Command-line Tools
    # Android Emulator

# Android Studio → ≡ → Tools → Device Manager → Emulator 起動

# ANDROID_HOME環境変数の設定
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
source ~/.bashrc

# Java のインストール
sudo apt update
sudo apt install default-jdk

# ADBのインストール
sudo apt-get install adb

# JDK のインストール
sudo apt-get install openjdk-17-jdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc

# android/gradle.properties に以下の行を追加
org.gradle.java.home=/usr/lib/jvm/java-17-openjdk-amd64

# local.propertiesファイルの作成
echo "sdk.dir=$HOME/Android/Sdk" > "./android/local.properties"
echo "java.home=/usr/lib/jvm/java-17-openjdk-amd64" >> "./android/local.properties"

# Android Emulatorのセットアップ: Android StudioでAVD (Android Virtual Device)を作成
# Gradleの設定: プロジェクトのandroid/gradleフォルダにgradleファイルが存在することを確認してください。存在しない場合は、手動でダウンロードして配置

# アセットの生成
mkdir -p android/app/src/main/assets
npx react-native bundle --entry-file index.js --platform android --dev false --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# React Native Doctorの実行
npx react-native doctor

# クリーンビルド
cd android
rm -rf ~/.gradle/caches/
./gradlew clean
cd ..
npx react-native bundle --entry-file index.js --platform android --dev false --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android
./gradlew assembleDebug
cd ..
adb kill-server
adb start-server
npx react-native run-android

# 実機
sudo usermod -aG plugdev $USER

# VENDER_ID の取得 (4桁)　<e.g.> Bus 002 Device 003: ID 18d1:4ee7 Google Inc. Nexus 4 (debug) -> 18d1
lsusb

# udevルールを設定
sudo gedit /etc/udev/rules.d/51-android.rules
# 以下を書き込む
    # SUBSYSTEM=="usb", ATTR{idVendor}=="VENDOR_ID", MODE="0666", GROUP="plugdev"

# udevルールを再読み込み
sudo udevadm control --reload-rules
sudo udevadm trigger

# server の再起動
adb kill-server
adb start-server

# usb 接続
adb usb
adb tcpip 5555

# 無線接続へ切り替え

# Android端末側の設定:
    # a. 開発者オプションを有効にします（設定 > システム > 詳細設定 > 開発者オプション）。
    # b. 「無線デバッグ」オプションをオンにします。
    # c. 「ワイヤレスデバッグを使用」を選択し、表示されるIPアドレスとポートをメモします。

# adb connect <IPアドレス>:5555
adb connect 192.168.68.50:5555
adb devices

# build
rm -rf ~/.gradle/caches/
rm -rf android/.gradle/
rm -rf android/app/build/
cd android
./gradlew clean
cd ..
npx react-native run-android --mode=release


cd android
rm -rf ~/.gradle/caches/
./gradlew clean
cd ..
npx react-native bundle --entry-file index.js --platform android --dev false --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android
./gradlew assembleDebug
cd ..
adb kill-server
adb start-server
npx react-native run-android --mode=release

# install
adb install -r android/app/build/outputs/apk/release/app-release.apk
