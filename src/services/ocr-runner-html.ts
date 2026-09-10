/**
 * 供 WebView 運行的 OCR Runner 內嵌 HTML (方案 B：純視覺可見 HTML5 檔案選取器)
 * 完全零原生相依（無需安裝或重新打包任何原生模組，支援 EAS Update 熱更新）
 * 內嵌 Tesseract.js v7.0.0 (繁中 chi_tra + 英文 eng)
 */

export interface RunnerThemeConfig {
  isDark: boolean;
  primary: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  cardBorder: string;
  backgroundElement: string;
}

export function getOcrRunnerHtml(theme: RunnerThemeConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>OCR Runner</title>
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@v7.0.0/dist/tesseract.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Noto Sans TC", sans-serif;
    }
    .picker-container {
      position: relative;
      width: 100%;
      height: 100%;
      border: 2px dashed ${theme.cardBorder};
      border-radius: 16px;
      background-color: ${theme.cardBg};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.1s ease, opacity 0.1s ease;
    }
    .picker-container:active {
      opacity: 0.85;
      transform: scale(0.99);
    }
    .icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background-color: ${theme.backgroundElement};
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      flex-shrink: 0;
    }
    .icon-circle svg {
      width: 32px;
      height: 32px;
      stroke: ${theme.primary};
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
      color: ${theme.text};
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 12px;
      color: ${theme.textSecondary};
      margin-bottom: 16px;
      line-height: 1.4;
      max-width: 90%;
    }
    .pick-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 22px;
      border-radius: 24px;
      background-color: ${theme.primary};
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(255, 94, 30, 0.25);
    }
    .pick-btn svg {
      width: 18px;
      height: 18px;
      stroke: #ffffff;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* 關鍵：透過 font-size: 500px 讓 WebKit 原生按鈕實體覆蓋整個可視區域，確保點擊必能觸發選檔 */
    #file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.0001;
      font-size: 500px;
      cursor: pointer;
      z-index: 99;
      display: block;
    }
  </style>
</head>
<body>
  <div class="picker-container">
    <div class="icon-circle">
      <svg viewBox="0 0 24 24">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4 4-4 4 4"/>
      </svg>
    </div>
    <div class="title">點此選擇運動紀錄截圖</div>
    <div class="subtitle">支援 Strava、Garmin、Apple 健身、Nike NRC、小米健康等截圖</div>
    <div class="pick-btn">
      <svg viewBox="0 0 24 24">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
      <span>從相簿挑選截圖</span>
    </div>
    <input type="file" id="file-input" accept="image/png, image/jpeg, image/*" />
  </div>

  <script>
    let worker = null;
    let isInitializing = false;

    function sendToNative(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    async function getWorker() {
      if (worker) return worker;
      if (isInitializing) {
        while (isInitializing) {
          await new Promise(r => setTimeout(r, 100));
        }
        if (worker) return worker;
      }
      isInitializing = true;
      try {
        sendToNative({ type: 'STATUS', status: 'LOADING_ENGINE', progress: 0.1 });
        const w = await Tesseract.createWorker(['chi_tra', 'eng'], 1, {
          logger: m => {
            if (m && m.status) {
              sendToNative({
                type: 'PROGRESS',
                status: m.status,
                progress: typeof m.progress === 'number' ? m.progress : undefined
              });
            }
          }
        });
        worker = w;
        sendToNative({ type: 'STATUS', status: 'ENGINE_READY', progress: 0.2 });
        return worker;
      } catch (err) {
        sendToNative({ type: 'ERROR', message: 'Tesseract worker init failed: ' + (err.message || String(err)) });
        throw err;
      } finally {
        isInitializing = false;
      }
    }

    // 優化截圖畫布：支援原生高解析度（至 2400px）、深色模式自動反轉（轉為白底黑字）與彩色圖標淡化
    function prepareCanvas(img, maxLongEdge = 2400) {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;
      const longEdge = Math.max(origWidth, origHeight);
      
      let scale = 1;
      if (longEdge > maxLongEdge) {
        scale = maxLongEdge / longEdge;
      } else if (origWidth < 900 && longEdge * (1080 / origWidth) <= maxLongEdge) {
        // 對於過小或低解析度截圖，適度放大至 1080 寬度以保留中文字形筆畫特徵
        scale = 1080 / origWidth;
      }

      const targetWidth = Math.max(1, Math.round(origWidth * scale));
      const targetHeight = Math.max(1, Math.round(origHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('CANVAS_2D_UNAVAILABLE');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      try {
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        // 取樣計算畫布平均亮度
        let totalLuminance = 0;
        const sampleStep = 16;
        let sampleCount = 0;
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
          totalLuminance += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          sampleCount++;
        }
        const avgLuminance = sampleCount > 0 ? totalLuminance / sampleCount : 128;
        const isDarkTheme = avgLuminance < 115;

        // 若為深色模式截圖，反轉為「白底黑字」（貼合 Tesseract 最佳辨識條件），並淡化彩色圖標
        if (isDarkTheme) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max > 0 ? (max - min) / max : 0;

            let invR = 255 - r;
            let invG = 255 - g;
            let invB = 255 - b;

            // 飽和度大於 25% 的彩色圖標（例如 Google Fit 的藍色跑鞋、Nike 螢光標籤等），
            // 在反轉後淡化至接近白色背景，避免被 Tesseract LSTM 當成深色數字 2 黏連至步數
            if (sat > 0.25) {
              invR = Math.min(255, invR + 120);
              invG = Math.min(255, invG + 120);
              invB = Math.min(255, invB + 120);
            }

            data[i] = invR;
            data[i + 1] = invG;
            data[i + 2] = invB;
          }
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (e) {
        console.warn('Canvas pixel enhancement skipped:', e);
      }

      return {
        canvas,
        width: targetWidth,
        height: targetHeight,
        scaled: scale !== 1,
        origWidth,
        origHeight
      };
    }

    async function processImageFile(file) {
      const reqId = Date.now().toString();
      const startTime = performance.now();
      try {
        sendToNative({ type: 'STATUS', status: 'READING_FILE', id: reqId });

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
          reader.readAsDataURL(file);
        });

        // 立即回傳預覽圖給 React Native 介面顯示
        sendToNative({
          type: 'IMAGE_SELECTED',
          id: reqId,
          dataUrl: dataUrl,
          fileName: file.name,
          fileSize: file.size
        });

        sendToNative({ type: 'PROGRESS', id: reqId, status: 'PREPARING_IMAGE', progress: 0.15 });

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
          img.src = dataUrl;
        });

        const prepStart = performance.now();
        const prep = prepareCanvas(img, 1600);
        const prepareDurationMs = Math.round(performance.now() - prepStart);

        sendToNative({ type: 'PROGRESS', id: reqId, status: 'RECOGNIZING_TEXT', progress: 0.3 });
        const w = await getWorker();

        const recStart = performance.now();
        const ret = await w.recognize(prep.canvas);
        const recognizeDurationMs = Math.round(performance.now() - recStart);
        const totalDurationMs = Math.round(performance.now() - startTime);

        sendToNative({
          type: 'OCR_DONE',
          id: reqId,
          rawText: ret.data.text || '',
          meanConfidence: ret.data.confidence,
          file: {
            width: prep.origWidth,
            height: prep.origHeight,
            scaled: prep.scaled
          },
          durationMs: totalDurationMs,
          prepareDurationMs,
          recognizeDurationMs
        });
      } catch (err) {
        sendToNative({
          type: 'PRECHECK_ERROR',
          id: reqId,
          error: err.message || String(err),
          durationMs: Math.round(performance.now() - startTime)
        });
      } finally {
        const input = document.getElementById('file-input');
        if (input) input.value = '';
      }
    }

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        processImageFile(file);
      }
    });

    sendToNative({ type: 'RUNNER_READY' });

    // 啟動時自動於背景預先暖機載入 Tesseract 引擎
    setTimeout(() => {
      getWorker().catch(() => {});
    }, 500);
  </script>
</body>
</html>
  `;
}
