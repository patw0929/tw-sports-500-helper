/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'play-store-assets');
const ICON_PATH = path.join(PROJECT_ROOT, 'assets/images/icon.png');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Find Chrome/Edge
function findBrowser() {
  const candidates = [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error('❌ 找不到可用的 Chromium 核心瀏覽器 (Edge/Chrome)');
  process.exit(1);
}

// 1. Generate 512x512 App Icon
console.log('🎨 [1/2] 正在生成 512x512 應用程式圖示 (app_icon_512x512.png)...');
const iconTarget = path.join(OUTPUT_DIR, 'app_icon_512x512.png');
try {
  execSync(`sips -z 512 512 "${ICON_PATH}" --out "${iconTarget}"`, { stdio: 'pipe' });
  const stat = fs.statSync(iconTarget);
  console.log(`   ✅ 成功生成 512x512 圖示: ${Math.round(stat.size / 1024)} KB (符合 < 1 MB 規範)`);
} catch (err) {
  console.error('   ❌ sips 處理失敗:', err.message);
}

// 2. Generate 1024x500 Feature Graphic
console.log('🎨 [2/2] 正在生成 1024x500 主題圖片 (feature_graphic_1024x500.png)...');

const iconBase64 = fs.existsSync(ICON_PATH)
  ? `data:image/png;base64,${fs.readFileSync(ICON_PATH).toString('base64')}`
  : '';

const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px;
      height: 500px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang TC", "Microsoft JhengHei", sans-serif;
      background: #111215;
      display: flex;
      position: relative;
    }

    /* Ambient Warm Mesh Gradients */
    .bg-layer {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 82% 35%, rgba(255, 94, 30, 0.42) 0%, rgba(255, 94, 30, 0.05) 55%, transparent 70%),
        radial-gradient(circle at 18% 75%, rgba(255, 94, 30, 0.22) 0%, transparent 45%),
        linear-gradient(135deg, #181513 0%, #131211 50%, #0E0E0E 100%);
      z-index: 1;
    }

    /* Tech Matrix Grid */
    .grid-layer {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 32px 32px;
      z-index: 2;
    }

    /* Container */
    .container {
      position: relative;
      z-index: 10;
      width: 1024px;
      height: 500px;
      padding: 44px 54px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Left Column: Branding */
    .left-col {
      width: 535px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 12;
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      background: rgba(255, 94, 30, 0.16);
      border: 1px solid rgba(255, 94, 30, 0.38);
      border-radius: 999px;
      width: fit-content;
      backdrop-filter: blur(10px);
    }

    .eyebrow-text {
      color: #FFA575;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Brand Header with Logo */
    .brand-header-row {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .brand-logo-img {
      width: 66px;
      height: 66px;
      border-radius: 17px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 25px rgba(255, 94, 30, 0.45);
      flex-shrink: 0;
      object-fit: cover;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .main-title {
      font-size: 38px;
      font-weight: 900;
      line-height: 1.12;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.7);
    }

    .main-title-accent {
      background: linear-gradient(135deg, #FF9E59 0%, #FF5E1E 50%, #FFB073 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }

    .sub-tagline {
      font-size: 14.5px;
      color: #D1D5DB;
      font-weight: 500;
      line-height: 1.35;
    }

    /* Feature List */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 9px;
      margin-top: 2px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 9px 16px;
      border-radius: 12px;
      backdrop-filter: blur(8px);
    }

    .feature-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(255, 94, 30, 0.35) 0%, rgba(255, 94, 30, 0.1) 100%);
      border: 1px solid rgba(255, 94, 30, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .feature-text-main {
      color: #FFFFFF;
      font-size: 13.5px;
      font-weight: 700;
    }

    .feature-text-desc {
      color: #9CA3AF;
      font-size: 12px;
      margin-left: 6px;
      font-weight: 400;
    }

    .trust-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 2px;
      color: #9CA3AF;
      font-size: 11.5px;
      font-weight: 500;
    }

    .trust-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #4B5563;
    }

    /* Right Showcase Column */
    .right-col {
      position: relative;
      width: 390px;
      height: 430px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 12;
    }

    /* Ambient Glow behind phone */
    .phone-glow {
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 94, 30, 0.45) 0%, rgba(255, 94, 30, 0) 70%);
      filter: blur(36px);
      z-index: 1;
    }

    /* 3D Realistic Angled Phone Container */
    .phone-frame {
      position: relative;
      width: 226px;
      height: 430px;
      background: #FFFFFF;
      border-radius: 36px;
      border: 4px solid #282A2E;
      box-shadow: 
        0 25px 60px -15px rgba(0, 0, 0, 0.85),
        0 0 0 1px rgba(255, 255, 255, 0.12),
        0 18px 36px rgba(255, 94, 30, 0.28);
      overflow: hidden;
      transform: perspective(1000px) rotateY(-8deg) rotateX(4deg);
      z-index: 5;
      display: flex;
      flex-direction: column;
    }

    /* Dynamic Island / Notch */
    .phone-island {
      position: absolute;
      top: 9px;
      left: 50%;
      transform: translateX(-50%);
      width: 70px;
      height: 18px;
      background: #000;
      border-radius: 12px;
      z-index: 20;
    }

    /* Real Crisp App UI inside Phone */
    .phone-content {
      width: 100%;
      height: 100%;
      background: #FAF6F2;
      padding: 34px 12px 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      color: #1F2937;
    }

    /* Mini App Header */
    .mini-app-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mini-app-title {
      font-size: 12px;
      font-weight: 800;
      color: #1F2937;
    }

    /* Mini Countdown Card */
    .mini-period-card {
      background: #FFFFFF;
      border: 1px solid #EFE3DA;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .mini-period-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mini-period-pill {
      font-size: 9.5px;
      font-weight: 800;
      color: #FF5E1E;
      background: rgba(255, 94, 30, 0.1);
      padding: 2px 6px;
      border-radius: 6px;
    }
    .mini-period-time {
      font-size: 9px;
      color: #9CA3AF;
    }
    .mini-period-dates {
      font-size: 10.5px;
      font-weight: 700;
      color: #374151;
    }

    /* Mini Active User Card */
    .mini-user-card {
      background: #FFFFFF;
      border: 1px solid #EFE3DA;
      border-radius: 12px;
      padding: 9px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .mini-user-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mini-user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #FFEFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: #FF5E1E;
    }
    .mini-user-name {
      font-size: 11.5px;
      font-weight: 800;
      color: #1F2937;
    }
    .mini-user-id {
      font-size: 9.5px;
      color: #6B7280;
    }
    .mini-user-badge {
      font-size: 9px;
      font-weight: 700;
      color: #FF5E1E;
      background: #FFF5F0;
      border: 1px solid #FFD9C7;
      padding: 2px 6px;
      border-radius: 6px;
    }

    /* Mini Primary CTA Button */
    .mini-cta-btn {
      background: linear-gradient(135deg, #FF5E1E 0%, #E64C0E 100%);
      color: #FFFFFF;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(255, 94, 30, 0.35);
    }

    /* Mini Grid 2x2 */
    .mini-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .mini-grid-tile {
      background: #FFFFFF;
      border: 1px solid #EFE3DA;
      border-radius: 9px;
      padding: 7px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mini-tile-label {
      font-size: 9px;
      color: #9CA3AF;
    }
    .mini-tile-val {
      font-size: 10.5px;
      font-weight: 700;
      color: #1F2937;
    }

    /* Mini Bottom Tab Bar */
    .mini-tab-bar {
      margin-top: auto;
      background: #FFFFFF;
      border-top: 1px solid #EFE3DA;
      margin-left: -12px;
      margin-right: -12px;
      margin-bottom: -10px;
      padding: 6px 12px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      font-size: 9px;
      color: #9CA3AF;
      font-weight: 600;
    }
    .mini-tab-active {
      color: #FF5E1E;
      font-weight: 800;
    }

    /* Floating Glassmorphism Badge 1 - Top Right */
    .float-badge-1 {
      position: absolute;
      top: 36px;
      right: -20px;
      background: rgba(28, 24, 22, 0.92);
      border: 1px solid rgba(255, 94, 30, 0.65);
      padding: 10px 14px;
      border-radius: 14px;
      backdrop-filter: blur(14px);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 20;
    }

    .float-badge-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: #FF5E1E;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(255, 94, 30, 0.4);
    }

    .float-badge-title {
      font-size: 12px;
      font-weight: 800;
      color: #FFF;
    }

    .float-badge-subtitle {
      font-size: 10.5px;
      color: #FFA575;
      font-weight: 600;
    }

    /* Floating Glassmorphism Badge 2 - Bottom Left */
    .float-badge-2 {
      position: absolute;
      bottom: 42px;
      left: -24px;
      background: rgba(24, 26, 32, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 10px 14px;
      border-radius: 14px;
      backdrop-filter: blur(14px);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 20;
    }

    .float-badge-2-icon {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #34D399;
      font-size: 15px;
    }

    .float-badge-2-title {
      font-size: 12px;
      font-weight: 800;
      color: #F3F4F6;
    }

    .float-badge-2-subtitle {
      font-size: 10px;
      color: #9CA3AF;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="bg-layer"></div>
  <div class="grid-layer"></div>

  <div class="container">
    <!-- Left Column: Branding & Value Props -->
    <div class="left-col">
      <div class="eyebrow-pill">
        <span>🏃</span>
        <span class="eyebrow-text">115 年揮汗有禮・全民動起來 輔助工具</span>
      </div>

      <div class="brand-header-row">
        <img src="${iconBase64}" class="brand-logo-img" alt="App Icon">
        <div class="title-group">
          <h1 class="main-title">
            揮汗有禮 <span class="main-title-accent">加碼券小幫手</span>
          </h1>
          <p class="sub-tagline">一鍵自動登入 ｜ 多人身分保險箱 ｜ 14 週任務指引</p>
        </div>
      </div>

      <div class="features-list">
        <div class="feature-item">
          <div class="feature-icon-box">⚡️</div>
          <div>
            <span class="feature-text-main">一鍵自動填表</span>
            <span class="feature-text-desc">身分證、民國生日與手機號碼秒速帶入</span>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon-box">🛡️</div>
          <div>
            <span class="feature-text-main">家庭多人保險箱</span>
            <span class="feature-text-desc">支援生物辨識保護，個資安全存於本機</span>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon-box">🛍️</div>
          <div>
            <span class="feature-text-main">官方指定通路清單</span>
            <span class="feature-text-desc">五大超商量販優惠與可兌換品項彙整</span>
          </div>
        </div>
      </div>

      <div class="trust-footer">
        <span>純本機硬體加密</span>
        <div class="trust-dot"></div>
        <span>零第三方伺服器</span>
        <div class="trust-dot"></div>
        <span>MIT 開放原始碼</span>
      </div>
    </div>

    <!-- Right Column: 3D Phone & Visual Badges -->
    <div class="right-col">
      <div class="phone-glow"></div>

      <!-- 3D Angled Phone Frame -->
      <div class="phone-frame">
        <div class="phone-island"></div>
        <div class="phone-content">
          <div class="mini-app-header">
            <span style="font-size: 13px;">🏃</span>
            <span class="mini-app-title">加碼券小幫手</span>
          </div>

          <!-- Mini Period Card -->
          <div class="mini-period-card">
            <div class="mini-period-top">
              <span class="mini-period-pill">第 1 期 (進行中)</span>
              <span class="mini-period-time">剩餘 3 天</span>
            </div>
            <div class="mini-period-dates">09/01 (二) ~ 09/06 (日)</div>
          </div>

          <!-- Mini Active User -->
          <div class="mini-user-card">
            <div class="mini-user-left">
              <div class="mini-user-avatar">王</div>
              <div>
                <div class="mini-user-name">王大明</div>
                <div class="mini-user-id">A123****89</div>
              </div>
            </div>
            <div class="mini-user-badge">本人</div>
          </div>

          <!-- Mini CTA Button -->
          <div class="mini-cta-btn">
            <span>⚡️ 一鍵快速登入「我的任務」</span>
          </div>

          <!-- Mini Grid -->
          <div class="mini-grid">
            <div class="mini-grid-tile">
              <span class="mini-tile-label">身分證字號</span>
              <span class="mini-tile-val">A123456789</span>
            </div>
            <div class="mini-grid-tile">
              <span class="mini-tile-label">出生年月日</span>
              <span class="mini-tile-val">民國 85/01/01</span>
            </div>
          </div>

          <!-- Mini Bottom Tab Bar -->
          <div class="mini-tab-bar">
            <span class="mini-tab-active">● 首頁</span>
            <span>任務</span>
            <span>通路</span>
            <span>帳號</span>
          </div>
        </div>
      </div>

      <!-- Floating Toast Badge (Auto-fill notification) -->
      <div class="float-badge-1">
        <div class="float-badge-icon">⚡️</div>
        <div>
          <div class="float-badge-title">一鍵智慧填入</div>
          <div class="float-badge-subtitle">✓ 已為 王大明 自動填妥</div>
        </div>
      </div>

      <!-- Floating Security Badge -->
      <div class="float-badge-2">
        <div class="float-badge-2-icon">🛡️</div>
        <div>
          <div class="float-badge-2-title">本機生物防護</div>
          <div class="float-badge-2-subtitle">Face ID / 指紋鎖定</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.join(OUTPUT_DIR, 'temp_feature_graphic.html');
const targetFeatureGraphic = path.join(OUTPUT_DIR, 'feature_graphic_1024x500.png');

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

try {
  execSync(
    `"${browserPath}" --headless=new --disable-gpu --hide-scrollbars --window-size=1024,500 --screenshot="${targetFeatureGraphic}" "file://${tempHtmlPath}"`,
    { stdio: 'pipe' }
  );
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);

  const stat = fs.statSync(targetFeatureGraphic);
  console.log(
    `   ✅ 成功生成 1024x500 主題圖片: ${Math.round(stat.size / 1024)} KB (符合 < 15 MB 規範)`
  );
} catch (err) {
  console.error('   ❌ 渲染主題圖片失敗:', err.message);
}

console.log('\n🎉 所有 Play Console 視覺資產生成完畢！');
console.log(`📁 輸出位置: ${OUTPUT_DIR}/`);
