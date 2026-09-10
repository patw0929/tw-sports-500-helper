<p align="center">
<img width="1024" height="500" alt="feature_graphic_1024x500" src="./play-store-assets/feature_graphic_1024x500.png" />
</p>

# 🏃 揮汗有禮・加碼券小幫手 (Taiwan Sports 500 Helper)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-black.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)
[![YouTube Shorts](https://img.shields.io/badge/YouTube_Shorts-宣傳短片-FF0000?logo=youtube&logoColor=white)](https://www.youtube.com/shorts/6kvV0BTkSwk)
[![Google Play](https://img.shields.io/badge/Google_Play-立即下載-414141?logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=me.patw.twsports500helper)

專為中華民國運動部「**115 年揮汗有禮・全民動起來**」（活動官網：[https://500.gov.tw/registrant/](https://500.gov.tw/registrant/)）加碼活動開發的輔助工具 App。

解決繁瑣的登入步驟與多帳號切換痛點，提供家庭多成員個資安全保險箱、一鍵自動填表登入「我的任務」、14 週各期任務倒數指引，以及官方 5 大合作通路（全家、7-ELEVEN、萊爾富、全聯、萬家福）優惠與兌換品項清單。

> 📺 **宣傳短片**：[觀看 YouTube Shorts 快速導覽（約 54 秒）](https://www.youtube.com/shorts/6kvV0BTkSwk)  
> 📲 **商店下載**：[Google Play 商店立即下載](https://play.google.com/store/apps/details?id=me.patw.twsports500helper)

---

## 📱 核心功能亮點

### 1. ⚡️ 一鍵全自動登入引擎

> 💡 **注意**：若揮汗有禮網站載入過慢時，自動登入可能失敗，請稍後重試。

- **跨步驟自動辨識與填表**：
  - 第一步（`/registrant/access`）：自動填入身分證字號並自動送出。
  - 第二步（會員登入頁）：自動選取民國出生年月日（年、月、日選單）、自動填入手機號碼，並自動觸發登入。
  - 直達「我的任務」快速上傳運動紀錄截圖或出示加碼券條碼。
- **深層 Spring Security CSRF 自動登出/重新登入**：
  - 首頁或瀏覽器內切換不同家庭成員時，自動取得 `_csrf` Token 進行背景安全登出，無縫重新登入新身分。
- **友善狀態浮動提示**：登入時於網頁頂部顯示 5 秒自動淡出提示，亦附帶關閉按鈕。

### 2. 🛡️ 帳號保險箱與多身分管理

- **支援家庭多成員管理**：可儲存「本人」、「配偶」、「長輩」、「子女」等多組身分，一鍵快速切換。
- **欄位格式防呆檢驗**：
  - 身分證字號檢查碼演算法驗證（防止輸入無效身分證）。
  - 民國出生年月份下拉（符合官方年滿 16 歲資格限制）。
  - 手機號碼格式防呆（09xxxxxxxx）。
- **硬體級純本機加密儲存**：
  - 使用 `expo-secure-store` 儲存於裝置本機硬體晶片（Keychain / Keystore），**絕不上傳任何第三方伺服器**。
  - 支援 Face ID / Touch ID / 指紋辨識生物防護鎖定；若裝置不具備或未錄入特徵則智慧自適應隱藏，避免困惑。

### 3. 🔍 運動紀錄截圖合格預檢（前端 OCR 診斷）

- **上傳只有一次機會，先幫您做基本檢查**：
  - 官方各期審核嚴格且上傳後無法自行抽換，透過預檢診斷在送出前先確認截圖是否合規，大幅降低遭官方退件風險。
- **純前端本機 OCR 引擎（零原生依賴）**：
  - 透過輕量隱形 WebView 結合 Tesseract.js (chi_tra + eng) 於本機端執行光學字元辨識，不需引入龐大或版本衝突的原生二進位模組，截圖絕不上傳外部伺服器。
- **智慧畫布影像優化（深色模式反轉與圖示淡化）**：
  - 自動偵測手機深色模式截圖並反轉為白底黑字，大幅提升中英文辨識度。
  - 自動淡化飽和彩色圖標（例如 Google Fit 的藍色跑鞋），根絕圖示被誤判為數字黏連至步數的問題。
- **基於運動部官方審核演算法改良與規則防退件**：
  - **精準排除非單日週期**：自動識別「每週目標」、「9月6日至12日」等週/月區間統計，標記日期錯誤並提醒官方僅接受當週單日或單次紀錄。
  - **防止小數點衝突**：智慧排除小數距離（如 5.17 公里）被誤判為日期的情形。

### 4. 📅 14 週程與三大任務指引儀表板

- **各週程倒數時鐘**：即時計算當前第幾期（共 14 期，9/1 ~ 11/30），動態顯示各期上傳剩餘時間。
- **三大任務標準解析**：
  1. 時間型：單次 30 分鐘以上（Apple 健身、Google Fit、Garmin 等）
  2. 步數型：單日累積 8,000 步以上（Pikmin Bloom、小米運動健康等）
  3. 距離型：健走/跑步 5km 或自行車 15km
- **截圖審核標準 Checklist**：提醒保留手機狀態列（時間、電量）與運動日期，減少退件風險。

### 5. 🛍️ 官方 5 大合作通路兌換商品清單

- 完整彙整官方指定通路之商品明細與加碼福利：
  - **全家便利商店**：308 項可兌換商品（50+3元加碼券，熱門：FMC茶飲、大冰拿鐵等）
  - **7-ELEVEN**：473 項可兌換商品（50+5元加碼券享10%購物金，熱門：鮮切水果、溫泉蛋、舒肥雞胸等）
  - **萊爾富**：168 項可兌換商品與超值商品券
  - **全聯福利中心**：9 大類健康生鮮運動補給（鮮乳、機能蛋、青花菜等）
  - **萬家福 / 樂家康**：18 大類運動器材與運動補給
- 支援「App 內瀏覽」與「外部瀏覽器開啟」雙模式，瀏覽器內亦提供橫向滑動快捷標籤。

---

## 🔒 隱私與安全保證

1. **零第三方後端**：本專案為完全開源、無後端架構的純客戶端 App，沒有架設任何收集個資的遠端伺服器。
2. **硬體安全儲存**：所有身分證字號、電話號碼與生日資訊僅存放於使用者本機裝置的安全加密空間（iOS Keychain / Android Keystore）。
3. **截圖分析純本地執行**：運動紀錄預檢功能使用隱形 WebView 於本地端進行 OCR 文字辨識與診斷，截圖影像與文字絕不上傳至任何外部伺服器。
4. **官網直接連線**：所有登入核驗與條碼出示，皆由 In-App 瀏覽器直接連線運動部官方伺服器（`500.gov.tw`）。

---

## ⚠️ 免責聲明 (Disclaimer)

- **非官方聲明**：本 App 非中華民國運動部官方所有，僅為開發者個人因使用方便而開發之第三方開源輔助工具。
- **活動規則以官方為主**：各期加碼券任務辦法、審核標準、發放期程與門市折抵規則，請一律以[運動部「揮汗有禮・全民動起來」官方網站](https://500.gov.tw/registrant/)最新公告為準。
- **門市折抵規定**：線下店家抵用時，必須於合作通路櫃檯出示活動官網即時動態條碼畫面，現場不得以紙本列印、手機截圖或翻拍畫面折抵。

---

## 🛠️ 開發與建置指引

### 環境需求

- [Node.js](https://nodejs.org/) (>= 18.x)
- [Expo CLI](https://docs.expo.dev/) (SDK 57)
- iOS 模擬器 (Xcode) 或 Android 模擬器 (Android Studio)，或實機安裝 [Expo Go](https://expo.dev/go)

### 安裝依賴

```bash
npm install
```

### 本地啟動

```bash
# 啟動 Expo 開發伺服器（終端會顯示 QR Code 供 Expo Go 掃描）
npx expo start

# 或直接在 iOS 模擬器開啟
npm run ios

# 或直接在 Android 模擬器開啟
npm run android
```

### 測試與代碼品質驗證

```bash
# 執行單元測試套件（規則引擎、OCR 容錯、截圖模擬）
npm test

# TypeScript 型別檢查
npm run typecheck

# Expo ESLint 代碼風格檢查
npm run lint

# Prettier 排版格式檢查
npm run format:check
```

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 授權開源。

開發作者：**patw**  
Email: [patw.hi@gmail.com](mailto:patw.hi@gmail.com)  
Website: [https://patw.me/](https://patw.me/)  
GitHub: [@patw0929](https://github.com/patw0929)
