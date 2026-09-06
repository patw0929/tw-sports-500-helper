/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EDGE_BIN = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const OUTPUT_DIR = path.join(__dirname, '..', 'play-store-assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Direct public URLs from official website (no local files stored in repo)
const OFFICIAL_HOMEICON_URL = 'https://500.gov.tw/registrant/images/sportscoin/homeicon.png';
const OFFICIAL_MASCOT_URL =
  'https://500.gov.tw/registrant/images/sportscoin/customer-service-helper.webp';
const OFFICIAL_ACCESSIBILITY_URL =
  'https://500.gov.tw/registrant/images/sportAdmin/無障礙標章2.0AA級圖示.png';
const OFFICIAL_SERVICE_URL = 'https://500.gov.tw/registrant/images/sportAdmin/service.svg';

// Exact Theme Colors from src/constants/theme.ts
const THEME = {
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  background: '#FAF6F2',
  backgroundElement: '#F3EDE7',
  backgroundSelected: '#FFE8DF',
  cardBackground: '#FFFFFF',
  cardBorder: '#EFE3DA',
  primary: '#FF5E1E',
  primaryDark: '#D84315',
  primaryLight: '#FFF0EA',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#FF5E1E',
};

// Official 500.gov.tw tokens
const GOV = {
  orangeText: '#C04C08',
  orangeDark: '#A53F05',
  orangeSoft: '#FFF3E7',
  brown: '#3B2117',
  ink: '#4A2414',
  muted: '#6B4632',
  cream: '#FFF8EB',
  line: '#EADFD1',
  fieldLine: '#A1835F',
  bg: '#FBF6F0',
};

function getCommonStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Roboto", "Microsoft JhengHei", sans-serif;
      background: linear-gradient(180deg, #FBF8F5 0%, #F5ECE3 35%, #EDE3D8 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    /* Ambient Background Elements */
    .bg-circle-1 {
      position: absolute;
      top: -140px;
      right: -100px;
      width: 680px;
      height: 680px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 94, 30, 0.22) 0%, rgba(255, 94, 30, 0) 70%);
      pointer-events: none;
    }
    .bg-circle-2 {
      position: absolute;
      top: 160px;
      left: -160px;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 70%);
      pointer-events: none;
    }
    .bg-dots {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#D97706 0.8px, transparent 0.8px);
      background-size: 36px 36px;
      opacity: 0.14;
      pointer-events: none;
    }

    /* Marketing Header Section */
    .header-area {
      width: 100%;
      padding: 46px 60px 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 10;
    }
    .marketing-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 20px;
      background: rgba(255, 94, 30, 0.12);
      border: 1.5px solid rgba(255, 94, 30, 0.3);
      border-radius: 100px;
      color: ${THEME.primary};
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
      box-shadow: 0 4px 14px rgba(255, 94, 30, 0.08);
    }
    .marketing-title {
      font-size: 55px;
      font-weight: 900;
      color: #111827;
      line-height: 1.22;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    .marketing-title span {
      color: ${THEME.primary};
    }
    .marketing-subtitle {
      font-size: 23px;
      color: #4B5563;
      font-weight: 500;
      line-height: 1.4;
      max-width: 880px;
    }

    /* Modern Smartphone Frame */
    .phone-container {
      position: absolute;
      top: 270px;
      width: 864px;
      height: 1625px;
      z-index: 20;
    }
    .phone-frame {
      width: 100%;
      height: 100%;
      background: #1C1E22;
      border-radius: 54px;
      padding: 12px;
      box-shadow: 
        0 45px 100px -15px rgba(31, 41, 55, 0.38),
        0 20px 45px -5px rgba(255, 94, 30, 0.22),
        0 0 0 2px rgba(255, 255, 255, 0.25),
        0 0 0 7px #2B2E35;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    /* Device Status Bar */
    .status-bar {
      height: 44px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 28px;
      font-size: 17px;
      font-weight: 700;
      color: #111827;
      background: ${THEME.background};
      border-top-left-radius: 42px;
      border-top-right-radius: 42px;
      z-index: 30;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .punch-hole {
      width: 15px;
      height: 15px;
      background: #000000;
      border-radius: 50%;
      box-shadow: inset 0 0 2px rgba(255,255,255,0.4);
    }
    .status-right {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 15px;
      font-weight: 700;
    }
    .battery-wrap {
      display: flex;
      align-items: center;
      gap: 1px;
    }
    .battery-pill {
      width: 22px;
      height: 12px;
      border: 1.5px solid #111827;
      border-radius: 3px;
      padding: 1.5px;
      display: flex;
    }
    .battery-fill {
      width: 100%;
      height: 100%;
      background: #10B981;
      border-radius: 1px;
    }
    .battery-tip {
      width: 2px;
      height: 5px;
      background: #111827;
      border-radius: 0 1px 1px 0;
    }

    /* Actual App Screen Container */
    .app-screen {
      flex: 1;
      background: ${THEME.background};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      border-bottom-left-radius: 42px;
      border-bottom-right-radius: 42px;
    }

    .scroll-content {
      flex: 1;
      padding: 14px 20px 96px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }

    /* Bottom App Tabs (1:1 with app-tabs.tsx) */
    .tab-bar-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #FFFFFF;
      border-top: 1px solid ${THEME.cardBorder};
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 8px;
      border-bottom-left-radius: 42px;
      border-bottom-right-radius: 42px;
      z-index: 40;
    }
    .tab-bar {
      width: 100%;
      height: 76px;
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: ${THEME.tabIconDefault};
      text-decoration: none;
    }
    .tab-item.active {
      color: ${THEME.tabIconSelected};
      font-weight: 800;
    }
    .tab-item svg {
      width: 25px;
      height: 25px;
      fill: currentColor;
    }
    .gesture-home-bar {
      width: 140px;
      height: 4.5px;
      border-radius: 3px;
      background: #1F2937;
      opacity: 0.35;
      margin-bottom: 3px;
    }
  `;
}

// -------------------------------------------------------------
// Screen 1: 首頁 / 快速登入 (src/app/index.tsx 1:1)
// -------------------------------------------------------------
function renderScreen1() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${getCommonStyles()}

        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 22px;
          background: linear-gradient(135deg, #FF5E1E, #FF7A45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(255, 94, 30, 0.35);
        }
        .brand-text-group {
          flex: 1;
        }
        .brand-super {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: ${THEME.primary};
          text-transform: uppercase;
        }
        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 1px;
        }
        .brand-title {
          font-size: 19px;
          font-weight: 900;
          color: ${THEME.text};
          letter-spacing: -0.2px;
        }
        .unofficial-badge {
          padding: 2px 7px;
          border-radius: 6px;
          background: ${THEME.backgroundElement};
          border: 1px solid ${THEME.cardBorder};
          color: ${THEME.textSecondary};
          font-size: 11px;
          font-weight: 700;
        }
        .settings-btn {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${THEME.textSecondary};
        }

        .period-card {
          padding: 13px 18px;
          border-radius: 18px;
          border: 1.5px solid ${THEME.primary};
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: 0 4px 14px rgba(255, 94, 30, 0.08);
        }
        .period-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .period-badge {
          padding: 3px 10px;
          border-radius: 12px;
          background: ${THEME.primary};
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
        }
        .period-countdown {
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${THEME.primaryDark};
          font-size: 13px;
          font-weight: 700;
        }
        .period-date-text {
          font-size: 15px;
          font-weight: 800;
          color: ${THEME.text};
          margin-top: 2px;
        }
        .period-hint-text {
          font-size: 12px;
          line-height: 16px;
          color: ${THEME.textSecondary};
        }

        .profile-card {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 18px;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: ${THEME.textSecondary};
        }
        .manage-link {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 13px;
          font-weight: 700;
          color: ${THEME.primary};
        }
        .profile-details-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .avatar-circle {
          width: 46px;
          height: 46px;
          border-radius: 23px;
          background: ${THEME.primaryLight};
          color: ${THEME.primary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-text-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .profile-name-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-name {
          font-size: 17.5px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .profile-label-pill {
          padding: 2px 8px;
          border-radius: 8px;
          background: ${THEME.backgroundElement};
          color: ${THEME.textSecondary};
          font-size: 11px;
          font-weight: 600;
        }
        .profile-subtext {
          font-size: 13px;
          font-weight: 500;
          color: ${THEME.textSecondary};
        }
        .profile-date-small {
          font-size: 11.5px;
          color: ${THEME.textMuted};
        }
        .switch-bar {
          display: flex;
          align-items: center;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 9px;
          gap: 8px;
        }
        .switch-bar-label {
          font-size: 12px;
          color: ${THEME.textMuted};
          white-space: nowrap;
        }
        .switch-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }
        .chip {
          padding: 5px 12px;
          border-radius: 12px;
          border: 1px solid ${THEME.cardBorder};
          font-size: 12px;
          font-weight: 700;
          color: ${THEME.textSecondary};
          white-space: nowrap;
          background: transparent;
        }
        .chip.active {
          border-color: ${THEME.primary};
          background: ${THEME.primaryLight};
          color: ${THEME.primary};
        }

        .main-login-btn {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          border-radius: 18px;
          background: ${THEME.primary};
          color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(255, 94, 30, 0.35);
          gap: 14px;
        }
        .main-login-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main-login-text-wrap {
          flex: 1;
        }
        .main-login-title {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.2px;
          line-height: 1.3;
        }
        .main-login-subtitle {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 2px;
        }

        .section-heading {
          font-size: 15px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }
        .grid-card {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 15px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .grid-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }
        .grid-card-title {
          font-size: 13.5px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .grid-card-desc {
          font-size: 10.5px;
          color: ${THEME.textSecondary};
          line-height: 14px;
        }

        /* Vendors showcase from index.tsx */
        .vendor-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .vendor-more-link {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 12px;
          font-weight: 700;
          color: ${THEME.primary};
        }
        .vendor-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .vendor-card {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 14px;
          padding: 9px 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vendor-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vendor-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: ${THEME.primaryLight};
          color: ${THEME.primary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vendor-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vendor-name {
          font-size: 13px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .vendor-tag {
          font-size: 10px;
          font-weight: 800;
          color: ${THEME.primary};
          background: ${THEME.primaryLight};
          padding: 1px 5px;
          border-radius: 5px;
        }
        .vendor-count {
          font-size: 10.5px;
          color: ${THEME.textSecondary};
          margin-top: 1px;
        }
        .vendor-view-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 8px;
          background: ${THEME.backgroundElement};
          color: ${THEME.primary};
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Security Notice */
        .security-notice {
          background: ${THEME.backgroundElement};
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .security-notice-title {
          font-size: 12.5px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .security-notice-desc {
          font-size: 10.5px;
          color: ${THEME.textSecondary};
          line-height: 15px;
          margin-top: 2px;
        }

        .disclaimer-box {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid ${THEME.cardBorder};
          font-size: 10.5px;
          color: ${THEME.textMuted};
          line-height: 14px;
        }
      </style>
    </head>
    <body>
      <div class="bg-circle-1"></div>
      <div class="bg-circle-2"></div>
      <div class="bg-dots"></div>

      <div class="header-area">
        <div class="marketing-badge">⚡️ 快速登入・省時神器</div>
        <h1 class="marketing-title">全家身分 <span>一鍵快速切換</span></h1>
        <p class="marketing-subtitle">完美支援多帳號管理與自動登入，加碼券輕鬆領取！</p>
      </div>

      <div class="phone-container">
        <div class="phone-frame">
          <div class="status-bar">
            <span>09:41</span>
            <div class="punch-hole"></div>
            <div class="status-right">
              <span>5G</span>
              <svg width="17" height="13" viewBox="0 0 17 14" fill="currentColor">
                <rect x="0" y="10" width="3" height="4" rx="1"/>
                <rect x="4.5" y="7" width="3" height="7" rx="1"/>
                <rect x="9" y="4" width="3" height="10" rx="1"/>
                <rect x="13.5" y="0" width="3" height="14" rx="1"/>
              </svg>
              <div class="battery-wrap">
                <div class="battery-pill"><div class="battery-fill"></div></div>
                <div class="battery-tip"></div>
              </div>
            </div>
          </div>

          <div class="app-screen">
            <div class="scroll-content">
              
              <!-- Brand Row -->
              <div class="brand-row">
                <div class="logo-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 7 5 9.5 5 14a7 7 0 0 0 14 0c0-3.5-3-7-7-12zm0 17a5 5 0 0 1-5-5c0-2.3 1.8-4.5 3.5-6.5C11.3 9.4 12 11.5 12 13a1 1 0 0 0 2 0c0-1.5-.7-3.5-1.5-5.5C14.2 9.5 16 11.7 16 14a5 5 0 0 1-5 5z"/></svg>
                </div>
                <div class="brand-text-group">
                  <div class="brand-super">運動部 115 年加碼活動</div>
                  <div class="brand-title-row">
                    <span class="brand-title">揮汗有禮・加碼券小幫手</span>
                    <span class="unofficial-badge">非官方</span>
                  </div>
                </div>
                <div class="settings-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
              </div>

              <!-- Period Banner -->
              <div class="period-card">
                <div class="period-card-top">
                  <div class="period-badge">第 1 期</div>
                  <div class="period-countdown">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>剩餘 8 小時 30 分</span>
                  </div>
                </div>
                <div class="period-date-text">09/01 (二) 10:00 - 09/06 (日) 23:59</div>
                <div class="period-hint-text">每週每人限上傳一次運動截圖，審核通過即享 50 元加碼券！</div>
              </div>

              <!-- Active Profile Card -->
              <div class="profile-card">
                <div class="card-header-row">
                  <span class="card-section-title">登入身分</span>
                  <div class="manage-link">
                    <span>管理帳號</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>

                <div class="profile-details-row">
                  <div class="avatar-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <div class="profile-text-col">
                    <div class="profile-name-line">
                      <span class="profile-name">王大明</span>
                      <span class="profile-label-pill">本人</span>
                    </div>
                    <div class="profile-subtext">A123***789 • 0912***456</div>
                    <div class="profile-date-small">民國 77 年 05 月 12 日出生</div>
                  </div>
                </div>

                <div class="switch-bar">
                  <span class="switch-bar-label">快速切換：</span>
                  <div class="switch-chips">
                    <div class="chip active">王大明</div>
                    <div class="chip">李小華</div>
                    <div class="chip">王小寶</div>
                    <div class="chip">陳美麗</div>
                  </div>
                </div>
              </div>

              <!-- One-Click Login Button -->
              <div class="main-login-btn">
                <div class="main-login-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                </div>
                <div class="main-login-text-wrap">
                  <div class="main-login-title">一鍵快速登入「我的任務」</div>
                  <div class="main-login-subtitle">自動填入 王大明 的身分證、生日與手機</div>
                </div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>

              <!-- Quick Shortcuts 2x2 Grid -->
              <div class="section-heading">常用功能捷徑</div>
              <div class="grid-container">
                <div class="grid-card">
                  <div class="grid-icon-circle" style="background:#FFF0EA; color:#FF5E1E;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2A7 7 0 0 0 3 12c0 2.6 1.4 4.8 3.5 6"></path><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line></svg>
                  </div>
                  <div class="grid-card-title">上傳運動紀錄</div>
                  <div class="grid-card-desc">截圖上傳與審核進度查詢</div>
                </div>

                <div class="grid-card">
                  <div class="grid-icon-circle" style="background:#FEF3C7; color:#F59E0B;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                  </div>
                  <div class="grid-card-title">兌換加碼券</div>
                  <div class="grid-card-desc">超商及門市即時動態條碼</div>
                </div>

                <div class="grid-card">
                  <div class="grid-icon-circle" style="background:#ECFDF5; color:#10B981;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <div class="grid-card-title">截圖合格規範</div>
                  <div class="grid-card-desc">狀態列、日期與數據規範</div>
                </div>

                <div class="grid-card">
                  <div class="grid-icon-circle" style="background:#EFF6FF; color:#3B82F6;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div class="grid-card-title">14 週任務時程</div>
                  <div class="grid-card-desc">查看全活動各期起訖日</div>
                </div>
              </div>

              <!-- Partner Showcase -->
              <div class="vendor-section-header">
                <span class="section-heading">各商家兌換商品列表</span>
                <div class="vendor-more-link">
                  <span>查看完整說明</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>

              <div class="vendor-list">
                <div class="vendor-card">
                  <div class="vendor-left">
                    <div class="vendor-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <div>
                      <div class="vendor-title-row">
                        <span class="vendor-name">全家便利商店</span>
                        <span class="vendor-tag">50 + 3 元</span>
                      </div>
                      <div class="vendor-count">308 項可兌換商品</div>
                    </div>
                  </div>
                  <div class="vendor-view-btn">看品項 ›</div>
                </div>

                <div class="vendor-card">
                  <div class="vendor-left">
                    <div class="vendor-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <div>
                      <div class="vendor-title-row">
                        <span class="vendor-name">7-ELEVEn</span>
                        <span class="vendor-tag">50 + 5 元</span>
                      </div>
                      <div class="vendor-count">473 項可兌換商品</div>
                    </div>
                  </div>
                  <div class="vendor-view-btn">看品項 ›</div>
                </div>

                <div class="vendor-card">
                  <div class="vendor-left">
                    <div class="vendor-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <div>
                      <div class="vendor-title-row">
                        <span class="vendor-name">萊爾富</span>
                        <span class="vendor-tag">50 元券</span>
                      </div>
                      <div class="vendor-count">168 項可兌換商品 + 加碼</div>
                    </div>
                  </div>
                  <div class="vendor-view-btn">看品項 ›</div>
                </div>

                <div class="vendor-card">
                  <div class="vendor-left">
                    <div class="vendor-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <div>
                      <div class="vendor-title-row">
                        <span class="vendor-name">全聯福利中心</span>
                        <span class="vendor-tag">50 元券</span>
                      </div>
                      <div class="vendor-count">9 大類健康生鮮品項</div>
                    </div>
                  </div>
                  <div class="vendor-view-btn">看品項 ›</div>
                </div>
              </div>

              <!-- Security notice -->
              <div class="security-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${THEME.success}" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                <div>
                  <div class="security-notice-title">本機硬體安全加密保證</div>
                  <div class="security-notice-desc">所有身分證與電話資訊僅保存在本機裝置安全晶片（Keychain / Keystore），絕不上傳任何第三方伺服器。</div>
                </div>
              </div>

              <!-- Unofficial Disclaimer Box -->
              <div class="disclaimer-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${THEME.textMuted}" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>免責聲明：本 App 非官方所有，僅為開發者個人方便使用開發，請以官方規則為主。</span>
              </div>

            </div>

            <!-- Bottom Tab Bar -->
            <div class="tab-bar-container">
              <div class="tab-bar">
                <div class="tab-item active">
                  <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  <span>快速登入</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <span>官方網頁</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                  <span>任務週程</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <span>帳號管理</span>
                </div>
              </div>
              <div class="gesture-home-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -------------------------------------------------------------
// Screen 2: 官方網頁 / 自動填寫 (100% 貼近揮汗有禮真實官方網站 500.gov.tw)
// -------------------------------------------------------------
function renderScreen2() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${getCommonStyles()}

        /* In-App Browser Navigation Chrome */
        .top-bar {
          background: #FFFFFF;
          border-bottom: 1px solid ${THEME.cardBorder};
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
        }
        .nav-btn-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${THEME.text};
        }
        .icon-btn.disabled {
          color: ${THEME.textMuted};
        }
        .profile-pill {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${THEME.primaryLight};
          border: 1px solid ${THEME.primary};
          padding: 6px 12px;
          border-radius: 18px;
        }
        .profile-pill-text {
          flex: 1;
          font-size: 13px;
          font-weight: 700;
          color: ${THEME.primary};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .autofill-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: ${THEME.primary};
          padding: 7px 13px;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 800;
          box-shadow: 0 4px 10px rgba(255, 94, 30, 0.25);
        }

        /* Shortcuts ribbon */
        .shortcuts-bar {
          background: ${THEME.backgroundElement};
          padding: 7px 14px;
          display: flex;
          gap: 7px;
          overflow-x: auto;
          border-bottom: 1px solid ${THEME.cardBorder};
          z-index: 20;
        }
        .shortcut-tag {
          padding: 4px 11px;
          border-radius: 12px;
          background: transparent;
          font-size: 11.5px;
          font-weight: 600;
          color: ${THEME.textSecondary};
          white-space: nowrap;
        }
        .shortcut-tag.active {
          background: #FFFFFF;
          border: 1px solid ${THEME.primary};
          color: ${THEME.primary};
          font-weight: 800;
        }

        /* Official 500.gov.tw Web View Container */
        .webview-container {
          flex: 1;
          background: ${GOV.bg};
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          padding-bottom: 96px;
        }

        /* Floating Toast from autofill-engine.ts */
        .app-floating-toast {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          background: ${THEME.primary};
          color: #FFFFFF;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          box-shadow: 0 8px 24px rgba(255, 94, 30, 0.45), 0 2px 8px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }
        .toast-close {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }

        /* Official Site Header */
        .official-site-header {
          background: #FFFFFF;
          border-bottom: 1px solid ${GOV.line};
          padding: 9px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(90, 50, 15, 0.05);
        }
        .official-logo-img {
          height: 40px;
          width: auto;
          display: block;
        }
        .official-menu-btn {
          width: 36px;
          height: 36px;
          border: 1px solid ${GOV.line};
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .official-menu-btn span {
          width: 18px;
          height: 2px;
          background: ${GOV.brown};
          border-radius: 1px;
        }

        /* Official Main Form Card */
        .official-main {
          padding: 16px 18px 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .official-card {
          background: #FFFFFF;
          border-radius: 22px;
          padding: 24px 22px;
          box-shadow: 0 10px 25px rgba(90, 50, 15, 0.08);
          border: 1px solid rgba(234, 223, 209, 0.6);
        }
        .official-step-pill {
          display: inline-block;
          margin-bottom: 12px;
          padding: 4px 14px;
          border-radius: 999px;
          background: ${GOV.orangeSoft};
          color: ${GOV.orangeDark};
          font-size: 13px;
          font-weight: 800;
        }
        .official-h1 {
          font-size: 23px;
          font-weight: 900;
          color: ${GOV.brown};
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .official-lead {
          font-size: 13.5px;
          color: ${GOV.muted};
          line-height: 19px;
          margin-bottom: 20px;
        }

        .official-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 22px;
        }
        .official-label {
          font-size: 14.5px;
          font-weight: 700;
          color: ${GOV.ink};
        }
        .official-required {
          color: ${GOV.orangeText};
          margin-left: 2px;
        }
        .official-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .official-input {
          width: 100%;
          height: 52px;
          padding: 10px 16px;
          border: 2px solid #005FCC;
          border-radius: 14px;
          background: #FFFFFF;
          color: ${GOV.brown};
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.5px;
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.12);
        }
        .official-autofill-badge {
          position: absolute;
          right: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 8px;
          background: #E6F5EC;
          color: #1C6B3F;
          font-size: 12px;
          font-weight: 800;
        }

        .official-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .official-btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 50px;
          background: ${GOV.orangeText};
          border: none;
          border-radius: 999px;
          color: #FFFFFF;
          font-size: 16.5px;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(92, 52, 21, 0.18);
        }
        .official-arrow {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #FFFFFF;
          color: ${GOV.orangeText};
          font-size: 16px;
          line-height: 1;
        }
        .official-btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50px;
          background: #FFFFFF;
          border: 1.5px solid ${GOV.orangeText};
          border-radius: 999px;
          color: ${GOV.orangeText};
          font-size: 15.5px;
          font-weight: 800;
        }

        /* Official Instruction Notice Card */
        .official-notice-card {
          background: #FFFBF5;
          border: 1px solid ${GOV.line};
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .notice-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: ${GOV.orangeDark};
        }
        .notice-text {
          font-size: 12px;
          color: ${GOV.muted};
          line-height: 17px;
        }

        /* Official Site Footer */
        .official-site-footer {
          margin-top: 14px;
          padding: 16px 20px 0;
          border-top: 1px solid ${GOV.line};
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .footer-row {
          font-size: 11.5px;
          color: ${GOV.muted};
          line-height: 17px;
        }
        .footer-row a {
          color: ${GOV.orangeText};
          text-decoration: underline;
          font-weight: 700;
        }
        .footer-badges {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .footer-badge-img {
          height: 26px;
          width: auto;
        }
        .footer-service-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          color: ${GOV.brown};
        }
        .footer-service-icon {
          width: 22px;
          height: 22px;
        }
        .footer-copyright {
          font-size: 10.5px;
          color: #8C6A53;
          margin-top: 6px;
          line-height: 15px;
        }

        /* Cute Online Customer Service Helper Mascot in bottom right */
        .customer-service-helper {
          position: absolute;
          right: 14px;
          bottom: -15px;
          width: 90px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          z-index: 10;
        }
        .customer-service-close {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4B5563;
          margin-bottom: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .customer-service-img {
          width: 82px;
          height: auto;
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="bg-circle-1"></div>
      <div class="bg-circle-2"></div>
      <div class="bg-dots"></div>

      <div class="header-area">
        <div class="marketing-badge">✨ 內建專屬瀏覽器</div>
        <h1 class="marketing-title">身分資料 <span>一秒自動帶入</span></h1>
        <p class="marketing-subtitle">直達官方登入頁，身分證與生日快速填寫，告別手忙腳亂！</p>
      </div>

      <div class="phone-container">
        <div class="phone-frame">
          <div class="status-bar">
            <span>09:41</span>
            <div class="punch-hole"></div>
            <div class="status-right">
              <span>5G</span>
              <svg width="17" height="13" viewBox="0 0 17 14" fill="currentColor">
                <rect x="0" y="10" width="3" height="4" rx="1"/>
                <rect x="4.5" y="7" width="3" height="7" rx="1"/>
                <rect x="9" y="4" width="3" height="10" rx="1"/>
                <rect x="13.5" y="0" width="3" height="14" rx="1"/>
              </svg>
              <div class="battery-wrap">
                <div class="battery-pill"><div class="battery-fill"></div></div>
                <div class="battery-tip"></div>
              </div>
            </div>
          </div>

          <div class="app-screen">
            <!-- App Browser Top Bar -->
            <div class="top-bar">
              <div class="nav-btn-group">
                <div class="icon-btn disabled">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </div>
                <div class="icon-btn disabled">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
                <div class="icon-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </div>
              </div>

              <div class="profile-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                <span class="profile-pill-text">王大明 (A123***789)</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>

              <div class="autofill-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                <span>自動填寫</span>
              </div>
            </div>

            <!-- Shortcuts Ribbon -->
            <div class="shortcuts-bar">
              <div class="shortcut-tag active">登入 / 任務</div>
              <div class="shortcut-tag">🏪 全家 (308項)</div>
              <div class="shortcut-tag">🏪 7-11 (473項)</div>
              <div class="shortcut-tag">🏪 萊爾富 (168項)</div>
              <div class="shortcut-tag">🛒 全聯 (9大類)</div>
              <div class="shortcut-tag">活動首頁</div>
            </div>

            <!-- Webview Container with 100% Real 500.gov.tw Content -->
            <div class="webview-container">

              <!-- Official Header with Real Logo -->
              <div class="official-site-header">
                <img src="${OFFICIAL_HOMEICON_URL}" class="official-logo-img" alt="揮汗有禮・全民動起來 活動首頁">
                <div class="official-menu-btn">
                  <span></span><span></span><span></span>
                </div>
              </div>

              <!-- Floating In-App Toast from autofill-engine.ts -->
              <div class="app-floating-toast">
                <span>⚡️ <b>加碼券小幫手</b>：已為 王大明 自動填寫身分證號！</span>
                <div class="toast-close">✕</div>
              </div>

              <!-- Official Form Card -->
              <div class="official-main">
                <div class="official-card">
                  <div class="official-step-pill">步驟 1 / 2</div>
                  <h1 class="official-h1">註冊帳號/進入「我的任務」</h1>
                  <p class="official-lead">請輸入身分證號，我們將帶您進入登記或會員登入流程。</p>

                  <div class="official-field">
                    <label class="official-label">身分證號<span class="official-required">*</span></label>
                    <div class="official-input-box">
                      <input type="text" class="official-input" value="A123456789" readonly>
                      <div class="official-autofill-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>已自動帶入</span>
                      </div>
                    </div>
                  </div>

                  <div class="official-actions">
                    <div class="official-btn-primary">
                      <span>確認</span>
                      <span class="official-arrow">→</span>
                    </div>
                    <div class="official-btn-secondary">返回活動首頁</div>
                  </div>
                </div>

                <!-- Official Instructions Box -->
                <div class="official-notice-card">
                  <div class="notice-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span>貼心說明事項</span>
                  </div>
                  <div class="notice-text">
                    • 本活動對象為年滿 16 歲國民（民國 98 年 12 月 31 日前出生者）。<br>
                    • 加碼券小幫手支援智慧身分帶入，進入系統後即可查詢每週上傳與領券進度！
                  </div>
                </div>
              </div>

              <!-- Official Footer with Service Numbers and Mascot -->
              <div class="official-site-footer">
                <div class="footer-row">客服電話：<a href="#">02-7752-3658</a></div>
                <div class="footer-row">客服時間：週一至週日 0900 - 1800（12:00-13:00 暫停服務）</div>
                <div class="footer-row">本網站支援 Edge、Google Chrome、Firefox 與 Safari 瀏覽器</div>
                <div class="footer-row">最佳解析度：1920*1080｜地址：臺北市中山區朱崙街20號</div>

                <div class="footer-badges">
                  <img src="${OFFICIAL_ACCESSIBILITY_URL}" class="footer-badge-img" alt="無障礙標章2.0">
                  <div class="footer-service-pill">
                    <img src="${OFFICIAL_SERVICE_URL}" class="footer-service-icon" alt="">
                    <span>線上客服</span>
                  </div>
                </div>

                <div class="footer-copyright">運動部 2026©版權所有（所有圖資未經本部同意不得轉載及重製）</div>

                <!-- Customer Service Helper Mascot -->
                <div class="customer-service-helper">
                  <div class="customer-service-close">×</div>
                  <img src="${OFFICIAL_MASCOT_URL}" class="customer-service-img" alt="有問題請點我">
                </div>
              </div>

            </div>

            <!-- Bottom Tab Bar -->
            <div class="tab-bar-container">
              <div class="tab-bar">
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  <span>快速登入</span>
                </div>
                <div class="tab-item active">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <span>官方網頁</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                  <span>任務週程</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <span>帳號管理</span>
                </div>
              </div>
              <div class="gesture-home-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -------------------------------------------------------------
// Screen 3: 任務週程 (src/app/tasks.tsx 1:1)
// -------------------------------------------------------------
function renderScreen3() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${getCommonStyles()}

        .tasks-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .super-title {
          font-size: 13px;
          font-weight: 800;
          color: ${THEME.primary};
          text-transform: uppercase;
        }
        .main-title {
          font-size: 22px;
          font-weight: 900;
          color: ${THEME.text};
          letter-spacing: -0.3px;
        }
        .tasks-subtitle {
          font-size: 12px;
          color: ${THEME.textSecondary};
          line-height: 16px;
          margin-top: 1px;
        }

        .segment-container {
          display: flex;
          background: ${THEME.backgroundElement};
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .segment-btn {
          flex: 1;
          text-align: center;
          padding: 7px 0;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          color: ${THEME.textSecondary};
          background: transparent;
        }
        .segment-btn.active {
          background: #FFFFFF;
          color: ${THEME.primary};
          font-weight: 800;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .section-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .section-subtitle {
          font-size: 11px;
          color: ${THEME.textSecondary};
          line-height: 15px;
        }

        .period-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .period-item {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 13px;
          padding: 9px 13px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .period-item.is-current {
          border: 2px solid ${THEME.primary};
          background: ${THEME.primaryLight};
        }
        .period-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .period-item-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .period-number-pill {
          padding: 3px 8px;
          border-radius: 7px;
          background: ${THEME.backgroundElement};
          color: ${THEME.textSecondary};
          font-size: 11px;
          font-weight: 800;
        }
        .period-item.is-current .period-number-pill {
          background: ${THEME.primary};
          color: #FFFFFF;
        }
        .period-date {
          font-size: 13px;
          font-weight: 700;
          color: ${THEME.text};
        }
        .current-status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: ${THEME.primary};
          color: #FFFFFF;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 800;
        }
        .status-badge {
          padding: 3px 8px;
          border-radius: 6px;
          background: ${THEME.backgroundElement};
          color: ${THEME.textSecondary};
          font-size: 10.5px;
          font-weight: 700;
        }
        .active-week-notice {
          background: ${THEME.cardBackground};
          border-radius: 8px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: ${THEME.primaryDark};
        }
      </style>
    </head>
    <body>
      <div class="bg-circle-1"></div>
      <div class="bg-circle-2"></div>
      <div class="bg-dots"></div>

      <div class="header-area">
        <div class="marketing-badge">📅 14 週完整時程</div>
        <h1 class="marketing-title">活動週程 <span>重要日程不漏接</span></h1>
        <p class="marketing-subtitle">即時掌握每期起訖日與上傳截止倒數，掌握第一手加碼好康！</p>
      </div>

      <div class="phone-container">
        <div class="phone-frame">
          <div class="status-bar">
            <span>09:41</span>
            <div class="punch-hole"></div>
            <div class="status-right">
              <span>5G</span>
              <svg width="17" height="13" viewBox="0 0 17 14" fill="currentColor">
                <rect x="0" y="10" width="3" height="4" rx="1"/>
                <rect x="4.5" y="7" width="3" height="7" rx="1"/>
                <rect x="9" y="4" width="3" height="10" rx="1"/>
                <rect x="13.5" y="0" width="3" height="14" rx="1"/>
              </svg>
              <div class="battery-wrap">
                <div class="battery-pill"><div class="battery-fill"></div></div>
                <div class="battery-tip"></div>
              </div>
            </div>
          </div>

          <div class="app-screen">
            <div class="scroll-content">
              
              <div class="tasks-header">
                <div class="super-title">運動部 115 年揮汗有禮</div>
                <div class="main-title">任務辦法與 14 週時程</div>
                <div class="tasks-subtitle">每週完成任一項指定任務並上傳截圖，審核通過即可領取加碼好禮！</div>
              </div>

              <!-- Segmented Control matching tasks.tsx -->
              <div class="segment-container">
                <div class="segment-btn active">14 週時程表</div>
                <div class="segment-btn">三大任務標準</div>
                <div class="segment-btn">好禮兌換通路</div>
              </div>

              <div class="section-wrapper">
                <div>
                  <div class="section-title">全活動 14 週時程（9/1 ~ 11/30）</div>
                  <div class="section-subtitle">每週一 00:00 起至週日 24:00 止為計算週期；審核時間約 5 個工作日。</div>
                </div>

                <div class="period-list">
                  <!-- Period 1: Current -->
                  <div class="period-item is-current">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 1 期</div>
                        <div class="period-date">09/01 (二) ~ 09/06 (日)</div>
                      </div>
                      <div class="current-status-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 7 5 9.5 5 14a7 7 0 0 0 14 0c0-3.5-3-7-7-12z"/></svg>
                        <span>本週進行中</span>
                      </div>
                    </div>
                    <div class="active-week-notice">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${THEME.primary}" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>距離上傳截止剩餘：0 天 8 小時，請把握時間！</span>
                    </div>
                  </div>

                  <!-- Period 2 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 2 期</div>
                        <div class="period-date">09/07 (一) ~ 09/13 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 3 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 3 期</div>
                        <div class="period-date">09/14 (一) ~ 09/20 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 4 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 4 期</div>
                        <div class="period-date">09/21 (一) ~ 09/27 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 5 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 5 期</div>
                        <div class="period-date">09/28 (一) ~ 10/04 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 6 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 6 期</div>
                        <div class="period-date">10/05 (一) ~ 10/11 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 7 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 7 期</div>
                        <div class="period-date">10/12 (一) ~ 10/18 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 8 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 8 期</div>
                        <div class="period-date">10/19 (一) ~ 10/25 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 9 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 9 期</div>
                        <div class="period-date">10/26 (一) ~ 11/01 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 10 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 10 期</div>
                        <div class="period-date">11/02 (一) ~ 11/08 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 11 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 11 期</div>
                        <div class="period-date">11/09 (一) ~ 11/15 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 12 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 12 期</div>
                        <div class="period-date">11/16 (一) ~ 11/22 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>

                  <!-- Period 13 -->
                  <div class="period-item">
                    <div class="period-item-header">
                      <div class="period-item-title-group">
                        <div class="period-number-pill">第 13 期</div>
                        <div class="period-date">11/23 (一) ~ 11/29 (日)</div>
                      </div>
                      <div class="status-badge">尚未開放</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Bottom Tab Bar -->
            <div class="tab-bar-container">
              <div class="tab-bar">
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  <span>快速登入</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <span>官方網頁</span>
                </div>
                <div class="tab-item active">
                  <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                  <span>任務週程</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <span>帳號管理</span>
                </div>
              </div>
              <div class="gesture-home-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -------------------------------------------------------------
// Screen 4: 帳號管理 (src/app/accounts.tsx 1:1)
// -------------------------------------------------------------
function renderScreen4() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${getCommonStyles()}

        .accounts-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .super-title {
          font-size: 13px;
          font-weight: 800;
          color: ${THEME.primary};
          text-transform: uppercase;
        }
        .main-title {
          font-size: 22px;
          font-weight: 900;
          color: ${THEME.text};
          letter-spacing: -0.3px;
        }
        .accounts-subtitle {
          font-size: 12px;
          color: ${THEME.textSecondary};
          line-height: 16px;
          margin-top: 1px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: ${THEME.primary};
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 4px 10px rgba(255, 94, 30, 0.2);
        }

        .profiles-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .profile-card {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .profile-card.is-default {
          border: 1.5px solid ${THEME.primary};
        }
        .profile-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .profile-card-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-card-name {
          font-size: 16px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .label-badge {
          padding: 2px 8px;
          border-radius: 6px;
          background: ${THEME.backgroundElement};
          color: ${THEME.textSecondary};
          font-size: 11px;
          font-weight: 600;
        }
        .default-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 6px;
          background: ${THEME.primaryLight};
          color: ${THEME.primary};
          font-size: 11px;
          font-weight: 800;
        }
        .actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${THEME.textMuted};
        }
        .action-icon {
          display: flex;
          align-items: center;
        }

        .profile-info-box {
          background: ${THEME.backgroundElement};
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .info-line {
          font-size: 11.5px;
          color: ${THEME.textSecondary};
        }
        .info-line strong {
          color: ${THEME.text};
          font-weight: 800;
        }

        .set-default-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px;
          border-radius: 8px;
          border: 1px solid ${THEME.cardBorder};
          font-size: 11px;
          color: ${THEME.textSecondary};
          font-weight: 600;
        }

        /* Settings Card & Biometrics */
        .settings-card {
          background: ${THEME.cardBackground};
          border: 1px solid ${THEME.cardBorder};
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .setting-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .setting-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: ${THEME.primaryLight};
          color: ${THEME.primary};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .setting-title {
          font-size: 14px;
          font-weight: 800;
          color: ${THEME.text};
        }
        .setting-desc {
          font-size: 10.5px;
          color: ${THEME.textSecondary};
          margin-top: 1px;
        }
        .switch-toggle {
          width: 44px;
          height: 25px;
          background: ${THEME.primary};
          border-radius: 20px;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .switch-knob {
          width: 21px;
          height: 21px;
          background: #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Official resources link row */
        .link-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid ${THEME.backgroundElement};
        }
        .link-row:last-child {
          border-bottom: none;
        }
        .link-row-text {
          font-size: 12px;
          font-weight: 700;
          color: ${THEME.text};
        }
        .link-subtext {
          font-size: 10px;
          color: ${THEME.textMuted};
        }

        .author-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .author-badge {
          padding: 2px 7px;
          border-radius: 6px;
          background: ${THEME.backgroundElement};
          border: 1px solid ${THEME.cardBorder};
          color: ${THEME.textSecondary};
          font-size: 10.5px;
          font-weight: 700;
        }
        .author-intro {
          font-size: 11px;
          color: ${THEME.textSecondary};
          line-height: 15px;
        }
        .github-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px;
          border-radius: 10px;
          background: ${THEME.backgroundElement};
          border: 1px solid ${THEME.cardBorder};
          font-size: 11.5px;
          font-weight: 700;
          color: ${THEME.text};
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="bg-circle-1"></div>
      <div class="bg-circle-2"></div>
      <div class="bg-dots"></div>

      <div class="header-area">
        <div class="marketing-badge">🛡️ 本機安全加密</div>
        <h1 class="marketing-title">純本機保護 <span>個資絕不上傳</span></h1>
        <p class="marketing-subtitle">硬體晶片級防護，支援指紋與 Face ID，守護全家人隱私！</p>
      </div>

      <div class="phone-container">
        <div class="phone-frame">
          <div class="status-bar">
            <span>09:41</span>
            <div class="punch-hole"></div>
            <div class="status-right">
              <span>5G</span>
              <svg width="17" height="13" viewBox="0 0 17 14" fill="currentColor">
                <rect x="0" y="10" width="3" height="4" rx="1"/>
                <rect x="4.5" y="7" width="3" height="7" rx="1"/>
                <rect x="9" y="4" width="3" height="10" rx="1"/>
                <rect x="13.5" y="0" width="3" height="14" rx="1"/>
              </svg>
              <div class="battery-wrap">
                <div class="battery-pill"><div class="battery-fill"></div></div>
                <div class="battery-tip"></div>
              </div>
            </div>
          </div>

          <div class="app-screen">
            <div class="scroll-content">
              
              <!-- Header -->
              <div class="accounts-header">
                <div class="super-title">安全憑證管理</div>
                <div class="main-title">帳號保險箱與設定</div>
                <div class="accounts-subtitle">安全儲存您與家庭成員的身分證字號及生日，隨時一鍵自動登入官方系統。</div>
              </div>

              <!-- Profiles Section -->
              <div class="section-header-row">
                <div class="section-title">已儲存身分證資料 (3)</div>
                <div class="add-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>新增帳號</span>
                </div>
              </div>

              <div class="profiles-list">
                <!-- Profile 1 (Default) -->
                <div class="profile-card is-default">
                  <div class="profile-card-top">
                    <div class="profile-card-header-left">
                      <span class="profile-card-name">王大明</span>
                      <span class="label-badge">本人</span>
                      <span class="default-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span>預設登入</span>
                      </span>
                    </div>
                    <div class="actions-group">
                      <div class="action-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </div>
                      <div class="action-icon" style="color:${THEME.danger};">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div class="profile-info-box">
                    <div class="info-line">身分證號：<strong>A123***789</strong></div>
                    <div class="info-line">出生日期：民國 77 年 05 月 12 日</div>
                    <div class="info-line">手機號碼：0912***456</div>
                  </div>
                </div>

                <!-- Profile 2 -->
                <div class="profile-card">
                  <div class="profile-card-top">
                    <div class="profile-card-header-left">
                      <span class="profile-card-name">李小華</span>
                      <span class="label-badge">配偶</span>
                    </div>
                    <div class="actions-group">
                      <div class="action-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div class="profile-info-box">
                    <div class="info-line">身分證號：<strong>B234***567</strong></div>
                    <div class="info-line">出生日期：民國 79 年 08 月 20 日</div>
                    <div class="info-line">手機號碼：0923***789</div>
                  </div>
                  <div class="set-default-btn">☆ 設為一鍵預設登入身分</div>
                </div>

                <!-- Profile 3 -->
                <div class="profile-card">
                  <div class="profile-card-top">
                    <div class="profile-card-header-left">
                      <span class="profile-card-name">王小寶</span>
                      <span class="label-badge">子女</span>
                    </div>
                    <div class="actions-group">
                      <div class="action-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div class="profile-info-box">
                    <div class="info-line">身分證號：<strong>C198***321</strong></div>
                    <div class="info-line">出生日期：民國 101 年 11 月 03 日</div>
                    <div class="info-line">手機號碼：0933***888</div>
                  </div>
                  <div class="set-default-btn">☆ 設為一鍵預設登入身分</div>
                </div>
              </div>

              <!-- Biometrics Settings -->
              <div class="settings-card">
                <div class="setting-row">
                  <div class="setting-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"></path><path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"></path><path d="M17.29 21.02c.12-.6.14-1.25.14-1.02 0-3-2-5-5-5a4 4 0 0 0-3.8 2.7"></path><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M8.65 22c.21-.66.45-1.32.75-2"></path><path d="M14 13.1a3 3 0 0 0 3-1.1"></path></svg>
                  </div>
                  <div style="flex:1;">
                    <div class="setting-title">生物辨識保護</div>
                    <div class="setting-desc">開啟後存取帳號保險箱需通過身分驗證，保護個資隱私。</div>
                  </div>
                  <div class="switch-toggle">
                    <div class="switch-knob"></div>
                  </div>
                </div>
              </div>

              <!-- Official Support Card -->
              <div class="settings-card">
                <div class="setting-title">官方資源與客服管道</div>
                <div class="link-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${THEME.primary}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <div style="flex:1;">
                    <div class="link-row-text">官方操作說明手冊 (PDF)</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${THEME.textMuted}" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
                <div class="link-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${THEME.accent}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <div style="flex:1;">
                    <div class="link-row-text">運動部活動懶人包 (PDF)</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${THEME.textMuted}" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
                <div class="link-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${THEME.success}" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <div style="flex:1;">
                    <div class="link-row-text">撥打活動客服專線 02-7752-3658</div>
                    <div class="link-subtext">週一至週日 09:00~18:00 (12:00~13:00休息)</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${THEME.textMuted}" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
                <div class="link-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <div style="flex:1;">
                    <div class="link-row-text">線上文字客服小幫手</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${THEME.textMuted}" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
              </div>

              <!-- Author Info Card -->
              <div class="settings-card">
                <div class="author-header-row">
                  <div class="setting-title">非官方 App 作者</div>
                  <div class="author-badge">開源專案</div>
                </div>
                <div class="author-intro">
                  由開發者 patw 因個人需求自製開發，無廣告、零伺服器後端，原始碼完全開源於 GitHub，歡迎前往加顆星支持。
                </div>
                <div class="github-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span>前往 GitHub 查看開源專案</span>
                </div>
              </div>

            </div>

            <!-- Bottom Tab Bar -->
            <div class="tab-bar-container">
              <div class="tab-bar">
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  <span>快速登入</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  <span>官方網頁</span>
                </div>
                <div class="tab-item">
                  <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                  <span>任務週程</span>
                </div>
                <div class="tab-item active">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <span>帳號管理</span>
                </div>
              </div>
              <div class="gesture-home-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// -------------------------------------------------------------
// Generation Pipeline
// -------------------------------------------------------------
const SCREENS = [
  { id: 1, name: 'screenshot_1_quick_login.png', render: renderScreen1 },
  { id: 2, name: 'screenshot_2_autofill.png', render: renderScreen2 },
  { id: 3, name: 'screenshot_3_schedule.png', render: renderScreen3 },
  { id: 4, name: 'screenshot_4_security.png', render: renderScreen4 },
];

function generateScreenshots() {
  console.log('🚀 開始生成 Google Play Store 1:1 實機風格截圖 (1080x1920)...\n');

  const tmpHtmlPath = path.join(__dirname, '..', '.tmp_screenshot.html');

  for (const screen of SCREENS) {
    const outFile = path.join(OUTPUT_DIR, screen.name);
    console.log(`📸 正在渲染 [${screen.id}/4] ${screen.name}...`);

    const htmlContent = screen.render();
    fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf-8');

    const cmd = `"${EDGE_BIN}" --headless --disable-gpu --window-size=1080,1920 --screenshot="${outFile}" "file://${tmpHtmlPath}"`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      const stats = fs.statSync(outFile);
      console.log(`   ✅ 成功生成: ${screen.name} (${Math.round(stats.size / 1024)} KB)`);
    } catch (err) {
      console.error(`   ❌ 渲染失敗: ${screen.name}`, err.message);
    }
  }

  if (fs.existsSync(tmpHtmlPath)) {
    fs.unlinkSync(tmpHtmlPath);
  }

  console.log('\n✨ 所有 Play Store 截圖生成完畢！目錄：play-store-assets/');
}

generateScreenshots();
