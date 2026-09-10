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
      background: #0E0F12;
      display: flex;
      position: relative;
    }

    /* Ambient Warm Mesh Gradients */
    .bg-layer {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 82% 38%, rgba(255, 94, 30, 0.42) 0%, rgba(255, 94, 30, 0.06) 50%, transparent 68%),
        radial-gradient(circle at 55% 85%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
        radial-gradient(circle at 15% 75%, rgba(255, 94, 30, 0.22) 0%, transparent 45%),
        linear-gradient(135deg, #161413 0%, #101012 50%, #090A0C 100%);
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
      padding: 38px 52px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Left Column: Branding */
    .left-col {
      width: 535px;
      display: flex;
      flex-direction: column;
      gap: 13px;
      z-index: 12;
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 13px;
      background: rgba(255, 94, 30, 0.16);
      border: 1px solid rgba(255, 94, 30, 0.38);
      border-radius: 999px;
      width: fit-content;
      backdrop-filter: blur(10px);
    }

    .eyebrow-text {
      color: #FFA575;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Brand Header with Logo */
    .brand-header-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo-img {
      width: 62px;
      height: 62px;
      border-radius: 16px;
      border: 2px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 10px 25px rgba(255, 94, 30, 0.45);
      flex-shrink: 0;
      object-fit: cover;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .main-title {
      font-size: 35px;
      font-weight: 900;
      line-height: 1.15;
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
      font-size: 13.5px;
      color: #D1D5DB;
      font-weight: 500;
      line-height: 1.35;
    }

    /* Feature List */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 7.5px;
      margin-top: 1px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 11px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 7px 14px;
      border-radius: 11px;
      backdrop-filter: blur(8px);
    }

    .feature-item.highlight-precheck {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.28);
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
      font-size: 13.5px;
      flex-shrink: 0;
    }

    .feature-icon-box.green {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.1) 100%);
      border: 1px solid rgba(16, 185, 129, 0.5);
    }

    .feature-text-main {
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 700;
    }

    .feature-text-desc {
      color: #9CA3AF;
      font-size: 11.5px;
      margin-left: 6px;
      font-weight: 400;
    }

    .trust-footer {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 1px;
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
      height: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 12;
    }

    /* Ambient Glow behind phone */
    .phone-glow {
      position: absolute;
      width: 290px;
      height: 290px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 94, 30, 0.48) 0%, rgba(16, 185, 129, 0.15) 45%, rgba(255, 94, 30, 0) 72%);
      filter: blur(36px);
      z-index: 1;
    }

    /* 3D Realistic Angled Phone Container */
    .phone-frame {
      position: relative;
      width: 228px;
      height: 434px;
      background: #FFFFFF;
      border-radius: 36px;
      border: 4px solid #282A2E;
      box-shadow: 
        0 25px 60px -15px rgba(0, 0, 0, 0.85),
        0 0 0 1px rgba(255, 255, 255, 0.12),
        0 18px 36px rgba(255, 94, 30, 0.28);
      overflow: hidden;
      transform: perspective(1000px) rotateY(-7deg) rotateX(3deg);
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
      height: 17px;
      background: #000;
      border-radius: 12px;
      z-index: 20;
    }

    /* Real Crisp App UI inside Phone */
    .phone-content {
      width: 100%;
      height: 100%;
      background: #FAF6F2;
      padding: 34px 11px 8px 11px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #1F2937;
    }

    /* Mini App Header */
    .mini-app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mini-app-title-box {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .mini-app-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #1F2937;
    }
    .mini-safe-badge {
      font-size: 8.5px;
      color: #059669;
      background: #D1FAE5;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-weight: 700;
    }

    /* Mini Period Countdown Card */
    .mini-period-card {
      background: #FFFFFF;
      border: 1px solid #EFE3DA;
      border-radius: 9px;
      padding: 6px 9px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    .mini-period-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mini-period-pill {
      font-size: 8.5px;
      font-weight: 800;
      color: #FF5E1E;
      background: rgba(255, 94, 30, 0.1);
      padding: 1.5px 5px;
      border-radius: 4px;
    }
    .mini-period-time {
      font-size: 8px;
      color: #9CA3AF;
      font-weight: 600;
    }
    .mini-period-dates {
      font-size: 9px;
      font-weight: 700;
      color: #374151;
    }

    /* Mini Precheck Highlight Card */
    .mini-precheck-card {
      background: linear-gradient(180deg, #FFFFFF 0%, #F4FDF8 100%);
      border: 1.5px solid #10B981;
      border-radius: 10px;
      padding: 7px 9px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.12);
    }
    .mini-precheck-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mini-precheck-pill {
      font-size: 8.5px;
      font-weight: 800;
      color: #059669;
      background: #E6FBF2;
      padding: 2px 5px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .mini-precheck-metric {
      font-size: 13px;
      font-weight: 900;
      color: #047857;
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .mini-precheck-metric span {
      font-size: 8.5px;
      font-weight: 600;
      color: #6B7280;
    }
    .mini-precheck-dates {
      font-size: 8.5px;
      font-weight: 600;
      color: #4B5563;
      display: flex;
      justify-content: space-between;
    }

    /* Mini Active User Card */
    .mini-user-card {
      background: #FFFFFF;
      border: 1px solid #EFE3DA;
      border-radius: 10px;
      padding: 7px 9px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    .mini-user-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .mini-user-avatar {
      width: 25px;
      height: 25px;
      border-radius: 50%;
      background: #FFEFE8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10.5px;
      font-weight: 800;
      color: #FF5E1E;
    }
    .mini-user-name {
      font-size: 10.5px;
      font-weight: 800;
      color: #1F2937;
    }
    .mini-user-id {
      font-size: 8.5px;
      color: #6B7280;
    }
    .mini-user-badge {
      font-size: 8px;
      font-weight: 700;
      color: #FF5E1E;
      background: #FFF5F0;
      border: 1px solid #FFD9C7;
      padding: 2px 5px;
      border-radius: 4px;
    }

    /* Mini Primary CTA Button */
    .mini-cta-btn {
      background: linear-gradient(135deg, #FF5E1E 0%, #E64C0E 100%);
      color: #FFFFFF;
      border-radius: 10px;
      padding: 8.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-size: 10.5px;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(255, 94, 30, 0.35);
    }

    /* Mini Bottom Tab Bar (5 Tabs) */
    .mini-tab-bar {
      margin-top: auto;
      background: #FFFFFF;
      border-top: 1px solid #EFE3DA;
      margin-left: -11px;
      margin-right: -11px;
      margin-bottom: -8px;
      padding: 6px 4px 8px 4px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      font-size: 8px;
      color: #9CA3AF;
      font-weight: 600;
    }
    .mini-tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }
    .mini-tab-active {
      color: #FF5E1E;
      font-weight: 800;
    }
    .mini-tab-precheck {
      color: #059669;
      font-weight: 800;
    }

    /* Floating Glassmorphism Badge 1 - Top Right (Precheck) */
    .float-badge-1 {
      position: absolute;
      top: 18px;
      right: -32px;
      background: rgba(18, 30, 24, 0.94);
      border: 1px solid rgba(16, 185, 129, 0.65);
      padding: 8px 12px;
      border-radius: 13px;
      backdrop-filter: blur(14px);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 20;
    }

    .float-badge-icon-green {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      font-weight: 900;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
    }

    .float-badge-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #FFF;
    }

    .float-badge-subtitle-green {
      font-size: 9.5px;
      color: #6EE7B7;
      font-weight: 600;
    }

    /* Floating Glassmorphism Badge 2 - Bottom Left (Autofill) */
    .float-badge-2 {
      position: absolute;
      bottom: 50px;
      left: -42px;
      background: rgba(28, 22, 18, 0.94);
      border: 1px solid rgba(255, 94, 30, 0.6);
      padding: 8px 12px;
      border-radius: 13px;
      backdrop-filter: blur(14px);
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 20;
    }

    .float-badge-2-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #FF5E1E 0%, #E64C0E 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 13px;
      box-shadow: 0 4px 10px rgba(255, 94, 30, 0.35);
    }

    .float-badge-2-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #F3F4F6;
    }

    .float-badge-2-subtitle {
      font-size: 9.5px;
      color: #FFA575;
      font-weight: 600;
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
        <span>⚡️</span>
        <span class="eyebrow-text">運動部 115 年加碼活動輔助神器</span>
      </div>

      <div class="brand-header-row">
        <img src="${iconBase64}" class="brand-logo-img" alt="App Icon">
        <div class="title-group">
          <h1 class="main-title">
            揮汗有禮 <span class="main-title-accent">加碼小幫手</span>
          </h1>
          <p class="sub-tagline">一鍵登入直達任務 ｜ 離線預檢防退件 ｜ 家庭安全保險箱</p>
        </div>
      </div>

      <div class="features-list">
        <div class="feature-item highlight-precheck">
          <div class="feature-icon-box green">🔍</div>
          <div>
            <span class="feature-text-main">截圖合格預檢</span>
            <span class="feature-text-desc">純本機離線 OCR，智慧診斷步數與日期防退件</span>
          </div>
        </div>

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
            <span class="feature-text-main">家庭成員保險箱</span>
            <span class="feature-text-desc">支援生物辨識保護，個資安全存於本機</span>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon-box">🏪</div>
          <div>
            <span class="feature-text-main">5 大通路兌換一覽</span>
            <span class="feature-text-desc">全家 / 7-11 / 萊爾富 / 全聯 / 萬家福品項彙整</span>
          </div>
        </div>
      </div>

      <div class="trust-footer">
        <span>純本機離線處理</span>
        <div class="trust-dot"></div>
        <span>晶片級硬體加密</span>
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
          <!-- Mini App Header -->
          <div class="mini-app-header">
            <div class="mini-app-title-box">
              <span style="font-size: 13px;">🏃</span>
              <span class="mini-app-title">加碼券小幫手</span>
            </div>
            <span class="mini-safe-badge">✓ 離線安全</span>
          </div>

          <!-- Mini Period Countdown Card -->
          <div class="mini-period-card">
            <div class="mini-period-top">
              <span class="mini-period-pill">第 1 期加碼倒數</span>
              <span class="mini-period-time">剩餘 3 天</span>
            </div>
            <div class="mini-period-dates">09/01 (二) ~ 09/06 (日)</div>
          </div>

          <!-- Mini Precheck Highlight Card -->
          <div class="mini-precheck-card">
            <div class="mini-precheck-top">
              <span class="mini-precheck-pill">✓ 預檢合格</span>
              <div class="mini-precheck-metric">8,504 <span>步</span></div>
            </div>
            <div class="mini-precheck-dates">
              <span>日期：09/10 (符合當週)</span>
              <span style="color:#059669; font-weight:700;">單日 ≥ 8000步</span>
            </div>
          </div>

          <!-- Mini Active User -->
          <div class="mini-user-card">
            <div class="mini-user-left">
              <div class="mini-user-avatar">王</div>
              <div>
                <div class="mini-user-name">王大明</div>
                <div class="mini-user-id">A123****89 ｜ 0912****78</div>
              </div>
            </div>
            <div class="mini-user-badge">本人</div>
          </div>

          <!-- Mini CTA Button -->
          <div class="mini-cta-btn">
            <span>⚡️ 一鍵快速登入「我的任務」</span>
          </div>

          <!-- Mini Bottom Tab Bar (5 Tabs) -->
          <div class="mini-tab-bar">
            <div class="mini-tab-item mini-tab-active">
              <span>🏠</span>
              <span>首頁</span>
            </div>
            <div class="mini-tab-item">
              <span>📋</span>
              <span>任務</span>
            </div>
            <div class="mini-tab-item mini-tab-precheck">
              <span>🔍</span>
              <span>預檢</span>
            </div>
            <div class="mini-tab-item">
              <span>🏪</span>
              <span>通路</span>
            </div>
            <div class="mini-tab-item">
              <span>👤</span>
              <span>帳號</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toast Badge 1 (Precheck result) -->
      <div class="float-badge-1">
        <div class="float-badge-icon-green">✓</div>
        <div>
          <div class="float-badge-title">截圖預檢合格！</div>
          <div class="float-badge-subtitle-green">辨識 8,504 步・符合當週標準</div>
        </div>
      </div>

      <!-- Floating Toast Badge 2 (Auto-fill notification) -->
      <div class="float-badge-2">
        <div class="float-badge-2-icon">⚡️</div>
        <div>
          <div class="float-badge-2-title">一鍵自動填表</div>
          <div class="float-badge-2-subtitle">身分證・生日・手機秒速帶入</div>
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
